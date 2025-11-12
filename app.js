const API_URL = 'http://127.0.0.1:5000/api';

let cart = [];
let categories = [];
let menuItems = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadMenu();
    setupCheckoutForm();
});

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        categories = await response.json();
        
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = `
            <div class="category-item active" onclick="filterByCategory(null)">
                All Items
            </div>
        `;
        
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.textContent = category.name;
            categoryDiv.onclick = () => filterByCategory(category.id, category.name);
            categoriesList.appendChild(categoryDiv);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load menu items
async function loadMenu(categoryId = null) {
    try {
        const url = categoryId 
            ? `${API_URL}/menu?category_id=${categoryId}`
            : `${API_URL}/menu`;
        
        const response = await fetch(url);
        menuItems = await response.json();
        
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menu-items').innerHTML = 
            '<p class="loading">Error loading menu items. Please make sure the backend is running.</p>';
    }
}

// Display menu items
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menu-items');
    
    if (items.length === 0) {
        menuGrid.innerHTML = '<p class="empty-cart">No items found in this category.</p>';
        return;
    }
    
    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item">
            <div class="menu-item-icon">${item.image_url || '🍽️'}</div>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="menu-item-footer">
                <span class="price">$${item.price.toFixed(2)}</span>
                <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Filter by category
function filterByCategory(categoryId, categoryName = 'All Items') {
    // Update active category
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update section title
    document.getElementById('section-title').textContent = categoryName;
    
    // Load filtered menu
    loadMenu(categoryId);
}

// Add to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    updateCart();
}

// Update cart display
function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Cart actions
function increaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity++;
        updateCart();
    }
}

function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateCart();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(i => i.id !== itemId);
    updateCart();
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('open');
}

// Checkout
function showCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const modal = document.getElementById('checkout-modal');
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    checkoutItems.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    checkoutTotal.textContent = `$${totalPrice.toFixed(2)}`;
    modal.classList.add('show');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('show');
}

function closeSuccess() {
    document.getElementById('success-modal').classList.remove('show');
}

// Setup checkout form
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            total_amount: totalAmount,
            items: cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok) {
                // Show success modal
                document.getElementById('order-number').textContent = result.order_id;
                document.getElementById('checkout-modal').classList.remove('show');
                document.getElementById('success-modal').classList.add('show');

                // Clear cart
                cart = [];
                updateCart();
                toggleCart();

                // Reset form
                form.reset();
            } else {
                alert('Error placing order: ' + result.error);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        }
    });
}

