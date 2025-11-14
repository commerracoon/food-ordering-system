/**
 * Authentication utilities for Food Ordering System
 * Handles login state, session management, and auth checks
 */

/**
 * Storage helpers: prefer sessionStorage, fall back to localStorage for compatibility
 */
function storageSet(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        // sessionStorage may be unavailable in some environments; ignore
    }
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // ignore
    }
}

function storageGet(key) {
    try {
        const s = sessionStorage.getItem(key);
        if (s !== null) return s;
    } catch (e) {}
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function storageRemove(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (e) {}
    try {
        localStorage.removeItem(key);
    } catch (e) {}
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    // Consider user logged in if either a userId is stored or a JWT auth token exists
    return storageGet(STORAGE_KEYS.USER_ID) !== null || getAuthToken() !== null;
}

/**
 * Check if current user is admin
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
    return storageGet(STORAGE_KEYS.USER_TYPE) === APP_CONFIG.USER_TYPES.ADMIN;
}

/**
 * Check if current user is super admin
 * @returns {boolean} True if user is super admin
 */
function isSuperAdmin() {
    return isAdmin() && storageGet(STORAGE_KEYS.ADMIN_ROLE) === APP_CONFIG.ADMIN_ROLES.SUPER_ADMIN;
}

/**
 * Get current user information
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }

    // If userId isn't stored but we have a JWT token, try to decode it and populate session
    if (!storageGet(STORAGE_KEYS.USER_ID) && getAuthToken()) {
        try {
            ensureUserSessionFromToken();
        } catch (e) {
            console.warn('Failed to populate session from token:', e);
        }
    }

    return {
        userId: storageGet(STORAGE_KEYS.USER_ID),
        userName: storageGet(STORAGE_KEYS.USER_NAME),
        userType: storageGet(STORAGE_KEYS.USER_TYPE),
        adminRole: storageGet(STORAGE_KEYS.ADMIN_ROLE)
    };
}

/**
 * Decode a JWT token payload without verifying signature (client-side only)
 * @param {string} token
 * @returns {Object|null} payload or null
 */
function decodeJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1];
        // Add padding for base64
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
        console.error('decodeJwt error', e);
        return null;
    }
}

/**
 * Populate localStorage session values from stored JWT token if possible
 */
function ensureUserSessionFromToken() {
    const token = getAuthToken();
    if (!token) return;
    const payload = decodeJwt(token);
    if (!payload) return;

    // Common claim names: user_id, sub, username, user, email
    const id = payload.user_id || payload.sub || payload.id || payload.userId || null;
    const username = payload.username || payload.user || payload.name || payload.email || null;
    const user_type = payload.user_type || payload.role || 'user';

    if (id) {
        storageSet(STORAGE_KEYS.USER_ID, id);
    }
    if (username) {
        storageSet(STORAGE_KEYS.USER_NAME, username);
    }
    if (user_type) {
        storageSet(STORAGE_KEYS.USER_TYPE, user_type);
    }
}

/**
 * Save user session to localStorage
 * @param {Object} userData - User data from login response
 * @param {string} token - JWT token (optional)
 */
function saveUserSession(userData, token = null) {
    storageSet(STORAGE_KEYS.USER_ID, userData.id || userData.user_id);
    storageSet(STORAGE_KEYS.USER_NAME, userData.username);
    storageSet(STORAGE_KEYS.USER_TYPE, userData.user_type || 'user');

    if (userData.role || userData.admin_role) {
        storageSet(STORAGE_KEYS.ADMIN_ROLE, userData.role || userData.admin_role);
    }

    // Save JWT token if provided
    if (token) {
        storageSet(STORAGE_KEYS.AUTH_TOKEN, token);
    }
}

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null
 */
function getAuthToken() {
    return storageGet(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Clear user session from localStorage
 */
function clearUserSession() {
    storageRemove(STORAGE_KEYS.USER_ID);
    storageRemove(STORAGE_KEYS.USER_NAME);
    storageRemove(STORAGE_KEYS.USER_TYPE);
    storageRemove(STORAGE_KEYS.ADMIN_ROLE);
    storageRemove(STORAGE_KEYS.AUTH_TOKEN);
    // Clear cart when logging out
    storageRemove('guest_cart');
}

/**
 * Perform the logout sequence: call API, clear session, show feedback, and redirect.
 * @param {string} userType - 'user' or 'admin' (optional)
 */
async function performLogout(userType = null) {
    try {
        showLoading('Logging out...');
        const type = userType || storageGet(STORAGE_KEYS.USER_TYPE) || 'user';
        await apiLogout(type);
        clearUserSession();
        hideLoading();
        await showSuccess('You have been logged out successfully.');

        // Compute a safe redirect to the auth login page without relying on page-specific helpers
        const path = window.location.pathname || window.location.href;
        let redirectUrl = '../auth/login.html';
        if (path.includes('/modules/')) {
            // We're already inside a module folder (e.g. /modules/user/...), ../auth/login.html works
            redirectUrl = '../auth/login.html';
        } else if (path.includes('/frontend/') || path.endsWith('/index.html') || path.endsWith('/')) {
            // If at frontend root, point to modules auth path
            redirectUrl = './modules/auth/login.html';
        } else {
            // Fallback
            redirectUrl = '../auth/login.html';
        }

        window.location.href = redirectUrl;
    } catch (err) {
        hideLoading();
        console.error('performLogout error', err);
        clearUserSession();
        // Best-effort fallback redirect
        try { window.location.href = '../auth/login.html'; } catch (e) { /* ignore */ }
    }
}

/**
 * Show a global logout confirmation and perform logout when confirmed.
 * This centralizes the confirmation dialog for all logout buttons.
 * @param {string} userType - optional user type override
 */
async function confirmLogout(userType = null) {
    try {
        const res = await Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: APP_CONFIG.THEME.PRIMARY,
            cancelButtonColor: APP_CONFIG.THEME.ACCENT
        });

        if (res.isConfirmed) {
            await performLogout(userType);
        }
    } catch (e) {
        console.error('confirmLogout error', e);
    }
}

/**
 * Logout user
 * @param {string} userType - 'user' or 'admin'
 * @returns {Promise} Logout API response
 */
// API logout call (renamed to avoid collision with page-level `logout()` wrappers)
async function apiLogout(userType = 'user') {
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
        logout: apiLogout,
        apiLogout,
        requireAuth,
        redirectToDashboard,
        checkSession
    };
}

// Optionally clear user session when the window/tab is closed.
// Controlled by `APP_CONFIG.CLEAR_SESSION_ON_CLOSE` (boolean).
try {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.CLEAR_SESSION_ON_CLOSE) {
        // Use pagehide and beforeunload to maximize coverage across browsers.
        const clearIfConfigured = () => {
            try {
                clearUserSession();
            } catch (e) {
                // ignore
            }
        };

        // Use pagehide which reliably fires on page unload in many browsers
        window.addEventListener('pagehide', (e) => {
            // pagehide fires for navigation and close; we intentionally clear on any unload
            clearIfConfigured();
        }, { capture: true });

        // beforeunload as a backup
        window.addEventListener('beforeunload', (e) => {
            clearIfConfigured();
        }, { capture: true });
    }
} catch (e) {
    // ignore errors while setting up unload listeners
}

