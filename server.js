const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json()); // Поддержка JSON в теле запроса

app.use(express.static(path.join(__dirname, 'public')));

const productsFilePath = path.join(__dirname, 'data', 'products.json');
const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

// Эндпоинт для получения списка товаров
app.get('/api/products', (req, res) => {
  fs.readFile(productsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading products file:', err);
      return res.status(500).send('Error reading products file');
    }
    res.json(JSON.parse(data));
  });
});

// Эндпоинт для добавления нового товара
app.post('/api/products', (req, res) => {
  const newProduct = req.body;

  fs.readFile(productsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading products file:', err);
      return res.status(500).send('Error reading products file');
    }

    const products = JSON.parse(data);
    newProduct.id = products.length ? products[products.length - 1].id + 1 : 1;
    newProduct.soldToday = 0;

    products.push(newProduct);

    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
      if (err) {
        console.error('Error writing products file:', err);
        return res.status(500).send('Error writing products file');
      }
      res.status(201).json(newProduct);
    });
  });
});

// Эндпоинт для получения списка категорий
app.get('/api/categories', (req, res) => {
  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories file:', err);
      return res.status(500).send('Error reading categories file');
    }
    res.json(JSON.parse(data));
  });
});

// Эндпоинт для добавления новой категории
app.post('/api/categories', (req, res) => {
  const newCategory = req.body.category;

  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories file:', err);
      return res.status(500).send('Error reading categories file');
    }

    const categories = JSON.parse(data);
    
    // Проверяем, если категория уже существует
    if (categories.includes(newCategory)) {
      return res.status(400).json({ message: "Category already exists." });
    }

    categories.push(newCategory);

    fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), (err) => {
      if (err) {
        console.error('Error writing categories file:', err);
        return res.status(500).send('Error writing categories file');
      }
      res.status(201).json({ category: newCategory });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
