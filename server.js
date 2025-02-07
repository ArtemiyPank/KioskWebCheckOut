const express = require('express');
const path = require('path');
const db = require('./db');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/images'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получение списка продуктов
app.get('/api/products', (req, res) => {
  db.getProducts((err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error retrieving products');
    } else {
      res.json(rows);
    }
  });
});

// Добавление нового продукта с изображением
app.post('/api/products', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  const imageUrl = req.file ? `/images/${req.file.filename}` : null;

  db.addProduct({ name, price, category_id, image_url: imageUrl }, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding product');
    } else {
      res.status(201).json({ id: this.lastID, name, price, category_id, image_url: imageUrl });
    }
  });
});

// Обновление информации о продукте
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  const imageFile = req.file; // Мидлвар multer обрабатывает файлы и добавляет их в req.file
  const imageUrl = imageFile ? `/images/${imageFile.filename}` : req.body.image_url;

  db.updateProduct({ id: req.params.id, name, price, image_url: imageUrl, category_id, imageFile }, (err) => {
    if (err) {
      console.error('Error updating product:', err.message);
      res.status(500).send('Error updating product');
    } else {
      res.status(200).send('Product updated successfully');
    }
  });
});

// Эндпоинт для скрытия или показа продукта
app.put('/api/products/:id/toggle-visibility', (req, res) => {
  const { id } = req.params;
  const { isHidden } = req.body;

  if (typeof isHidden !== 'number' || (isHidden !== 0 && isHidden !== 1)) {
    return res.status(400).send('Invalid value for isHidden. Must be 0 or 1.');
  }

  db.toggleProductVisibility(id, isHidden, (err) => {
    if (err) {
      console.error("Error updating product visibility:", err.message);
      res.status(500).send('Error updating product visibility');
    } else {
      res.status(200).send('Product visibility updated successfully');
    }
  });
});

// Удаление продукта
app.delete('/api/products/:id', (req, res) => {
  db.deleteProduct(req.params.id, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error deleting product');
    } else {
      res.status(200).send('Product deleted successfully');
    }
  });
});

// Получение списка категорий
app.get('/api/categories', (req, res) => {
  db.getCategories((err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error retrieving categories');
    } else {
      res.json(rows);
    }
  });
});

// Добавление новой категории
app.post('/api/categories', (req, res) => {
  db.addCategory(req.body.name, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding category');
    } else {
      res.status(201).json({ id: this.lastID, name: req.body.name });
    }
  });
});

// Проверка существования отчета
app.get('/api/check-report', (req, res) => {
  db.checkReport(req.query.activityType, req.query.date, (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error checking report');
    } else {
      res.json({ reportExists: row.reportCount > 0 });
    }
  });
});



// Удаление отчета
app.delete('/api/delete-report', (req, res) => {
  const { activityType, date } = req.query;

  db.deleteReport(activityType, date, (err, result) => {
    if (err) {
      console.error("Error deleting report:", err.message);
      res.status(500).send("Error deleting report");
    } else {
      res.status(200).send(result.message);
    }
  });
});

// Сохранение отчета и цен на товары
app.post('/api/save-report', (req, res) => {
  const { saleType, date, products } = req.body;

  // Сохранение цен для товаров на указанную дату
  db.savePricesForDate(date, (err) => {
    if (err) {
      res.status(500).send('Error saving prices');
      return;
    }

    // Сохранение отчета о продажах в таблицу sales
    db.saveReport(date, products, saleType, (err) => {
      if (err) {
        console.error("Error saving sales report:", err.message);
        res.status(500).send('Error saving report');
      } else {
        res.status(201).send('Report and prices saved successfully');
      }
    });
  });
});


// Получение данных о продажах
app.get('/api/sales-data', (req, res) => {
  db.getSalesDataForTable((err, data) => {
    if (err) {
      console.error("Error in receiving sales data:", err.message);
      res.status(500).send("Error in receiving sales data");
    } else {
      res.json(data);
    }
  });
});


// Получение данных о ценах
app.get('/api/prices-data', (req, res) => {
  db.getPricesDataFormatted((err, data) => {
    if (err) {
      console.error("Error in obtaining price data:", err.message);
      res.status(500).send("Error in obtaining price data");
    } else {
      res.json(data);
    }
  });
});


// Получение данных о выручке по дате
app.get('/api/revenue-data', (req, res) => {
  db.getRevenueByDate((err, rows) => {
    if (err) {
      console.error("Error when receiving revenue data:", err.message);
      res.status(500).send("Error when receiving revenue data");
    } else {
      res.json(rows);
    }
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Page for overview: http://localhost:${PORT}/menu/menu.html`)
  console.log(`Page for products: http://localhost:${PORT}/products/index.html`)
  console.log(`Page for overview: http://localhost:${PORT}/admin/overview.html`)
});
