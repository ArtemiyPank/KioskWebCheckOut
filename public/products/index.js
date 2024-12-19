// Обычные временные интервалы
const saleTime = [
  { start: 19, end: 22 }, // Продажи за столом с 19:00 до 22:00
  { start: 12.75, end: 14, day: 5 } // Продажи в пятницу с 12:45 до 14:00
];
const deliveryTime = [
  { start: 16, end: 19 }, // Доставки с 16:00 до 19:00
  { start: 22, end: 23 } // Доставки с 22:00 до 23:00
];

function isWithinTimeRange(type) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentDay = now.getDay(); // 0 - воскресенье, 6 - суббота

  if (type === 'in_store') {
    return saleTime.some(range => {
      if (range.day !== undefined && range.day !== currentDay) {
        return false;
      }
      return currentHour >= range.start && currentHour < range.end;
    });
  } else if (type === 'delivery') {
    return deliveryTime.some(range => currentHour >= range.start && currentHour < range.end);
  }

  return false; // Если тип не указан
}

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
    localStorage.setItem('categories', JSON.stringify(categories));

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
    sortProducts('desc');
    currentSortOrder = 'desc';
    sortArrow.classList.add('sort-desc');
  } else {
    sortProducts('asc');
    currentSortOrder = 'asc';
    sortArrow.classList.remove('sort-desc');
  }

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

// Функция для сохранения данных о продажах в localStorage
function saveSalesDataToLocalStorage(productId, productName, productPrice, quantitySold) {
  const salesData = getSalesDataFromLocalStorage();
  salesData[productId] = { name: productName, price: productPrice, soldToday: quantitySold };
  localStorage.setItem('salesData', JSON.stringify(salesData));
}

// Функция для получения данных о продажах из localStorage
function getSalesDataFromLocalStorage() {
  const data = localStorage.getItem('salesData');
  return data ? JSON.parse(data) : {};
}

// Функция для сохранения отчета
async function saveReport(saleType) {
  const date = new Date().toISOString().split('T')[0]; // Текущая дата

  // Получаем данные о продажах из localStorage
  const salesData = getSalesDataFromLocalStorage();
  const products = Object.keys(salesData).map(productId => ({
    product_id: parseInt(productId),
    quantity: salesData[productId].soldToday
  })).filter(item => item.quantity > 0);

  if (products.length === 0) {
    alert("No sales data to save.");
    closeReportModal(); // Закрываем модальное окно
    return;
  }

  // Проверяем, находится ли время в допустимом интервале
  if (!isWithinTimeRange(saleType)) {
    const hebrewText = saleType === 'in_store'
      ? "זה לא הזמן למכירות בשולחן. האם אתה בטוח שלחצת על הכפתור הנכון?"
      : "זה לא הזמן למשלוחים. האם אתה בטוח שלחצת על הכפתור הנכון?";

    const russianText = saleType === 'in_store'
      ? "Сейчас не время для продаж ЗА СТОЛОМ, ты точно нажал правильную кнопку?"
      : "Сейчас не время для ДОСТАВОК, ты точно нажал правильную кнопку?";

    showTimeRangeModal(hebrewText, russianText,
      () => executeSaveReport(products, saleType, date),
      () => {
        showNotification("Operation cancelled.", true)
        closeReportModal(); // Закрываем модальное окно
      });
    return;
  }

  executeSaveReport(products, saleType, date);
}

async function executeSaveReport(products, saleType, date) {
  try {
    // Отправка отчета на сервер
    const response = await fetch('/api/save-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ saleType, date, products })
    });

    if (response.ok) {
      showNotification('Report saved successfully!', false);
      localStorage.removeItem('salesData'); // Сброс локальных данных после сохранения
      loadProducts();  // Загружаем данные о продуктах
      closeReportModal(); // Закрываем модальное окно
    } else {
      const errorText = await response.text();
      alert(`Failed to save report: ${errorText}`);
    }
  } catch (error) {
    console.error('Error saving report:', error);
    alert('An error occurred while saving the report. Please try again.');
  }
}


function showTimeRangeModal(hebrewText, russianText, onConfirm, onCancel) {
  const modal = document.getElementById('time-range-modal');
  const hebrewElement = document.getElementById('time-range-modal-text-hebrew');
  const russianElement = document.getElementById('time-range-modal-text-russian');
  const confirmButton = document.getElementById('time-range-modal-confirm');
  const cancelButton = document.getElementById('time-range-modal-cancel');

  

  // Устанавливаем текст
  hebrewElement.textContent = hebrewText;
  russianElement.textContent = russianText;

  // Показываем модальное окно
  modal.style.display = 'block';

  // Добавляем обработчики событий
  confirmButton.onclick = () => {
    modal.style.display = 'none';
    onConfirm();
  };

  cancelButton.onclick = () => {
    modal.style.display = 'none';
    onCancel();
  };
}




function showNotification(message, isNegative = false) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.classList.add('notification');
  if (isNegative) {
    notification.classList.add('negative-notification');
  } else {
    notification.classList.add('positive-notification');
  }
  document.body.appendChild(notification);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
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


