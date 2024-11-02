const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Настройка для раздачи статических файлов из папки "public"
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json()); // Поддержка JSON в теле запроса

const productsFilePath = path.join(__dirname, 'data', 'products.json');

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
    newProduct.soldToday = 0; // Начальное значение для счётчика продаж

    products.push(newProduct); // Добавляем новый товар

    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
      if (err) {
        console.error('Error writing products file:', err);
        return res.status(500).send('Error writing products file');
      }
      res.status(201).json(newProduct); // Успешный ответ с данными нового товара
    });
  });
});


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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
