const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/kiosk.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

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

// Функция для обновления информации о продукте в базе данных
function updateProduct({ id, name, price, image_url, category_id }, callback) {
  db.run(
    `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`,
    [name, price, image_url, category_id, id],
    callback
  );
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

// Сохранение отчета в базе данных
function saveReport(activityType, date, products, callback) {
  let tableName = getTableName(activityType);
  if (!tableName) {
    callback(new Error('Invalid activity type'));
    return;
  }

  db.serialize(() => {
    products.forEach(product => {
      db.get(
        `SELECT COUNT(*) AS priceCount FROM prices WHERE product_id = ? AND date = ?`,
        [product.product_id, date],
        (err, row) => {
          if (!err && row.priceCount === 0) {
            db.run(
              `INSERT INTO prices (product_id, date, price) 
              SELECT id, ?, price FROM products WHERE id = ?`,
              [date, product.product_id]
            );
          }
        }
      );
    });

    const stmt = db.prepare(`INSERT INTO ${tableName} (date, product_id, quantity) VALUES (?, ?, ?)`);
    products.forEach(product => {
      stmt.run([date, product.product_id, product.quantity]);
    });
    stmt.finalize(callback);
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
