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
  loadSalesData('delivery_own_sales', 'delivery-own-sales-table');
  loadPricesData();
  loadProductsData();
  loadCategoriesData();
  loadRevenueData();
});

// Функция загрузки данных о продажах
async function loadSalesData(tableName, containerId) {
  try {
    const response = await fetch(`/api/sales-data/${tableName}`);
    const salesData = await response.json();
    renderSalesTable(containerId, salesData, tableName.replace('_', ' '));
  } catch (error) {
    console.error(`Error loading ${tableName} data:`, error);
  }
}

// Функция загрузки данных о ценах
async function loadPricesData() {
  try {
    const response = await fetch('/api/prices-data');
    const pricesData = await response.json();
    renderPricesTable('prices-table', pricesData, 'Prices Data');
  } catch (error) {
    console.error("Error loading prices data:", error);
  }
}

// Функция загрузки данных о продуктах
async function loadProductsData() {
  try {
    const response = await fetch('/api/products');
    const productsData = await response.json();
    renderProductsTable('products-table', productsData);
  } catch (error) {
    console.error("Error loading products data:", error);
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
  Object.keys(data).forEach(date => {
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
  Object.keys(data).forEach(date => {
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

// Функция отображения таблицы продуктов
function renderProductsTable(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h2>Products</h2>`;

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Product Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Image URL</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category_name}</td>
      <td>${item.price} ₪</td>
      <td><a href="${item.image_url}" target="_blank">Image</a></td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
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
  data.forEach(item => {
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
