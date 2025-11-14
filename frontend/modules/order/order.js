// Cart and menu state
let cart = [];
let categories = [];
let menuItems = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage(); // Load cart from localStorage
    loadCategories();
    loadMenu();
    setupCheckoutForm();
});

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('guest_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            // Ensure all prices are numbers
            cart = cart.map(item => ({
                ...item,
                price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
            }));
            updateCart();
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cart = [];
        }
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('guest_cart', JSON.stringify(cart));
}



// Load categories
async function loadCategories() {
    try {
        const response = await apiGet(API_ENDPOINTS.ORDER_CATEGORIES);
        categories = response.categories || [];

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
        await showError('Error', 'Failed to load categories. Please try again.');
    }
}

// Load menu items
async function loadMenu(categoryId = null) {
    try {
        const url = categoryId
            ? `${API_ENDPOINTS.ORDER_MENU}?category_id=${categoryId}`
            : API_ENDPOINTS.ORDER_MENU;

        const response = await apiGet(url);
        menuItems = response.menu_items || [];

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

    menuGrid.innerHTML = items.map(item => {
        // Convert price to number if it's a string
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

        return `
            <div class="menu-item">
                <div class="menu-item-icon">${item.image_url || '🍽️'}</div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="menu-item-footer">
                    <span class="price">$${price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
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
        // Convert price to number if it's a string
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

        cart.push({
            id: item.id,
            name: item.name,
            price: price,
            quantity: 1
        });
    }

    updateCart();
    saveCartToStorage(); // Save cart to localStorage

    // SweetAlert2 toast notification
        Swal.fire({
            icon: 'success',
            title: 'Added to cart!',
            text: `${item.name} has been added to your cart`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            background: 'white',
            color: '#111827'
        });
}

// Update cart display
function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Update navbar/cart badge if present
    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    // Update cart bar summary if present
    const cartCountBar = document.getElementById('cart-count-bar');
    const cartTotalBar = document.getElementById('cart-total-bar');
    if (cartCountBar) cartCountBar.textContent = totalItems;
    if (cartTotalBar) cartTotalBar.textContent = `$${totalPrice.toFixed(2)}`;
    
    if (!cartItems) return; // nothing to render into on this page

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
        saveCartToStorage();
    }
}

function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateCart();
        saveCartToStorage();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(i => i.id !== itemId);
    updateCart();
    saveCartToStorage();
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
            confirmButtonColor: APP_CONFIG.THEME.PRIMARY
        });
        return;
    }

    // Check if user is logged in
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);

    if (!userName || userType !== 'user') {
        // Guest user - redirect to login
        Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login to complete your order. Your cart will be saved!',
            confirmButtonText: 'Go to Login',
            showCancelButton: true,
            cancelButtonText: 'Continue Shopping',
            confirmButtonColor: APP_CONFIG.THEME.SECONDARY,
            cancelButtonColor: APP_CONFIG.THEME.ACCENT
        }).then((result) => {
            if (result.isConfirmed) {
                // Save cart before redirecting
                saveCartToStorage();
                // Redirect to login page
                window.location.href = '../auth/login.html';
            }
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

// Setup checkout form
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get user info from localStorage
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);

        if (!userId) {
            await showError('Login Required', 'Please login to place an order.');
            window.location.href = '../auth/login.html';
            return;
        }

        const deliveryAddress = document.getElementById('customer-address')?.value || '';
        const specialInstructions = document.getElementById('special-instructions')?.value || '';
        const paymentMethod = document.getElementById('payment-method')?.value || 'cash';

        // Prepare order data according to backend API
        const orderData = {
            items: cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                special_request: ''  // Can be added per item if needed
            })),
            payment_method: paymentMethod,
            delivery_address: deliveryAddress,
            special_instructions: specialInstructions
        };

        try {
            showLoading('Placing your order...');

            console.log('Sending order data:', orderData);
            console.log('API Endpoint:', API_ENDPOINTS.ORDER_PLACE);
            console.log('Auth Token:', localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));

            const result = await apiPost(API_ENDPOINTS.ORDER_PLACE, orderData);

            console.log('Order result:', result);
            hideLoading();

            // Close checkout modal
            document.getElementById('checkout-modal').classList.remove('show');

            // Show success with SweetAlert2
                await Swal.fire({
                icon: 'success',
                title: 'Order Placed Successfully!',
                html: `
                    <p class="text-lg mb-2">Your order <strong>#${result.order_number}</strong> has been received!</p>
                    <p class="text-gray-600">Order ID: ${result.order_id}</p>
                    <p class="text-gray-600">Total Amount: $${result.total_amount.toFixed(2)}</p>
                    <p class="text-green-600 mt-3">Thank you for your order, ${userName}!</p>
                `,
                confirmButtonText: 'Continue Shopping',
                confirmButtonColor: APP_CONFIG.THEME.SECONDARY,
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
            saveCartToStorage(); // Clear saved cart
            toggleCart();

            // Reset form
            form.reset();
        } catch (error) {
            hideLoading();
            console.error('Error placing order:', error);

            // More detailed error message
            let errorMessage = 'Unable to place order. Please try again.';

            if (error.message === 'Failed to fetch') {
                errorMessage = 'Cannot connect to server. Please make sure the backend is running (python backend/app.py).';
            } else if (error.message) {
                errorMessage = error.message;
            }

            await showError('Order Failed', errorMessage);
        }
    });
}

