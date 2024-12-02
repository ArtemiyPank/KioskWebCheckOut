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
    sortProducts(currentSortOrder);
    displayProducts(currentProducts);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach(product => {

    if (product.IsHide != 1) {
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
      `;

      container.appendChild(productElement);
    }
  });

  filterProductsByCategory(); // Применяем фильтр категорий после отображения
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
  displayProducts(currentProducts);
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
      product.style.display = 'flex';
    } else {
      product.style.display = 'none';
    }
  });
}
