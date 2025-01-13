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

  db.run(`CREATE TABLE IF NOT EXISTS safe_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    safe_name TEXT NOT NULL, -- Название сейфа или кассы
    amount REAL NOT NULL, -- Количество денег
    counted_by TEXT NOT NULL, -- Кто пересчитывал
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP -- Дата и время пересчёта
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_safe TEXT NOT NULL, -- Откуда деньги были взяты
    to_safe TEXT NOT NULL, -- Куда деньги были переложены
    amount REAL NOT NULL, -- Количество денег
    transferred_by TEXT NOT NULL, -- Кто переложил
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP -- Дата и время перекладывания
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS global_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    counted_by TEXT NOT NULL, -- Кто пересчитывал
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- Дата и время пересчёта
    Artioms_safe REAL NOT NULL, -- Деньги в банке
    Ilyas_safe REAL NOT NULL, -- Деньги в большом сейфе
    Main_cash_desk REAL NOT NULL, -- Деньги в основной кассе
    Ofris_cash_desk REAL NOT NULL -- Деньги в кассе Офри
  )`);
  
});

console.log('Database setup completed.');
