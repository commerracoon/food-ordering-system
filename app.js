const API_URL = 'http://127.0.0.1:5000/api';

let cart = [];
let categories = [];
let menuItems = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    loadCategories();
    loadMenu();
    setupCheckoutForm();
});

// Check user session
function checkUserSession() {
    const userName = localStorage.getItem('userName');
    const userType = localStorage.getItem('userType');

    if (userName) {
        document.getElementById('user-info').textContent = `Welcome, ${userName}!`;
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
    } else {
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
    }
}

// Logout function
async function logout() {
    const userType = localStorage.getItem('userType') || 'user';
    const endpoint = userType === 'admin' ? '/admin/logout' : '/user/logout';

    try {
        await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('userName');
    localStorage.removeItem('userType');

    Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been logged out successfully.',
        timer: 2000,
        showConfirmButton: false
    });

    checkUserSession();
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/order/categories`);
        const data = await response.json();
        categories = data.categories || [];
        
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
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load categories. Please try again.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load menu items
async function loadMenu(categoryId = null) {
    try {
        const url = categoryId
            ? `${API_URL}/order/menu?category_id=${categoryId}`
            : `${API_URL}/order/menu`;

        const response = await fetch(url);
        const data = await response.json();
        menuItems = data.menu_items || [];
        
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

    // SweetAlert2 toast notification
    Swal.fire({
        icon: 'success',
        title: 'Added to cart!',
        text: `${item.name} has been added to your cart`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });
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
        Swal.fire({
            icon: 'warning',
            title: 'Cart is Empty',
            text: 'Please add some items to your cart first!',
            confirmButtonColor: '#ff6b6b'
        });
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
                // Close checkout modal
                document.getElementById('checkout-modal').classList.remove('show');

                // Show success with SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Order Placed Successfully!',
                    html: `
                        <p class="text-lg">Your order #<strong>${result.order_id}</strong> has been received.</p>
                        <p class="text-gray-600 mt-2">Thank you for your order!</p>
                    `,
                    confirmButtonText: 'Continue Shopping',
                    confirmButtonColor: '#4ecdc4',
                    showClass: {
                        popup: 'animate__animated animate__bounceIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOut'
                    }
                });

                // Clear cart
                cart = [];
                updateCart();
                toggleCart();

                // Reset form
                form.reset();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Order Failed',
                    text: result.error || 'Failed to place order. Please try again.',
                    confirmButtonColor: '#ff6b6b'
                });
            }
        } catch (error) {
            console.error('Error placing order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Unable to place order. Please check your connection and try again.',
                confirmButtonColor: '#ff6b6b'
            });
        }
    });
}

