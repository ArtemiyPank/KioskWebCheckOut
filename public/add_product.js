// add_product.js

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-product-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      await addNewProduct();
    });
  });
  
  async function addNewProduct() {
    // Получаем данные из формы
    const name = document.getElementById('name').value;
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const image = document.getElementById('image').value;
  
    const newProduct = { name, price, category, image };
  
    try {
      // Отправляем запрос на сервер для добавления товара
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      });
  
      if (!response.ok) {
        // Если статус ответа не OK, выбрасываем ошибку
        throw new Error(`Failed to add product: ${response.status} ${response.statusText}`);
      }
  
      // Если товар добавлен успешно, показываем сообщение и перенаправляем на главную страницу
      alert("Product added successfully!");
      window.location.href = 'index.html'; // Переход на главную страницу
  
    } catch (error) {
      // Обработка ошибки: выводим сообщение об ошибке
      console.error("Error adding product:", error);
      alert(`Error adding product: ${error.message}`);
    }
  }
  