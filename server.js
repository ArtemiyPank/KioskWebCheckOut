
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./data/kiosk.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Эндпоинт для получения товаров
app.get('/api/products', (req, res) => {
  const query = `
    SELECT products.id, products.name, products.price, products.image_url, categories.name AS category 
    FROM products 
    JOIN categories ON products.category_id = categories.id
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error retrieving products');
    } else {
      res.json(rows);
    }
  });
});

// Эндпоинт для добавления товара
app.post('/api/products', (req, res) => {
  const { name, price, category_id, image_url } = req.body;
  db.run(
    `INSERT INTO products (name, price, category_id, image_url) VALUES (?, ?, ?, ?)`,
    [name, price, category_id, image_url],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error adding product');
      } else {
        res.status(201).json({ id: this.lastID, name, price, category_id, image_url });
      }
    }
  );
});

// Эндпоинт для обновления товара с изображением и категорией
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, image_url, category } = req.body;

  // Получаем ID категории по её названию
  db.get(`SELECT id FROM categories WHERE name = ?`, [category], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error retrieving category ID');
      return;
    }

    if (!row) {
      res.status(400).send('Category not found');
      return;
    }

    const categoryId = row.id;

    db.run(
      `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`,
      [name, price, image_url, categoryId, id],
      function (err) {
        if (err) {
          console.error(err.message);
          res.status(500).send('Error updating product');
        } else if (this.changes === 0) {
          res.status(404).send('Product not found');
        } else {
          res.status(200).send('Product updated successfully');
        }
      }
    );
  });
});


// Эндпоинт для удаления товара
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error deleting product');
    } else if (this.changes === 0) {
      res.status(404).send('Product not found');
    } else {
      res.status(200).send('Product deleted successfully');
    }
  });
});

// Эндпоинт для получения списка категорий
app.get('/api/categories', (req, res) => {
  db.all(`SELECT * FROM categories`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error retrieving categories');
    } else {
      res.json(rows);
    }
  });
});

// Эндпоинт для добавления новой категории
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  db.run(
    `INSERT INTO categories (name) VALUES (?)`,
    [name],
    function (err) {
      if (err) {
        console.error(err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).send('Category already exists');
        } else {
          res.status(500).send('Error adding category');
        }
      } else {
        res.status(201).json({ id: this.lastID, name });
      }
    }
  );
});


// Эндпоинт для проверки существования отчета за сегодняшний день
app.get('/api/check-report', (req, res) => {
  const { activityType, date } = req.query;

  let tableName = '';
  switch (activityType) {
    case 'in_store':
      tableName = 'in_store_sales';
      break;
    case 'delivery_all':
      tableName = 'delivery_all_sales';
      break;
    case 'delivery_own':
      tableName = 'delivery_own_sales';
      break;
    default:
      return res.status(400).send('Invalid activity type');
  }

  db.get(
    `SELECT COUNT(*) AS reportCount FROM ${tableName} WHERE date = ?`,
    [date],
    (err, row) => {
      if (err) {
        console.error('Error checking report:', err.message);
        res.status(500).send('Error checking report');
      } else {
        res.json({ reportExists: row.reportCount > 0 });
      }
    }
  );
});



// Эндпоинт для сохранения отчета
app.post('/api/save-report', (req, res) => {
  const { activityType, date, products } = req.body;

  let tableName = '';
  switch (activityType) {
    case 'in_store':
      tableName = 'in_store_sales';
      break;
    case 'delivery_all':
      tableName = 'delivery_all_sales';
      break;
    case 'delivery_own':
      tableName = 'delivery_own_sales';
      break;
    default:
      return res.status(400).send('Invalid activity type');
  }

  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO ${tableName} (date, product_id, quantity) VALUES (?, ?, ?)`);
    products.forEach(product => {
      stmt.run([date, product.product_id, product.quantity], (err) => {
        if (err) {
          console.error('Error saving report:', err.message);
        }
      });
    });
    stmt.finalize();
    res.status(201).send('Report saved successfully');
  });
});


// Эндпоинт для удаления отчета за сегодняшний день
app.delete('/api/delete-report', (req, res) => {
  const { activityType, date } = req.query;

  let tableName = '';
  switch (activityType) {
    case 'in_store':
      tableName = 'in_store_sales';
      break;
    case 'delivery_all':
      tableName = 'delivery_all_sales';
      break;
    case 'delivery_own':
      tableName = 'delivery_own_sales';
      break;
    default:
      return res.status(400).send('Invalid activity type');
  }

  db.run(
    `DELETE FROM ${tableName} WHERE date = ?`,
    [date],
    function (err) {
      if (err) {
        console.error('Error deleting report:', err.message);
        res.status(500).send('Error deleting report');
      } else {
        res.status(200).send('Report deleted successfully');
      }
    }
  );
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});