const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kiosk.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    category_id INTEGER,
    IsHide INTEGER DEFAULT 0,
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
    UNIQUE (product_id, date),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sale_type TEXT NOT NULL,  -- 'in_store' or 'delivery'
    order_number INTEGER NOT NULL,
    UNIQUE (date, product_id, order_number),  -- Prevent overwriting the same product on the same day with the same order number
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);
});

console.log('Database setup completed.');
