let currentProducts = [];
let currentSortOrder = 'asc';

// Функция для открытия вкладок
function openTab(event, tabId) {
  const tabContents = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-button');

  tabContents.forEach(content => content.classList.remove('active'));
  tabButtons.forEach(button => button.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Загрузка всех таблиц при готовности DOM
document.addEventListener('DOMContentLoaded', () => {
  loadOverviewCategories(); // Загрузка категорий для фильтра
  loadOverviewProducts(); // Загрузка продуктов для вкладки
  loadCategoriesData(); // Загрузка данных о категориях
  loadRevenueData(); // Загрузка данных о выручке

  // Загрузка данных для разных типов продаж
  loadSalesData('all', 'all-sales-table');  // Все продажи
  loadSalesData('in_store', 'in-store-sales-table');  // Продажи в магазине
  loadSalesData('delivery', 'delivery-sales-table');  // Доставка
  loadPricesData()
});



function isMobile() {
  return window.innerWidth <= 768;
}

// Функция загрузки данных о продажах
async function loadSalesData(saleType, tableId) {
  try {
    const response = await fetch(`/api/sales-data`);
    const salesData = await response.json();
    
    if (!salesData) {
      console.error("No sales data available.");
      return;
    }
    
    const filteredData = filterSalesByType(salesData, saleType);

    // Проверяем, существует ли контейнер
    const container = document.getElementById(tableId);
    if (!container) {
      console.error(`Container with id "${tableId}" not found!`);
      return;
    }

    // Рендерим таблицу с данными о продажах
    renderSalesTable(tableId, filteredData, `${saleType.charAt(0).toUpperCase() + saleType.slice(1)} Sales`);
  } catch (error) {
    console.error("Error loading sales data:", error);
  }
}



// Функция фильтрации данных по типу продажи
function filterSalesByType(salesData, saleType = 'all') {
  const filteredData = {};

  // Если saleType === 'all', обрабатываем и in_store, и delivery
  const saleTypes = saleType === 'all' ? ['in_store', 'delivery'] : [saleType];

  saleTypes.forEach(type => {
    Object.keys(salesData).forEach(date => {
      if (!filteredData[date]) {
        filteredData[date] = {};
      }
      Object.keys(salesData[date]).forEach(product => {
        if (salesData[date][product][type] !== undefined) {
          if (!filteredData[date][product]) {
            filteredData[date][product] = 0; // Инициализируем количество
          }
          filteredData[date][product] += salesData[date][product][type]; // Добавляем количество для этого типа
        }
      });
    });
  });

  return filteredData;
}



// Функция загрузки данных о ценах
async function loadPricesData() {
  try {
    const response = await fetch('/api/prices-data');
    const pricesData = await response.json();

    // Проверка на мобильное устройство
    if (isMobile()) {
      renderHorizontalRows('prices-table', pricesData, 'Prices Data');
    } else {
      renderPricesTable('prices-table', pricesData, 'Prices Data');
    }
  } catch (error) {
    console.error("Error loading prices data:", error);
  }
}



async function loadOverviewCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    const categoryFilter = document.getElementById('category-filter');

    // Очищаем и добавляем категории в фильтр
    categoryFilter.innerHTML = `
      <label>
        <input type="radio" name="overview-category" value="all" checked>
        All
      </label>
    `;

    categories.forEach(cat => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="radio" name="overview-category" value="${cat.name}">
        ${cat.name}
      `;
      categoryFilter.appendChild(label);
    });

    categoryFilter.addEventListener('change', filterOverviewProductsByCategory);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}


// Загрузка продуктов для вкладки Products
async function loadOverviewProducts() {
  try {
    const response = await fetch('/api/products');
    currentProducts = await response.json();
    sortProducts(currentSortOrder)
    displayOverviewProducts(currentProducts);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Функция загрузки данных о категориях
async function loadCategoriesData() {
  try {
    const response = await fetch('/api/categories');
    const categoriesData = await response.json();
    renderListTable('categories-table', categoriesData, 'Categories');
  } catch (error) {
    console.error("Error loading categories data:", error);
  }
}

// Функция загрузки данных о выручке
async function loadRevenueData() {
  try {
    const response = await fetch('/api/revenue-data');
    const revenueData = await response.json();
    renderRevenueTable('revenue-table', revenueData);
  } catch (error) {
    console.error("Error loading revenue data:", error);
  }
}

// Функция отображения таблицы продаж с вертикальным отображением товаров
function renderSalesTable(containerId, salesData, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  // Получаем список всех товаров (первый столбец)
  const allProducts = currentProducts.map(product => product.name); // Используем `currentProducts` для списка всех продуктов

  // Создаем контейнер для таблицы с горизонтальной прокруткой
  const tableContainer = document.createElement('div');
  tableContainer.classList.add('table-container');

  const table = document.createElement('table');
  table.classList.add('table');

  // Заголовок с датами (столбцы)
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Product</th>` + 
    Object.keys(salesData).sort().map(date => `<th>${date}</th>`).join('');
  table.appendChild(headerRow);

  // Строки для каждого товара
  allProducts.forEach(productName => {
    const row = document.createElement('tr');

    // Первый столбец — название продукта
    row.innerHTML = `<td class="product-column">${productName}</td>` + 
      Object.keys(salesData).sort().map(date => {
        const quantity = salesData[date][productName] || '-'; // Показываем количество или '-' если данных нет
        return `<td>${quantity}</td>`;
      }).join('');

    table.appendChild(row);
  });

  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
}

// Функция для вычисления количества дней между двумя датами
function getDaysBetweenDates(date1, date2) {
  const startDate = new Date(date1);
  const endDate = new Date(date2);

  const differenceInMilliseconds = Math.abs(endDate - startDate);
  return Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));
}

// Функция для вычитания дней из заданной даты
function subtractDaysFromDate(date, days) {
  const inputDate = new Date(date);
  inputDate.setDate(inputDate.getDate() - days);
  return inputDate.toISOString().split('T')[0];
}

// Генерация всех возможных дат до отображения отчёта с учетом диапазонов
function getAllDates(pricesData) {
  const allDates = Object.keys(pricesData).sort(); // Собираем все даты
  const currentDate = new Date().toISOString().split('T')[0]; // Текущая дата
  const allGeneratedDates = [];

  let lastValidDate = null;
  let lastValidPrice = null;

  // Перебираем все даты и добавляем промежуточные даты между ними
  allDates.forEach((date, index) => {
    if (date <= currentDate) {
      if (lastValidDate !== null && getDaysBetweenDates(date, lastValidDate) > 1) {
        allGeneratedDates.pop();
        allGeneratedDates.push({
          startDate: lastValidDate,
          endDate: subtractDaysFromDate(date, 1),
          price: lastValidPrice,
          isRange: true // Это диапазон
        });
      }

      // Добавляем текущую дату и ее цену в список
      allGeneratedDates.push({
        startDate: date,
        endDate: date,
        price: pricesData[date],
        isRange: false // Это не диапазон, а конкретная дата
      });

      lastValidDate = date;
      lastValidPrice = pricesData[date];
    }
  });

  // Если последняя дата в данных меньше текущей, добавляем диапазон до сегодняшней даты
  if (lastValidDate && lastValidDate !== currentDate) {
    allGeneratedDates.push({
      startDate: lastValidDate,
      endDate: currentDate,
      price: lastValidPrice,
      isRange: true
    });
  }

  return allGeneratedDates;
}




// Функция отображения таблицы цен с диапазоном дат до текущей даты
function renderPricesTable(containerId, pricesData, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  const allProducts = currentProducts.map(product => product.name);

  // Создаем контейнер для таблицы с горизонтальной прокруткой
  const tableContainer = document.createElement('div');
  tableContainer.classList.add('table-container');

  const table = document.createElement('table');
  table.classList.add('table');

  // Получаем все уникальные даты с диапазонами
  const allGeneratedDates = getAllDates(pricesData);

  // Заголовок с датами (столбцы)
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Product</th>` + allGeneratedDates.map(date => 
    `<th>${date.startDate}${date.isRange ? ' - ' + date.endDate : ''}</th>`
  ).join('');
  table.appendChild(headerRow);

  // Строки для каждого товара
  allProducts.forEach(productName => {
    const row = document.createElement('tr');
    row.innerHTML = `<td class="product-column">${productName}</td>` + 
      generatePriceColumns(allGeneratedDates, pricesData, productName);
    table.appendChild(row);
  });

  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
}


// Генерация столбцов цен с учетом отсутствующих данных и диапазонов дат
function generatePriceColumns(allGeneratedDates, pricesData, productName) {
  let lastPrice = null; // Цена последнего доступного значения
  let lastDate = null;  // Дата последнего доступного значения

  return allGeneratedDates.map(date => {
    // Если это диапазон, то извлекаем цену из этого диапазона
    let price = null;

    // Проверяем, если цена для конкретного продукта существует на данной дате
    if (date.isRange) {
      price = date.price[productName];  // Извлекаем цену для конкретного продукта в диапазоне
    } else {
      price = pricesData[date.startDate] && pricesData[date.startDate][productName];  // Извлекаем цену для конкретного продукта на одиночной дате
    }

    if (price) {
      // Если цена для даты существует, обновляем lastPrice
      lastPrice = price;
      lastDate = date.startDate;
      return `<td>${price}</td>`;
    } else {
      // Если нет записи для этой даты, показываем диапазон дат с предыдущей ценой
      if (lastPrice !== null) {
        return `<td>${lastDate} - ${date.startDate} (${lastPrice})</td>`;
      }
      return `<td>-</td>`;
    }
  }).join('');
}



// Отображение продуктов на вкладке Products
function displayOverviewProducts(products) {
  const container = document.getElementById('overview-products-container');
  container.innerHTML = ''; // Очистка контейнера

  products.forEach(product => {
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
          <div class="edit-btn-container">
              <button onclick="editProduct('${product.id}')">Edit</button>
              <button onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
          <div class="hide-btn-container">
              <button onclick="toggleProductVisibility('${product.id}')">${product.IsHide ? 'Show' : 'Hide'}</button>
          </div>
      `;
    container.appendChild(productElement);
    if (product.IsHide) toggleProductVisibility(product.id);
  });
}


// Фильтрация продуктов по категориям
function filterOverviewProductsByCategory() {
  const selectedCategory = document.querySelector('input[name="overview-category"]:checked').value;
  const products = document.querySelectorAll('#overview-products-container .product');

  products.forEach(product => {
    const productCategory = product.getAttribute('data-category');
    product.style.display = (selectedCategory === 'all' || productCategory === selectedCategory) ? 'block' : 'none';
  });
}

function toggleSortOrder() {
  const sortArrow = document.getElementById('sort-arrow');

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
  displayOverviewProducts(currentProducts);
}

// Сортировка продуктов
function sortProducts(sortType) {
  if (sortType === 'asc') {
    currentProducts.sort((a, b) => a.price - b.price);
  } else if (sortType === 'desc') {
    currentProducts.sort((a, b) => b.price - a.price);
  }
}

// Функция отображения таблицы выручки
function renderRevenueTable(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>Total Revenue</h2>`;

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Total Revenue</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  data
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Сортировка дат в порядке убывания
    .forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.date}</td>
        <td>${item.total_revenue} ₪</td>
      `;
      tbody.appendChild(row);
    });

  table.appendChild(tbody);
  container.appendChild(table);
}


function renderHorizontalRows(containerId, data, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  Object.keys(data)
    .sort((a, b) => new Date(b) - new Date(a)) // Сортировка дат в порядке убывания
    .forEach(date => {
      const daySeparator = document.createElement('div');
      daySeparator.classList.add('day-separator');
      daySeparator.textContent = date;
      container.appendChild(daySeparator);

      Object.entries(data[date]).forEach(([productName, value]) => {
        if (value > 0) {
          const row = document.createElement('div');
          row.classList.add('horizontal-row');

          const productNameEl = document.createElement('div');
          productNameEl.classList.add('product-name');
          productNameEl.textContent = productName;

          const productValueEl = document.createElement('div');
          productValueEl.classList.add('product-value');
          productValueEl.textContent = value;

          row.appendChild(productNameEl);
          row.appendChild(productValueEl);
          container.appendChild(row);
        }
      });
    });
}



// Функция для отображения списка таблиц (для категорий и других списков)
function renderListTable(containerId, data, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
