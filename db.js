const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./data/kiosk.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

function getProducts(callback) {
  const query = `
    SELECT products.id, products.name, products.price, products.image_url, categories.name AS category 
    FROM products 
    JOIN categories ON products.category_id = categories.id
  `;
  db.all(query, [], callback);
}

function addProduct({ name, price, category_id, image_url }, callback) {
  db.run(
    `INSERT INTO products (name, price, category_id, image_url) VALUES (?, ?, ?, ?)`,
    [name, price, category_id, image_url],
    callback
  );
}

function updateProduct({ id, name, price, image_url, category }, callback) {
  db.get(`SELECT id FROM categories WHERE name = ?`, [category], (err, row) => {
    if (err || !row) {
      callback(err || new Error('Category not found'));
      return;
    }

    const categoryId = row.id;
    db.run(
      `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`,
      [name, price, image_url, categoryId, id],
      callback
    );
  });
}

function deleteProduct(id, callback) {
  db.run(`DELETE FROM products WHERE id = ?`, [id], callback);
}

function getCategories(callback) {
  db.all(`SELECT * FROM categories`, [], callback);
}

function addCategory(name, callback) {
  db.run(`INSERT INTO categories (name) VALUES (?)`, [name], callback);
}

function checkReport(activityType, date, callback) {
  let tableName = getTableName(activityType);
  if (!tableName) {
    callback(new Error('Invalid activity type'));
    return;
  }

  db.get(`SELECT COUNT(*) AS reportCount FROM ${tableName} WHERE date = ?`, [date], callback);
}

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

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  checkReport,
  saveReport
};
