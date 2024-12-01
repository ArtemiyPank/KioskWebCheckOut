let isEditing = false; // Переменная для отслеживания режима (редактирование/добавление)
let currentProductId = null; // Текущий ID продукта для редактирования


// Закрытие модального окна при клике вне его
window.onclick = function (event) {
    const modal = document.getElementById('edit-product-modal');
    if (event.target === modal) {
        closeEditModal();
    }
};


// Открытие модального окна для добавления новой категории
function openAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'block';
}

// Закрытие модального окна для добавления новой категории
function closeAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'none';
}


async function openAddProductModal() {
    isEditing = false;
    currentProductId = null;
    document.getElementById('modal-title').innerText = 'Add New Product';

    document.getElementById('edit-name').value = '';
    document.getElementById('edit-price').value = '';

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error("Failed to fetch categories");

        const categories = await response.json();
        const categorySelect = document.getElementById('edit-category');
        categorySelect.innerHTML = '';

        // Устанавливаем category.id как значение option
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id; // Используем category.id, а не category.name
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        openEditModal();
    } catch (error) {
        console.error("Error loading categories:", error);
        alert("Failed to load categories. Please try again.");
    }
}

async function editProduct(productId) {
    isEditing = true;
    document.getElementById('modal-title').innerText = 'Edit Product';

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error("Failed to fetch categories");

        const categories = await response.json();
        const categorySelect = document.getElementById('edit-category');
        categorySelect.innerHTML = '';

        // Устанавливаем category.id как значение option
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id; // Используем category.id, а не category.name
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        currentProductId = productId;

        // Получаем информацию о продукте
        const product = document.querySelector(`.product[data-id="${productId}"]`);
        if (!product) throw new Error("Product element not found in the DOM.");

        const name = product.querySelector('h2').innerText;
        const price = parseFloat(product.querySelector('.product-info p').innerText.replace('Price: ', '').replace('₪', ''));
        const imageUrl = product.querySelector('img').src;

        const category = product.getAttribute('data-category-id');

        document.getElementById('edit-name').value = name;
        document.getElementById('edit-price').value = price;
        document.getElementById('current-image').src = imageUrl;
        document.getElementById('edit-category').value = category;

        openEditModal();
    } catch (error) {
        console.error("Error loading categories or product details:", error);
        alert("Failed to load product details. Please try again.");
    }
}


// Функция для переключения видимости продукта
async function toggleProductVisibility(productId) {
    const productElement = document.querySelector(`.product[data-id="${productId}"]`);
    if (!productElement) {
        console.error("Product element not found.");
        return;
    }

    // Получаем текущее состояние видимости
    const isCurrentlyHidden = productElement.classList.contains('hidden');

    // Отправляем запрос на сервер для обновления состояния видимости
    try {
        const response = await fetch(`/api/products/${productId}/toggle-visibility`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isHidden: isCurrentlyHidden ? 0 : 1 }) // 1 для скрытия, 0 для показа
        });

        if (!response.ok) throw new Error("Failed to update product visibility.");

        // Обновляем внешний вид продукта и текст кнопки
        productElement.classList.toggle('hidden', !isCurrentlyHidden);
        const toggleButton = productElement.querySelector('.hide-btn-container button');
        toggleButton.textContent = isCurrentlyHidden ? 'Hide' : 'Show';

        console.log(`Product ${isCurrentlyHidden ? 'shown' : 'hidden'} successfully.`);
    } catch (error) {
        console.error("Error toggling product visibility:", error);
        alert("Failed to update product visibility.");
    }
}


// Функция для удаления продукта
async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`Failed to delete product: ${response.status} ${response.statusText}`);
        alert("Product deleted successfully!");
        loadOverviewProducts(); // Перезагрузка списка продуктов после удаления
    } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Error deleting product: ${error.message}`);
    }
}

// Открытие модального окна редактирования продукта
function openEditModal() {
    document.getElementById('edit-product-modal').style.display = 'block';
}

// Закрытие модального окна редактирования продукта
function closeEditModal() {
    document.getElementById('edit-product-modal').style.display = 'none';
}

// Закрытие модального окна при клике вне его
window.onclick = function (event) {
    const modal = document.getElementById('edit-product-modal');
    if (event.target === modal) {
        closeEditModal();
    }
};

// Сохранение изменений или добавление нового продукта
document.getElementById('save-changes-button').addEventListener('click', async () => {
    const name = document.getElementById('edit-name').value.trim();
    const price = parseFloat(document.getElementById('edit-price').value);
    const category_id = document.getElementById('edit-category').value;
    const imageFile = document.getElementById('edit-image-file').files[0];
    const imageUrl = imageFile ? null : document.getElementById('current-image').src; 
    

    if (!name || isNaN(price) || !category_id) {
        alert("Please fill in all fields.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category_id", category_id);

    if (imageFile) {
        formData.append("image", imageFile);
    } else if (imageUrl) {
        formData.append("image_url", imageUrl); 
    }

    const url = isEditing ? `/api/products/${currentProductId}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            body: formData,
        });

        if (!response.ok) throw new Error(`Failed to ${isEditing ? 'edit' : 'add'} product`);
        alert(`Product ${isEditing ? 'updated' : 'added'} successfully!`);
        closeEditModal();
        loadOverviewProducts();
    } catch (error) {
        console.error(`Error ${isEditing ? 'editing' : 'adding'} product:`, error);
        alert(`Error ${isEditing ? 'editing' : 'adding'} product: ${error.message}`);
    }
});

document.getElementById('edit-image-file').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('current-image');
  
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
  
      reader.onload = function (e) {
        imagePreview.src = e.target.result;  
      };
  
      // Считываем файл как DataURL
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = '';
    }
  });
  


// Обработчик для кнопки сохранения новой категории
document.getElementById('save-category-button').addEventListener('click', async () => {
    const categoryName = document.getElementById('category-name').value.trim();

    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: categoryName })
        });

        if (!response.ok) throw new Error("Failed to add category.");

        alert("Category added successfully!");
        closeAddCategoryModal();
        loadCategoriesData(); // Обновить список категорий после добавления
    } catch (error) {
        console.error("Error adding category:", error);
        alert("An error occurred while adding the category.");
    }
});
