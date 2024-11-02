document.addEventListener('DOMContentLoaded', loadProducts);

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

    productElement.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-controls">
        <button onclick="updateCounter(${product.id}, -1, '${product.name}', ${product.price})">-</button>
      </div>
      <div class="product-info">
        <h2>${product.name}</h2>
        <p>Price: ${product.price} ₪</p>
        <span id="counter-${product.id}" class="counter">${count}</span>
      </div>
      <div class="product-controls">
        <button onclick="updateCounter(${product.id}, 1, '${product.name}', ${product.price})">+</button>
      </div>
    `;

    container.appendChild(productElement);
  });
}

function updateCounter(productId, change, productName, productPrice) {
  const counterElement = document.getElementById(`counter-${productId}`);
  let count = parseInt(counterElement.innerText) + change;

  if (count < 0) count = 0;
  counterElement.innerText = count;

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
