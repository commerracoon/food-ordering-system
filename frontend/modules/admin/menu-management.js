/**
 * Admin Menu Management - Categories and Menu Items CRUD
 */

let currentTab = 'categories';
let categoriesData = [];
let menuItemsData = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated() || getUserType() !== 'admin') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Display admin name
    const userName = getUserName();
    document.getElementById('admin-name').textContent = `Admin: ${userName}`;

    // Load initial data
    await loadCategories();
    await loadMenuItems();
});

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    const categoriesTab = document.getElementById('categories-tab');
    const menuItemsTab = document.getElementById('menu-items-tab');
    const categoriesSection = document.getElementById('categories-section');
    const menuItemsSection = document.getElementById('menu-items-section');
    
    if (tab === 'categories') {
        categoriesTab.classList.add('border-blue-600', 'text-blue-600');
        categoriesTab.classList.remove('border-transparent', 'text-gray-600');
        menuItemsTab.classList.remove('border-blue-600', 'text-blue-600');
        menuItemsTab.classList.add('border-transparent', 'text-gray-600');
        
        categoriesSection.classList.remove('hidden');
        menuItemsSection.classList.add('hidden');
    } else {
        menuItemsTab.classList.add('border-blue-600', 'text-blue-600');
        menuItemsTab.classList.remove('border-transparent', 'text-gray-600');
        categoriesTab.classList.remove('border-blue-600', 'text-blue-600');
        categoriesTab.classList.add('border-transparent', 'text-gray-600');
        
        menuItemsSection.classList.remove('hidden');
        categoriesSection.classList.add('hidden');
    }
}

// ============================================
// CATEGORIES - LOAD & DISPLAY
// ============================================

async function loadCategories() {
    try {
        showLoading('Loading categories...');

        const data = await apiGet(API_ENDPOINTS.ADMIN_CATEGORIES);
        categoriesData = data.categories || [];

        displayCategories();
        updateCategorySelects();

        hideLoading();
    } catch (error) {
        hideLoading();
        handleApiError(error, 'Failed to load categories');
    }
}

function displayCategories() {
    const container = document.getElementById('categories-list');
    
    if (categoriesData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fas fa-list text-6xl mb-4"></i>
                <p class="text-xl">No categories yet</p>
                <p class="text-sm">Click "Add Category" to create your first category</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categoriesData.map(category => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            ${category.image_url ? `
                <img src="${category.image_url}" alt="${category.name}" class="w-full h-48 object-cover">
            ` : `
                <div class="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <i class="fas fa-list text-white text-6xl"></i>
                </div>
            `}
            
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-gray-800">${category.name}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${category.description || 'No description'}</p>
                
                <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span><i class="fas fa-sort mr-1"></i>Order: ${category.display_order}</span>
                    <span><i class="fas fa-utensils mr-1"></i>${category.item_count} items</span>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="editCategory(${category.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteCategory(${category.id}, '${category.name}', ${category.item_count})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCategorySelects() {
    const selects = [
        document.getElementById('filter-category'),
        document.getElementById('item-category')
    ];
    
    selects.forEach(select => {
        const currentValue = select.value;
        const isFilter = select.id === 'filter-category';
        
        select.innerHTML = isFilter ? '<option value="">All Categories</option>' : '<option value="">Select Category</option>';
        
        categoriesData.filter(c => c.is_active).forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// ============================================
// CATEGORIES - MODAL
// ============================================

function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');

    form.reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-active').checked = true;

    if (categoryId) {
        title.textContent = 'Edit Category';
        const category = categoriesData.find(c => c.id === categoryId);
        if (category) {
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            document.getElementById('category-image').value = category.image_url || '';
            document.getElementById('category-order').value = category.display_order;
            document.getElementById('category-active').checked = category.is_active;
        }
    } else {
        title.textContent = 'Add Category';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ============================================
// CATEGORIES - CRUD OPERATIONS
// ============================================

document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoryId = document.getElementById('category-id').value;
    const categoryData = {
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-description').value,
        image_url: document.getElementById('category-image').value,
        display_order: parseInt(document.getElementById('category-order').value),
        is_active: document.getElementById('category-active').checked
    };

    try {
        showLoading(categoryId ? 'Updating category...' : 'Creating category...');

        if (categoryId) {
            await apiPut(API_ENDPOINTS.ADMIN_CATEGORY(categoryId), categoryData);
            await showSuccess('Category updated successfully!');
        } else {
            await apiPost(API_ENDPOINTS.ADMIN_CATEGORIES, categoryData);
            await showSuccess('Category created successfully!');
        }

        closeCategoryModal();
        await loadCategories();
        hideLoading();

    } catch (error) {
        hideLoading();
        handleApiError(error, 'Failed to save category');
    }
});

function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

async function deleteCategory(categoryId, categoryName, itemCount) {
    if (itemCount > 0) {
        await showError(`Cannot delete "${categoryName}" because it has ${itemCount} menu items. Please delete or move the items first.`);
        return;
    }

    const result = await Swal.fire({
        title: 'Delete Category?',
        text: `Are you sure you want to delete "${categoryName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: APP_CONFIG.THEME.PRIMARY,
        cancelButtonColor: APP_CONFIG.THEME.ACCENT,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            showLoading('Deleting category...');

            await apiDelete(API_ENDPOINTS.ADMIN_CATEGORY(categoryId));
            await showSuccess('Category deleted successfully!');
            await loadCategories();

            hideLoading();
        } catch (error) {
            hideLoading();
            handleApiError(error, 'Failed to delete category');
        }
    }
}

// ============================================
// MENU ITEMS - LOAD & DISPLAY
// ============================================

async function loadMenuItems() {
    try {
        showLoading('Loading menu items...');

        const categoryId = document.getElementById('filter-category').value;
        const isAvailable = document.getElementById('filter-availability').value;

        let url = API_ENDPOINTS.ADMIN_MENU_ITEMS;
        const params = [];

        if (categoryId) params.push(`category_id=${categoryId}`);
        if (isAvailable) params.push(`is_available=${isAvailable}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const data = await apiGet(url);
        menuItemsData = data.menu_items || [];

        displayMenuItems();

        hideLoading();
    } catch (error) {
        hideLoading();
        handleApiError(error, 'Failed to load menu items');
    }
}

function displayMenuItems() {
    const container = document.getElementById('menu-items-list');

    if (menuItemsData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fas fa-utensils text-6xl mb-4"></i>
                <p class="text-xl">No menu items yet</p>
                <p class="text-sm">Click "Add Menu Item" to create your first item</p>
            </div>
        `;
        return;
    }

    container.innerHTML = menuItemsData.map(item => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            ${item.image_url ? `
                <img src="${item.image_url}" alt="${item.name}" class="w-full h-48 object-cover">
            ` : `
                <div class="w-full h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <i class="fas fa-utensils text-white text-6xl"></i>
                </div>
            `}

            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-gray-800">${item.name}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>

                <p class="text-xs text-blue-600 font-semibold mb-2">${item.category_name}</p>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${item.description || 'No description'}</p>

                <div class="flex justify-between items-center mb-4">
                    <span class="text-2xl font-bold text-green-600">$${parseFloat(item.price).toFixed(2)}</span>
                    <div class="text-right text-xs text-gray-500">
                        ${item.is_featured ? '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"><i class="fas fa-star mr-1"></i>Featured</span>' : ''}
                        <div class="mt-1"><i class="fas fa-clock mr-1"></i>${item.preparation_time} min</div>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button onclick="editMenuItem(${item.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteMenuItem(${item.id}, '${item.name.replace(/'/g, "\\'")}' )" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// MENU ITEMS - MODAL
// ============================================

function openMenuItemModal(itemId = null) {
    const modal = document.getElementById('menu-item-modal');
    const title = document.getElementById('menu-item-modal-title');
    const form = document.getElementById('menu-item-form');

    form.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-available').checked = true;
    document.getElementById('item-featured').checked = false;
    document.getElementById('item-prep-time').value = 15;

    if (itemId) {
        title.textContent = 'Edit Menu Item';
        const item = menuItemsData.find(i => i.id === itemId);
        if (item) {
            document.getElementById('item-id').value = item.id;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-category').value = item.category_id;
            document.getElementById('item-description').value = item.description || '';
            document.getElementById('item-price').value = item.price;
            document.getElementById('item-prep-time').value = item.preparation_time;
            document.getElementById('item-image').value = item.image_url || '';
            document.getElementById('item-available').checked = item.is_available;
            document.getElementById('item-featured').checked = item.is_featured;
        }
    } else {
        title.textContent = 'Add Menu Item';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeMenuItemModal() {
    const modal = document.getElementById('menu-item-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ============================================
// MENU ITEMS - CRUD OPERATIONS
// ============================================

document.getElementById('menu-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemId = document.getElementById('item-id').value;
    const itemData = {
        name: document.getElementById('item-name').value,
        category_id: parseInt(document.getElementById('item-category').value),
        description: document.getElementById('item-description').value,
        price: parseFloat(document.getElementById('item-price').value),
        preparation_time: parseInt(document.getElementById('item-prep-time').value),
        image_url: document.getElementById('item-image').value,
        is_available: document.getElementById('item-available').checked,
        is_featured: document.getElementById('item-featured').checked
    };

    try {
        showLoading(itemId ? 'Updating menu item...' : 'Creating menu item...');

        if (itemId) {
            await apiPut(API_ENDPOINTS.ADMIN_MENU_ITEM(itemId), itemData);
            await showSuccess('Menu item updated successfully!');
        } else {
            await apiPost(API_ENDPOINTS.ADMIN_MENU_ITEMS, itemData);
            await showSuccess('Menu item created successfully!');
        }

        closeMenuItemModal();
        await loadMenuItems();
        hideLoading();

    } catch (error) {
        hideLoading();
        handleApiError(error, 'Failed to save menu item');
    }
});

function editMenuItem(itemId) {
    openMenuItemModal(itemId);
}

async function deleteMenuItem(itemId, itemName) {
    const result = await Swal.fire({
        title: 'Delete Menu Item?',
        text: `Are you sure you want to delete "${itemName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: APP_CONFIG.THEME.PRIMARY,
        cancelButtonColor: APP_CONFIG.THEME.ACCENT,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            showLoading('Deleting menu item...');

            await apiDelete(API_ENDPOINTS.ADMIN_MENU_ITEM(itemId));
            await showSuccess('Menu item deleted successfully!');
            await loadMenuItems();

            hideLoading();
        } catch (error) {
            hideLoading();
            handleApiError(error, 'Failed to delete menu item');
        }
    }
}

// ============================================
// NAVIGATION
// ============================================

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function logout() { return confirmLogout('admin'); }

