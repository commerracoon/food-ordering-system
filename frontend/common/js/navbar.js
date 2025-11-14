/**
 * Common Navigation Bar JavaScript
 * Handles navigation initialization and routing
 */

// Get the base path for navigation links based on current location
function getBasePath() {
    const path = window.location.pathname;
    
    // Determine depth level
    if (path.includes('/modules/')) {
        // We're in a module folder (auth, user, admin, order)
        return '../..';
    } else if (path.includes('/frontend/')) {
        // We're in frontend root
        return '.';
    } else {
        // We're in project root
        return 'frontend';
    }
}

// Set navigation link hrefs based on current location
function setNavigationLinks() {
    const basePath = getBasePath();
    
    // Brand link
    const brandLink = document.getElementById('navbar-brand-link');
    if (brandLink) brandLink.href = `${basePath}/modules/order/menu.html`;
    
    // Guest links
    const homeLink = document.getElementById('nav-home-link');
    if (homeLink) homeLink.href = `${basePath}/modules/order/menu.html`;
    
    // User links
    const userDashboardLink = document.getElementById('nav-user-dashboard-link');
    if (userDashboardLink) userDashboardLink.href = `${basePath}/modules/user/dashboard.html`;
    
    const userOrderLink = document.getElementById('nav-user-order-link');
    if (userOrderLink) userOrderLink.href = `${basePath}/modules/order/menu.html`;
    
    const userProfileLink = document.getElementById('nav-user-profile-link');
    if (userProfileLink) userProfileLink.href = `${basePath}/modules/user/profile.html`;
    
    // Admin links
    const adminDashboardLink = document.getElementById('nav-admin-dashboard-link');
    if (adminDashboardLink) adminDashboardLink.href = `${basePath}/modules/admin/dashboard.html`;
    
    const adminMenuLink = document.getElementById('nav-admin-menu-link');
    if (adminMenuLink) adminMenuLink.href = `${basePath}/modules/admin/menu-management.html`;
}

// Initialize navigation based on user state
function initNavigation() {
    // Set navigation links first
    setNavigationLinks();
    
    const userType = getUserType();
    const userName = getUserName();
    const isAuth = isAuthenticated();
    
    // Hide all menu items first (except cart button)
    document.querySelectorAll('#navbar-menu li').forEach(li => {
        // Don't hide the cart button
        if (li.id !== 'nav-cart-button') {
            li.style.display = 'none';
        }
    });
    
    if (isAuth && userType === 'admin') {
        // Admin navigation
        document.getElementById('nav-admin-dashboard').style.display = 'block';
        document.getElementById('nav-admin-menu').style.display = 'block';
        document.getElementById('navbar-user-info').style.display = 'flex';
        document.getElementById('navbar-username').textContent = userName;
        document.getElementById('nav-logout').style.display = 'block';
    } else if (isAuth && userType === 'user') {
        // User navigation
        document.getElementById('nav-user-dashboard').style.display = 'block';
        document.getElementById('nav-user-order').style.display = 'block';
        document.getElementById('nav-user-profile').style.display = 'block';
        document.getElementById('navbar-user-info').style.display = 'flex';
        document.getElementById('navbar-username').textContent = userName;
        document.getElementById('nav-logout').style.display = 'block';
    } else {
        // Guest navigation
        document.getElementById('nav-guest').style.display = 'block';
        document.getElementById('nav-login').style.display = 'block';
    }
    
    // Highlight active page
    highlightActivePage();
}

// Highlight active page in navigation
function highlightActivePage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    document.querySelectorAll('.navbar-link').forEach(link => {
        const linkPath = new URL(link.href).pathname;
        const linkPage = linkPath.split('/').pop();
        
        if (currentPage === linkPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Navigation functions
function navLogin() {
    const basePath = getBasePath();
    window.location.href = `${basePath}/modules/auth/login.html`;
}

async function navLogout() {
    const result = await Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: APP_CONFIG.THEME.PRIMARY,
        cancelButtonColor: APP_CONFIG.THEME.ACCENT
    });
    
    if (result.isConfirmed) {
        try {
            const userType = getUserType();
            await apiLogout(userType);
            await Swal.fire({
                icon: 'success',
                title: 'Logged Out',
                text: 'You have been logged out successfully!',
                timer: 1500,
                showConfirmButton: false
            });
            const basePath = getBasePath();
            window.location.href = `${basePath}/modules/auth/login.html`;
        } catch (error) {
            console.error('Logout error:', error);
            // Clear session anyway
            clearUserSession();
            const basePath = getBasePath();
            window.location.href = `${basePath}/modules/auth/login.html`;
        }
    }
}

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

