/**
 * Utility functions for Food Ordering System
 * Common helper functions used across the application
 */

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: $)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = APP_CONFIG.DEFAULT_CURRENCY) {
    return `${currency}${parseFloat(amount).toFixed(2)}`;
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format datetime to readable string
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} Formatted datetime string
 */
function formatDateTime(datetime) {
    const d = new Date(datetime);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate order total
 * @param {Array} items - Array of order items with price and quantity
 * @param {number} taxRate - Tax rate (default from config)
 * @param {number} deliveryFee - Delivery fee (default from config)
 * @returns {Object} Object with subtotal, tax, delivery_fee, and total
 */
function calculateOrderTotal(items, taxRate = APP_CONFIG.TAX_RATE, deliveryFee = APP_CONFIG.DELIVERY_FEE) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax + deliveryFee;
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        delivery_fee: parseFloat(deliveryFee.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
function validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\d{10,15}$/.test(cleaned);
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading spinner
 * @param {string} message - Loading message
 */
function showLoading(message = 'Loading...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    Swal.close();
}

/**
 * Show success message
 * @param {string} message - Success message
 * @param {Function} callback - Optional callback function
 */
function showSuccess(message, callback = null) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message
    }).then(() => {
        if (callback) callback();
    });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 */
function showConfirm(message, onConfirm) {
    Swal.fire({
        title: 'Are you sure?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    }).then((result) => {
        if (result.isConfirmed && onConfirm) {
            onConfirm();
        }
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        formatDateTime,
        calculateOrderTotal,
        validateEmail,
        validatePhone,
        debounce,
        showLoading,
        hideLoading,
        showSuccess,
        showError,
        showConfirm
    };
}

