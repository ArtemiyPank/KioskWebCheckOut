// add_product.js

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-product-button').addEventListener('click', addNewProduct);
  document.getElementById('add-category-button').addEventListener('click', addNewCategory);

  loadCategories(); // Загрузка категорий при загрузке страницы
});

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error("Failed to fetch categories");

    const categories = await response.json();
    localStorage.setItem('categories', JSON.stringify(categories)); // Сохраняем корректно

    const categorySelect = document.getElementById('category-select');
    categorySelect.innerHTML = '<option value="">Select a category</option>';

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id; // Используем ID категории
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function addNewCategory() {
  const newCategory = document.getElementById('new-category').value.trim();
  if (!newCategory) {
    alert("Please enter a category name.");
    return;
  }

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newCategory })
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json();
        alert(data.message);
      } else {
        throw new Error("Failed to add category");
      }
      return;
    }

    alert("Category added successfully!");
    document.getElementById('new-category').value = ''; // Очистить поле
    loadCategories(); // Обновляем список категорий
  } catch (error) {
    console.error("Error adding category:", error);
    alert(`Error adding category: ${error.message}`);
  }
}

async function addNewProduct() {
  const name = document.getElementById('name').value;
  const price = parseFloat(document.getElementById('price').value);
  const category = parseInt(document.getElementById('category-select').value);
  const image_url = document.getElementById('image').value;

  if (!name || isNaN(price) || !category || !image_url) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const newProduct = { name, price, category_id: category, image_url };

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProduct)
    });

    if (!response.ok) throw new Error(`Failed to add product: ${response.status} ${response.statusText}`);
    alert("Product added successfully!");
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error adding product:", error);
    alert(`Error adding product: ${error.message}`);
  }
}
