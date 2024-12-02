const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database('./data/kiosk.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});


// Функция для получения продукта по ID
function getProductById(id, callback) {
  db.get(`SELECT image_url FROM products WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Error fetching product image:', err);
      return callback(err);
    }
    callback(null, row);
  });
}


// Получение списка всех продуктов с названием категории
function getProducts(callback) {
  const query = `
    SELECT products.id, products.name, products.price, products.image_url, IsHide, products.category_id, categories.name AS category_name 
    FROM products 
    JOIN categories ON products.category_id = categories.id
  `;
  db.all(query, [], callback);
}

// Добавление нового продукта в базу данных
function addProduct({ name, price, category_id, image_url }, callback) {
  db.run(
    `INSERT INTO products (name, price, category_id, image_url) VALUES (?, ?, ?, ?)`,
    [name, price, category_id, image_url],
    callback
  );
}


// Функция для создания безопасного имени файла из названия товара
function generateImageName(productsName) {
  let name = productsName
    .toLowerCase() // Преобразуем в нижний регистр
    .replace(/[^a-z0-9\s-]/g, '') // Убираем все символы, кроме букв, цифр и пробелов
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-'); // Заменяем несколько дефисов подряд на один

  name += '-' + Date.now(); // метка времени (в миллисекундах) для уникальности
  return name;
}


// Функция для удаления старого изображения и сохранении нового имени)
function handleImageUpdate(id, name, imageFile, callback) {
  // Получаем старое изображение из базы данных
  getProductById(id, (err, row) => {
    if (err) {
      return callback(err);
    }

    const oldImagePath = row ? path.join(__dirname, 'public', row.image_url) : null;

    // Если старое изображение существует, удаляем его
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error('Error deleting old image:', err);
        }
      });
    }
    const newImageName = generateImageName(name) + path.extname(imageFile.originalname);

    const newImagePath = path.join(__dirname, 'public', 'images', newImageName);

    // Сохраняем файл под новым именем
    fs.rename(imageFile.path, newImagePath, (err) => {
      if (err) {
        console.error('Error saving new image:', err);
        return callback(err);
      }

      callback(null, newImageName);
    });
  });
}

// Функция для обновления информации о продукте в базе данных
function updateProduct({ id, name, price, image_url, category_id, imageFile }, callback) {
  handleImageUpdate(id, name, imageFile, (err, newImageName) => {
    if (err) {
      return callback(err);
    }

    // Обновляем продукт в базе данных
    db.run(
      `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`,
      [name, price, '/images/' + newImageName, category_id, id],
      callback
    );
  });
}



// Функция для обновления видимости продукта
function toggleProductVisibility(productId, isHidden, callback) {
  db.run(
    `UPDATE products SET IsHide = ? WHERE id = ?`,
    [isHidden, productId],
    function (err) {
      callback(err);
    }
  );
}


// Удаление продукта из базы данных
function deleteProduct(id, callback) {
  db.run(`DELETE FROM products WHERE id = ?`, [id], callback);
}

// Получение списка всех категорий
function getCategories(callback) {
  db.all(`SELECT id, name FROM categories`, [], callback);
}

// Добавление новой категории в базу данных
function addCategory(name, callback) {
  db.run(`INSERT INTO categories (name) VALUES (?)`, [name], callback);
}

// Проверка наличия отчета за указанный день
function checkReport(activityType, date, callback) {
  let tableName = getTableName(activityType);
  if (!tableName) {
    callback(new Error('Invalid activity type'));
    return;
  }

  db.get(`SELECT COUNT(*) AS reportCount FROM ${tableName} WHERE date = ?`, [date], callback);
}

function saveReport(activityType, date, products, callback) {
  const tableName = getTableName(activityType);
  if (!tableName) {
    callback(new Error('Invalid activity type'));
    return;
  }

  db.serialize(() => {
    // Обработка продаж
    const upsertStmt = db.prepare(`
      INSERT INTO ${tableName} (date, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(date, product_id)
      DO UPDATE SET quantity = quantity + excluded.quantity
    `);

    let completed = 0;
    products.forEach(product => {
      upsertStmt.run([date, product.product_id, product.quantity], (err) => {
        if (err) {
          console.error("Error saving sales data:", err.message);
        }
        finish();
      });
    });

    function finish() {
      completed++;
      if (completed === products.length) {
        // Финализируем выражение только после завершения всех запросов
        upsertStmt.finalize(callback);
      }
    }
  });
}


// Удаление существующего отчета
function deleteReport(activityType, date, callback) {
  const tableName = getTableName(activityType);
  if (!tableName) {
    callback(new Error('Invalid activity type'));
    return;
  }

  db.run(`DELETE FROM ${tableName} WHERE date = ?`, [date], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null, { message: "Report deleted successfully" });
    }
  });
}

// Сохранение или обновление цен для всех товаров на указанную дату
function savePricesForDate(date, callback) {
  db.serialize(() => {
    db.all(`SELECT id AS product_id, price FROM products`, [], (err, products) => {
      if (err) {
        callback(err);
        return;
      }

      products.forEach(product => {
        db.get(
          `SELECT * FROM prices WHERE product_id = ? AND date = ?`,
          [product.product_id, date],
          (err, row) => {
            if (err) {
              return;
            }

            if (row) {
              db.run(
                `UPDATE prices SET price = ? WHERE product_id = ? AND date = ?`,
                [product.price, product.product_id, date]
              );
            } else {
              db.run(
                `INSERT INTO prices (product_id, date, price) VALUES (?, ?, ?)`,
                [product.product_id, date, product.price]
              );
            }
          }
        );
      });
    });
  });

  if (callback) callback();
}

// Определение таблицы на основе типа активности
function getTableName(activityType) {
  switch (activityType) {
    case 'in_store':
      return 'in_store_sales';
    case 'delivery_all':
      return 'delivery_all_sales';
    case 'delivery_own':
      return 'delivery_own_sales';
    default:
      return null;
  }
}

// Получение данных о продажах
function getSalesDataForTable(tableName, callback) {
  const query = `
    SELECT dates.date, products.name AS product_name, COALESCE(sales.quantity, 0) AS quantity
    FROM (
      SELECT DISTINCT date FROM ${tableName}
    ) AS dates
    CROSS JOIN products
    LEFT JOIN ${tableName} AS sales ON sales.date = dates.date AND sales.product_id = products.id
    ORDER BY dates.date, products.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);

    const formattedData = {};
    rows.forEach(row => {
      if (!formattedData[row.date]) formattedData[row.date] = {};
      formattedData[row.date][row.product_name] = row.quantity || '-';
    });
    callback(null, formattedData);
  });
}

// Получение данных о ценах
function getPricesDataFormatted(callback) {
  const query = `
    SELECT dates.date, products.name AS product_name, COALESCE(prices.price, '-') AS price
    FROM (
      SELECT DISTINCT date FROM prices
    ) AS dates
    CROSS JOIN products
    LEFT JOIN prices ON prices.date = dates.date AND prices.product_id = products.id
    ORDER BY dates.date, products.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);

    const formattedData = {};
    rows.forEach(row => {
      if (!formattedData[row.date]) formattedData[row.date] = {};
      formattedData[row.date][row.product_name] = row.price;
    });
    callback(null, formattedData);
  });
}

// Получение данных о выручке
function getRevenueByDate(callback) {
  const query = `
    SELECT sales.date, SUM(sales.quantity * prices.price) AS total_revenue
    FROM (
      SELECT date, product_id, quantity FROM in_store_sales
      UNION ALL
      SELECT date, product_id, quantity FROM delivery_all_sales
      UNION ALL
      SELECT date, product_id, quantity FROM delivery_own_sales
    ) AS sales
    JOIN prices ON sales.product_id = prices.product_id AND sales.date = prices.date
    GROUP BY sales.date
    ORDER BY sales.date;
  `;

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  toggleProductVisibility,
  deleteProduct,
  getCategories,
  addCategory,
  checkReport,
  saveReport,
  deleteReport,
  savePricesForDate,
  getTableName,
  getSalesDataForTable,
  getPricesDataFormatted,
  getRevenueByDate,
};
