const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kiosk.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    category_id INTEGER,
    IsHide INTEGER DEFAULT 0,  -- IsHide с дефолтным значением 0
    FOREIGN KEY (category_id) REFERENCES categories (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    date DATE,
    price REAL,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS in_store_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS delivery_all_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS delivery_own_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);
});

console.log('Database setup completed.');
