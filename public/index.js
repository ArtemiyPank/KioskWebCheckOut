document.addEventListener('DOMContentLoaded', () => {
  loadCategories();  // Загружаем категории при загрузке страницы
  loadProducts();    // Загружаем все товары
});

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error("Failed to fetch categories");

    const categories = await response.json();
    const categoryFilter = document.getElementById('category-filter');

    // Очистка существующих элементов перед добавлением новых
    categoryFilter.innerHTML = `
      <label>
        <input type="radio" name="category" value="all" checked>
        All
      </label>
    `;

    // Добавляем радиокнопки для каждой категории
    categories.forEach(cat => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="radio" name="category" value="${cat.name}">
        ${cat.name}
      `;
      categoryFilter.appendChild(label);
    });

    // Добавляем обработчик для изменения категории
    categoryFilter.addEventListener('change', filterProductsByCategory);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}


async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error("Failed to fetch products");

    const products = await response.json();
    const cachedCounters = getSalesDataFromLocalStorage();
    displayProducts(products, cachedCounters);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(products, cachedCounters) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach(product => {
    const count = cachedCounters[product.id]?.soldToday || 0;

    const productElement = document.createElement('div');
    productElement.classList.add('product');
    productElement.setAttribute('data-id', product.id); // Добавьте этот атрибут
    productElement.setAttribute('data-category', product.category);

    productElement.innerHTML = `
      <img src="${product.image_url}" alt="${product.name}">
      <div class="product-info">
        <h2>${product.name}</h2>
        <p>Price: ${product.price} ₪</p>
      </div>
      <div class="product-controls">
        <div class="counter-container">
          <button onclick="updateCounter(${product.id}, -1, '${product.name}', ${product.price})">-</button>
          <span id="counter-${product.id}" class="counter">${count}</span>
          <button onclick="updateCounter(${product.id}, 1, '${product.name}', ${product.price})">+</button>
        </div>

        <div class="edit-btn-container">
          <button onclick="editProduct(${product.id})">Edit</button>
          <button onclick="deleteProduct(${product.id})">Delete</button>
        </div>
      </div>
    `;

    container.appendChild(productElement);
  });

  filterProductsByCategory(); // Применяем фильтр категорий после отображения
}



function filterProductsByCategory() {
  const selectedCategory = document.querySelector('input[name="category"]:checked').value;
  const products = document.querySelectorAll('.product');

  products.forEach(product => {
    const productCategory = product.getAttribute('data-category');
    if (selectedCategory === 'all' || productCategory === selectedCategory) {
      product.style.display = 'block';
    } else {
      product.style.display = 'none';
    }
  });
}

function updateCounter(productId, change, productName, productPrice) {
  const counterElement = document.getElementById(`counter-${productId}`);
  let count = parseInt(counterElement.innerText) + change;

  if (count < 0) count = 0;
  counterElement.innerText = count;

  saveSalesDataToLocalStorage(productId, productName, productPrice, count);
}

let currentProductId;

async function editProduct(productId) {

  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error("Failed to fetch categories");

  const categories = await response.json();
  const categorySelect = document.getElementById('edit-category');
  categorySelect.innerHTML = '';

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  currentProductId = productId;
  const product = document.querySelector(`.product[data-id="${productId}"]`);
  const name = product.querySelector('h2').innerText;
  const price = parseFloat(product.querySelector('.product-info p').innerText.replace('Price: ', '').replace('₪', ''));
  const imageUrl = product.querySelector('img').src;
  const category = product.getAttribute('data-category');

  document.getElementById('edit-name').value = name;
  document.getElementById('edit-price').value = price;
  document.getElementById('edit-image-url').value = imageUrl;
  document.getElementById('edit-category').value = category;

  openEditModal();
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error(`Failed to delete product: ${response.status} ${response.statusText}`);
    alert("Product deleted successfully!");
    loadProducts(); // Перезагрузка списка продуктов после удаления
  } catch (error) {
    console.error("Error deleting product:", error);
    alert(`Error deleting product: ${error.message}`);
  }
}

function openEditModal() {
  document.getElementById('edit-product-modal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('edit-product-modal').style.display = 'none';
}

document.getElementById('save-changes-button').addEventListener('click', async () => {
  const newName = document.getElementById('edit-name').value;
  const newPrice = parseFloat(document.getElementById('edit-price').value);
  const newImageUrl = document.getElementById('edit-image-url').value;
  const newCategory = document.getElementById('edit-category').value;

  if (!newName || isNaN(newPrice) || !newImageUrl || !newCategory) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch(`/api/products/${currentProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName, price: newPrice, image_url: newImageUrl, category: newCategory })
    });

    if (!response.ok) throw new Error(`Failed to edit product: ${response.status} ${response.statusText}`);
    alert("Product updated successfully!");
    closeEditModal();
    loadProducts();
  } catch (error) {
    console.error("Error editing product:", error);
    alert(`Error editing product: ${error.message}`);
  }
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
  const modal = document.getElementById('edit-product-modal');
  if (event.target === modal) {
    closeEditModal();
  }
}


function saveSalesDataToLocalStorage(productId, productName, productPrice, quantitySold) {
  const salesData = getSalesDataFromLocalStorage();
  salesData[productId] = { name: productName, price: productPrice, soldToday: quantitySold };
  localStorage.setItem('salesData', JSON.stringify(salesData));
}

function getSalesDataFromLocalStorage() {
  const data = localStorage.getItem('salesData');
  return data ? JSON.parse(data) : {};
}
