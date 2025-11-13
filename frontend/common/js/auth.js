/**
 * Authentication utilities for Food Ordering System
 * Handles login state, session management, and auth checks
 */

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID) !== null;
}

/**
 * Check if current user is admin
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
    return localStorage.getItem(STORAGE_KEYS.USER_TYPE) === APP_CONFIG.USER_TYPES.ADMIN;
}

/**
 * Check if current user is super admin
 * @returns {boolean} True if user is super admin
 */
function isSuperAdmin() {
    return isAdmin() && localStorage.getItem(STORAGE_KEYS.ADMIN_ROLE) === APP_CONFIG.ADMIN_ROLES.SUPER_ADMIN;
}

/**
 * Get current user information
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return {
        userId: localStorage.getItem(STORAGE_KEYS.USER_ID),
        userName: localStorage.getItem(STORAGE_KEYS.USER_NAME),
        userType: localStorage.getItem(STORAGE_KEYS.USER_TYPE),
        adminRole: localStorage.getItem(STORAGE_KEYS.ADMIN_ROLE)
    };
}

/**
 * Save user session to localStorage
 * @param {Object} userData - User data from login response
 * @param {string} token - JWT token (optional)
 */
function saveUserSession(userData, token = null) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id || userData.user_id);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, userData.username);
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, userData.user_type || 'user');

    if (userData.role || userData.admin_role) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_ROLE, userData.role || userData.admin_role);
    }

    // Save JWT token if provided
    if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
}

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null
 */
function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Clear user session from localStorage
 */
function clearUserSession() {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_ROLE);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    // Clear cart when logging out
    localStorage.removeItem('guest_cart');
}

/**
 * Logout user
 * @param {string} userType - 'user' or 'admin'
 * @returns {Promise} Logout API response
 */
async function logout(userType = 'user') {
    try {
        const endpoint = userType === 'admin' ? API_ENDPOINTS.ADMIN_LOGOUT : API_ENDPOINTS.USER_LOGOUT;
        const response = await apiPost(endpoint, {});
        
        clearUserSession();
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        // Clear session even if API call fails
        clearUserSession();
        throw error;
    }
}

/**
 * Redirect to login page if not authenticated
 * @param {string} requiredType - Required user type ('user' or 'admin')
 */
function requireAuth(requiredType = null) {
    if (!isLoggedIn()) {
        window.location.href = '../auth/login.html';
        return false;
    }

    if (requiredType === 'admin' && !isAdmin()) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'Admin access required'
        }).then(() => {
            window.location.href = '../auth/login.html';
        });
        return false;
    }

    return true;
}

/**
 * Redirect to appropriate dashboard based on user type
 * @param {string} fromPath - Optional: current path context (e.g., 'auth', 'admin', 'user')
 */
function redirectToDashboard(fromPath = 'auth') {
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);

    // All modules are in frontend/modules/, so we just need to navigate between them
    if (userType === 'admin' || userType === APP_CONFIG.USER_TYPES.ADMIN) {
        window.location.href = '../admin/dashboard.html';
    } else {
        window.location.href = '../user/dashboard.html';
    }
}

/**
 * Check session with backend
 * @returns {Promise<Object>} Session data
 */
async function checkSession() {
    try {
        const response = await apiGet(API_ENDPOINTS.SESSION_CHECK);
        return response;
    } catch (error) {
        console.error('Session check error:', error);
        return { logged_in: false };
    }
}

/**
 * Alias for isLoggedIn - Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return isLoggedIn();
}

/**
 * Get current user type
 * @returns {string|null} User type ('user' or 'admin') or null
 */
function getUserType() {
    return localStorage.getItem(STORAGE_KEYS.USER_TYPE);
}

/**
 * Get current user name
 * @returns {string|null} User name or null
 */
function getUserName() {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME);
}

/**
 * Get current user ID
 * @returns {string|null} User ID or null
 */
function getUserId() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isLoggedIn,
        isAdmin,
        isSuperAdmin,
        getCurrentUser,
        saveUserSession,
        clearUserSession,
        logout,
        requireAuth,
        redirectToDashboard,
        checkSession
    };
}

