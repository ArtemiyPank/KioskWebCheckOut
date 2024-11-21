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
