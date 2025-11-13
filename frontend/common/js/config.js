/**
 * Configuration file for Food Ordering System Frontend
 * Contains API URLs, constants, and global settings
 */

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000/api';

const API_ENDPOINTS = {
    // User endpoints
    USER_REGISTER: `${API_BASE_URL}/user/register`,
    USER_LOGIN: `${API_BASE_URL}/user/login`,
    USER_LOGOUT: `${API_BASE_URL}/user/logout`,
    USER_PROFILE: `${API_BASE_URL}/user/profile`,
    
    // Admin endpoints
    ADMIN_REGISTER: `${API_BASE_URL}/admin/register`,
    ADMIN_LOGIN: `${API_BASE_URL}/admin/login`,
    ADMIN_LOGOUT: `${API_BASE_URL}/admin/logout`,
    ADMIN_PROFILE: `${API_BASE_URL}/admin/profile`,

    // Admin Menu Management
    ADMIN_CATEGORIES: `${API_BASE_URL}/admin/menu/categories`,
    ADMIN_CATEGORY: (id) => `${API_BASE_URL}/admin/menu/categories/${id}`,
    ADMIN_MENU_ITEMS: `${API_BASE_URL}/admin/menu/items`,
    ADMIN_MENU_ITEM: (id) => `${API_BASE_URL}/admin/menu/items/${id}`,
    
    // Order endpoints
    ORDER_CATEGORIES: `${API_BASE_URL}/order/categories`,
    ORDER_MENU: `${API_BASE_URL}/order/menu`,
    ORDER_PLACE: `${API_BASE_URL}/order/place`,
    ORDER_LIST: `${API_BASE_URL}/order/list`,
    ORDER_DETAILS: `${API_BASE_URL}/order`,
    
    // Invoice endpoints
    INVOICE_LIST: `${API_BASE_URL}/invoice/list`,
    INVOICE_DETAILS: `${API_BASE_URL}/invoice`,
    
    // Feedback endpoints
    FEEDBACK_SUBMIT: `${API_BASE_URL}/feedback/submit`,
    FEEDBACK_LIST: `${API_BASE_URL}/feedback/list`,
    
    // Health check
    HEALTH_CHECK: `${API_BASE_URL}/health`,
    SESSION_CHECK: `${API_BASE_URL}/session`
};

// Application Constants
const APP_CONFIG = {
    APP_NAME: 'Food Ordering System',
    VERSION: '1.0.0',
    DEFAULT_CURRENCY: '$',
    TAX_RATE: 0.10,
    DELIVERY_FEE: 5.00,
    MIN_ORDER_AMOUNT: 10.00,
    
    // Pagination
    ITEMS_PER_PAGE: 20,
    
    // Rating
    MIN_RATING: 1,
    MAX_RATING: 5,
    
    // Order statuses
    ORDER_STATUSES: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PREPARING: 'preparing',
        READY: 'ready',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    },
    
    // Payment methods
    PAYMENT_METHODS: {
        CASH: 'cash',
        CARD: 'card',
        ONLINE: 'online'
    },
    
    // User types
    USER_TYPES: {
        USER: 'user',
        ADMIN: 'admin'
    },
    
    // Admin roles
    ADMIN_ROLES: {
        ADMIN: 'admin',
        SUPER_ADMIN: 'super_admin'
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER_ID: 'userId',
    USER_NAME: 'userName',
    USER_TYPE: 'userType',
    ADMIN_ROLE: 'adminRole',
    AUTH_TOKEN: 'authToken',  // JWT token
    CART: 'cart',
    THEME: 'theme'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        APP_CONFIG,
        STORAGE_KEYS
    };
}

