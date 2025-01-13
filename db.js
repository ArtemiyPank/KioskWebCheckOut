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

    // Проверяем, было ли передано новое изображение
    if (!imageFile) {
      return callback(null, row.image_url); // Возвращаем старый путь, если новое изображение отсутствует
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

// Функция для генерации номера заказа на основе текущей даты
function generateOrderNumber(date, callback) {
  db.get(`SELECT MAX(order_number) AS maxOrder FROM sales WHERE date = ?`, [date], (err, row) => {
    if (err) {
      return callback(err);
    }

    // Если заказов за этот день еще нет, начинаем с 1
    const orderNumber = row ? row.maxOrder + 1 : 1;
    callback(null, orderNumber);
  });
}

// Функция для сохранения продаж с типом (in_store или delivery)
function saveReport(date, products, saleType, callback) {
  // Проверка корректности типа продажи
  if (saleType !== 'in_store' && saleType !== 'delivery') {
    return callback(new Error('Invalid sale type'));
  }

  // Генерация номера заказа для текущего дня
  generateOrderNumber(date, (err, orderNumber) => {
    if (err) {
      return callback(err);
    }

    const upsertStmt = db.prepare(`
      INSERT INTO sales (date, product_id, quantity, sale_type, order_number)
      VALUES (?, ?, ?, ?, ?)
    `);

    let completed = 0;
    products.forEach(product => {
      upsertStmt.run([date, product.product_id, product.quantity, saleType, orderNumber], (err) => {
        if (err) {
          console.error("Error saving sales data:", err.message);
        }
        finish();
      });
    });

    function finish() {
      completed++;
      if (completed === products.length) {
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



// Получение данных о продажах для всех типов продаж (in_store и delivery) из таблицы sales
function getSalesDataForTable(callback) {
  const query = `
    SELECT sales.date, products.name AS product_name, COALESCE(sales.quantity, 0) AS quantity, sales.sale_type
    FROM sales
    JOIN products ON sales.product_id = products.id
    ORDER BY sales.date, products.name, sales.sale_type
  `;

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);

    const formattedData = {};
    rows.forEach(row => {
      if (!formattedData[row.date]) formattedData[row.date] = {};

      // Если для этой даты уже есть данные для данного продукта, добавляем количество
      if (!formattedData[row.date][row.product_name]) {
        formattedData[row.date][row.product_name] = {
          in_store: 0,
          delivery: 0
        };
      }

      // Добавляем количество в соответствующий тип продажи
      formattedData[row.date][row.product_name][row.sale_type] += row.quantity;
    });

    callback(null, formattedData);
  });
}


function getPricesDataFormatted(callback) {
  const query = `
    SELECT prices.date, products.name AS product_name, COALESCE(prices.price, '-') AS price
    FROM prices
    LEFT JOIN products ON prices.product_id = products.id
    ORDER BY prices.date, products.name
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
      SELECT 
      sales.date,
      SUM(sales.quantity * prices.price) AS total_revenue,
      SUM(CASE WHEN sales.sale_type = 'delivery' THEN sales.quantity * prices.price ELSE 0 END) AS delivery_revenue,
      SUM(CASE WHEN sales.sale_type = 'in_store' THEN sales.quantity * prices.price ELSE 0 END) AS in_store_revenue
    FROM sales
    JOIN prices ON sales.product_id = prices.product_id AND sales.date = prices.date
    GROUP BY sales.date
    ORDER BY sales.date;
  `;

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}


// Добавление записи о пересчёте сейфа
function addSafeCount({ safe_name, amount, counted_by }, callback) {
  const query = `
    INSERT INTO safe_counts (safe_name, amount, counted_by) 
    VALUES (?, ?, ?)
  `;
  db.run(query, [safe_name, amount, counted_by], function (err) {
    if (err) {
      console.error('Error adding safe count:', err.message);
      return callback(err);
    }
    callback(null, { id: this.lastID });
  });
}

// Добавление записи о перекладывании денег
function addTransfer({ from_safe, to_safe, amount, transferred_by }, callback) {
  const query = `
    INSERT INTO transfers (from_safe, to_safe, amount, transferred_by) 
    VALUES (?, ?, ?, ?)
  `;
  db.run(query, [from_safe, to_safe, amount, transferred_by], function (err) {
    if (err) {
      console.error('Error adding transfer:', err.message);
      return callback(err);
    }
    callback(null, { id: this.lastID });
  });
}

// Добавление записи о глобальном пересчёте
function addGlobalCount({ counted_by, Artioms_safe, Ilyas_safe, Main_cash_desk, Ofris_cash_desk }, callback) {
  const query = `
    INSERT INTO global_counts (counted_by, Artioms_safe, Ilyas_safe, Main_cash_desk, Ofris_cash_desk) 
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [counted_by, Artioms_safe, Ilyas_safe, Main_cash_desk, Ofris_cash_desk], function (err) {
    if (err) {
      console.error('Error adding global count:', err.message);
      return callback(err);
    }
    callback(null, { id: this.lastID });
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
  getSalesDataForTable,
  getPricesDataFormatted,
  getRevenueByDate,
  addSafeCount,
  addTransfer,
  addGlobalCount,
};
