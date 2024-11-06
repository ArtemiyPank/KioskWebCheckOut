const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.post('/api/products', (req, res) => {
  db.addProduct(req.body, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding product');
    } else {
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  });
});

app.put('/api/products/:id', (req, res) => {
  db.updateProduct({ ...req.body, id: req.params.id }, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error updating product');
    } else {
      res.status(200).send('Product updated successfully');
    }
  });
});

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

app.post('/api/save-report', (req, res) => {
  db.saveReport(req.body.activityType, req.body.date, req.body.products, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error saving report');
    } else {
      res.status(201).send('Report and prices saved successfully');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
