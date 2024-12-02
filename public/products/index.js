let currentProducts = [];
let currentSortOrder = 'asc';

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();  // Загружаем категории при загрузке страницы
  loadProducts();    // Загружаем все товары
});

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error("Failed to fetch categories");

    const categories = await response.json();
    localStorage.setItem('categories', categories);

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

    currentProducts = await response.json();
    sortProducts(currentSortOrder)
    const cachedCounters = getSalesDataFromLocalStorage();
    displayProducts(currentProducts, cachedCounters);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(products, cachedCounters) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach(product => {
    const count = cachedCounters[product.id]?.soldToday || 0;

    if (product.IsHide != 1 || count != 0) {
      const productElement = document.createElement('div');
      productElement.classList.add('product');
      productElement.setAttribute('data-id', product.id);
      productElement.setAttribute('data-category', product.category_name);
      productElement.setAttribute('data-category-id', product.category_id);

      productElement.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <div class="product-info">
          <h2>${product.name}</h2>
          <p>Price: ${product.price} ₪</p>
        </div>
        <div class="product-controls">
          <div class="counter-container">
            <button onclick="updateCounter(${product.id}, -1, '${product.name}', ${product.price})">-</button>
            <input 
              id="counter-${product.id}" 
              class="counter" 
              type="number" 
              min="0" 
              value="${count}" 
              onchange="updateCounterDirectly(${product.id}, this.value, '${product.name}', ${product.price})">
            <button onclick="updateCounter(${product.id}, 1, '${product.name}', ${product.price})">+</button>
          </div>
        </div>
      `;

      container.appendChild(productElement);
    }
  });

  filterProductsByCategory(); // Применяем фильтр категорий после отображения
}


function toggleSortOrder() {
  const sortArrow = document.getElementById('sort-arrow');
  const cachedCounters = getSalesDataFromLocalStorage();

  // Переключение порядка сортировки
  if (currentSortOrder === 'asc') {
    // если сейчас сортировка по возрастанию, то при переключении должна быть сортировка по убыванию
    sortProducts('desc');
    currentSortOrder = 'desc';
    sortArrow.classList.add('sort-desc');
  } else {
    // если сейчас сортировка по убыванию, то при переключении должна быть сортировка по возрастанию
    sortProducts('asc');
    currentSortOrder = 'asc';
    sortArrow.classList.remove('sort-desc');
  }

  // Обновление отображения продуктов
  displayProducts(currentProducts, cachedCounters);
}

// Сортировка продуктов
function sortProducts(sortType) {
  if (sortType === 'asc') {
    currentProducts.sort((a, b) => a.price - b.price);
  } else if (sortType === 'desc') {
    currentProducts.sort((a, b) => b.price - a.price);
  }
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

function updateCounterDirectly(productId, value, productName, productPrice) {
  const count = Math.max(0, parseInt(value) || 0);
  document.getElementById(`counter-${productId}`).value = count;

  saveSalesDataToLocalStorage(productId, productName, productPrice, count);
}

function updateCounter(productId, change, productName, productPrice) {
  const counterElement = document.getElementById(`counter-${productId}`);
  let count = parseInt(counterElement.value) + change;

  if (count < 0) count = 0;
  counterElement.value = count;

  saveSalesDataToLocalStorage(productId, productName, productPrice, count);
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

// Открытие модального окна
function openReportModal() {
  const modal = document.getElementById('report-modal');
  modal.style.display = 'block';
}

// Закрытие модального окна
function closeReportModal() {
  const modal = document.getElementById('report-modal');
  modal.style.display = 'none';
}

async function saveReport(activityType) {
  // const activityType = document.getElementById('activity-type').value;
  const date = new Date().toISOString().split('T')[0]; // Текущая дата

  // Получаем данные о продажах из localStorage
  const salesData = getSalesDataFromLocalStorage();
  const products = Object.keys(salesData).map(productId => ({
    product_id: parseInt(productId),
    quantity: salesData[productId].soldToday
  })).filter(item => item.quantity > 0);

  if (products.length === 0) {
    alert("No sales data to save.");
    return;
  }

  try {
    // Отправка нового отчета
    const response = await fetch('/api/save-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activityType, date, products })
    });

    if (response.ok) {
      alert('Report saved successfully!');
      localStorage.removeItem('salesData'); // Сброс локальных данных после сохранения
      loadProducts()
      closeReportModal()
    } else {
      const errorText = await response.text();
      alert(`Failed to save report: ${errorText}`);
    }
  } catch (error) {
    console.error('Error saving report:', error);
    alert('An error occurred while saving the report. Please try again.');
  }
}
