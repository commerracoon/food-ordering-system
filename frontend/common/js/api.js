/**
 * API utilities for Food Ordering System
 * Handles HTTP requests with proper error handling
 */

/**
 * Get authorization headers with JWT token
 * @returns {Object} Headers object with Authorization if token exists
 */
function getAuthHeaders() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    return {};
}

/**
 * Make a GET request to the API
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiGet(url, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API GET Error:', error);
        throw error;
    }
}

/**
 * Make a POST request to the API
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiPost(url, body, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers
            },
            body: JSON.stringify(body),
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API POST Error:', error);
        throw error;
    }
}

/**
 * Make a PUT request to the API
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiPut(url, body, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers
            },
            body: JSON.stringify(body),
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API PUT Error:', error);
        throw error;
    }
}

/**
 * Make a DELETE request to the API
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiDelete(url, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API DELETE Error:', error);
        throw error;
    }
}

/**
 * Handle API errors with user-friendly messages
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message
 */
function handleApiError(error, defaultMessage = 'An error occurred') {
    const message = error.message || defaultMessage;
    
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiGet,
        apiPost,
        apiPut,
        apiDelete,
        handleApiError
    };
}

