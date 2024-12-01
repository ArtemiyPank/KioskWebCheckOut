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
  loadSalesData('in_store_sales', 'in-store-sales-table');
  loadSalesData('delivery_all_sales', 'delivery-all-sales-table');
  // loadSalesData('delivery_own_sales', 'delivery-own-sales-table');
  loadPricesData();
  loadOverviewCategories(); // Загрузка категорий для фильтра
  loadOverviewProducts(); // Загрузка продуктов для вкладки
  loadCategoriesData();
  loadRevenueData();
});

function isMobile() {
  return window.innerWidth <= 768;
}

// Функция загрузки данных о продажах
async function loadSalesData(tableName, containerId) {
  try {
    const response = await fetch(`/api/sales-data/${tableName}`);
    const salesData = await response.json();

    // Проверка на мобильное устройство
    if (isMobile()) {
      renderHorizontalRows(containerId, salesData, tableName.replace('_', ' '));
    } else {
      renderSalesTable(containerId, salesData, tableName.replace('_', ' '));
    }
  } catch (error) {
    console.error(`Error loading ${tableName} data:`, error);
  }
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
    const categoryFilter = document.getElementById('overview-category-filter');

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
    const products = await response.json();
    displayOverviewProducts(products);
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

// Функция отображения таблицы продаж
function renderSalesTable(containerId, data, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  const headers = Object.keys(data[Object.keys(data)[0]] || {}).sort();

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        ${headers.map(product => `<th>${product}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  Object.keys(data)
    .sort((a, b) => new Date(b) - new Date(a)) // Сортировка дат в порядке убывания
    .forEach(date => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Date">${date}</td>
        ${headers.map(product => `<td data-label="${product}">${data[date][product] || '-'}</td>`).join('')}
      `;
      tbody.appendChild(row);
    });

  table.appendChild(tbody);
  container.appendChild(table);
}



// Функция отображения таблицы цен
function renderPricesTable(containerId, data, title) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>${title}</h2>`;

  const headers = Object.keys(data[Object.keys(data)[0]] || {}).sort();

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        ${headers.map(product => `<th>${product}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  Object.keys(data)
    .sort((a, b) => new Date(b) - new Date(a)) // Сортировка дат в порядке убывания
    .forEach(date => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${date}</td>
        ${headers.map(product => `<td>${data[date][product] || '-'}</td>`).join('')}
      `;
      tbody.appendChild(row);
    });

  table.appendChild(tbody);
  container.appendChild(table);
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
      if(product.IsHide) toggleProductVisibility(product.id);
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
        // Проверяем, были ли продажи (value > 0) перед отображением строки
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
