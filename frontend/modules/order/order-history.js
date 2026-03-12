/**
 * Order History Module
 * Handles displaying and managing user's order history
 */

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentUser = null;

// Global cache for order feedback status
let orderFeedbackCache = {};
let eligibleOrdersIds = [];
let allUserFeedback = {}; // Cache user feedback by order_id

/**
 * Load eligible orders (orders without feedback)
 */
async function loadEligibleOrdersIds() {
    try {
        const resp = await apiGet(API_ENDPOINTS.FEEDBACK_ELIGIBLE);
        eligibleOrdersIds = (resp.orders || []).map(o => o.id);
    } catch (err) {
        console.warn('Could not load eligible orders', err);
        eligibleOrdersIds = [];
    }
}

/**
 * Load all user feedback (for displaying feedback details)
 */
async function loadUserFeedback() {
    try {
        const resp = await apiGet(API_ENDPOINTS.FEEDBACK_MY);
        allUserFeedback = {};
        if (resp.feedback && Array.isArray(resp.feedback)) {
            resp.feedback.forEach(fb => {
                allUserFeedback[fb.order_id] = fb;
            });
        }
    } catch (err) {
        console.warn('Could not load user feedback', err);
        allUserFeedback = {};
    }
}

/**
 * Check if an order has feedback (based on eligible orders list)
 */
async function orderHasFeedback(orderId) {
    if (orderFeedbackCache.hasOwnProperty(orderId)) {
        return orderFeedbackCache[orderId];
    }
    
    // If eligible orders not yet loaded, load them
    if (eligibleOrdersIds.length === 0) {
        await loadEligibleOrdersIds();
    }
    
    // Order has feedback if it's NOT in the eligible list
    const hasFeedback = !eligibleOrdersIds.includes(orderId);
    orderFeedbackCache[orderId] = hasFeedback;
    return hasFeedback;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        // Try backend session check as a fallback (supports session-cookie auth)
        try {
            const sess = await checkSession();
            if (sess && sess.logged_in) {
                let userId = sess.user_id || null;
                let username = sess.username || null;
                let userType = sess.user_type || 'user';

                if (!userId || !username) {
                    try {
                        const profileResp = await apiGet(API_ENDPOINTS.USER_PROFILE);
                        const profileUser = profileResp.user || profileResp.data || null;
                        if (profileUser) {
                            userId = userId || profileUser.id || profileUser.user_id;
                            username = username || profileUser.username || profileUser.email;
                        }
                    } catch (profileErr) {
                        console.warn('Could not fetch profile during session fallback:', profileErr);
                    }
                }

                if (userId && username) {
                    saveUserSession({ id: userId, username: username, user_type: userType }, null);
                }
            } else {
                window.location.href = '../auth/login.html';
                return;
            }
        } catch (err) {
            console.error('Session fallback check failed:', err);
            window.location.href = '../auth/login.html';
            return;
        }
    }

    // Get current user
    currentUser = getCurrentUser();
    // Safely set username in any present UI element(s)
    const userNameEl = document.getElementById('user-name');
    const navbarUserEl = document.getElementById('navbar-username');
    if (userNameEl && currentUser) userNameEl.textContent = currentUser.userName;
    if (navbarUserEl && currentUser) navbarUserEl.textContent = currentUser.userName;

    // Load eligible orders and user feedback (use fresh session)
    await Promise.all([
        loadEligibleOrdersIds(),
        loadUserFeedback()
    ]);

    // Load orders
    await loadOrders();

    // If an order id was passed via query param, open its details modal
    try {
        const params = new URLSearchParams(window.location.search);
        const openOrderId = params.get('open_order');
        if (openOrderId) {
            // openOrderId may be string; viewOrderDetails accepts numeric id
            await viewOrderDetails(Number(openOrderId));
        }
    } catch (e) {
        // ignore URL parsing errors
    }
});

/**
 * Load user's orders from API
 */
async function loadOrders() {
    try {
        showLoading('Loading your orders...');
        
        const endpoint = API_ENDPOINTS.ORDER_MY_ORDERS;
        const response = await apiGet(endpoint);

        allOrders = response.orders || [];
        filteredOrders = [...allOrders];
        currentPage = 1;

        hideLoading();
        displayOrders();
        updatePagination();

    } catch (error) {
        hideLoading();
        console.error('Error loading orders:', error);
        
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            // Session expired: show message and offer to login
            try {
                await Swal.fire({
                    title: 'Session expired',
                    text: 'Your session has expired. Please login again to continue.',
                    icon: 'warning',
                    confirmButtonText: 'Login',
                    confirmButtonColor: APP_CONFIG.THEME.PRIMARY
                });
                window.location.href = '../auth/login.html';
            } catch (swalErr) {
                console.error('SweetAlert failed, falling back to redirect:', swalErr);
                window.location.href = '../auth/login.html';
            }
        } else {
            displayEmptyState('Failed to load orders', 'Please try again later.');
        }
    }
}

/**
 * Display orders based on current page
 */
function displayOrders() {
    const container = document.getElementById('orders-container');

    if (filteredOrders.length === 0) {
        displayEmptyState('No Orders Found', 'You haven\'t placed any orders yet. Start ordering now!');
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const ordersToDisplay = filteredOrders.slice(startIndex, endIndex);

    // Generate HTML
    let html = '<div style="display: grid; gap: 1.5rem;">';

    ordersToDisplay.forEach(order => {
        const statusClass = `status-${order.status}`;
        const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const createdTime = new Date(order.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9;">Order #${order.order_number}</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--color-dark);">$${parseFloat(order.total_amount).toFixed(2)}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${capitalize(order.status)}</span>
                </div>

                <div class="order-card-body">
                    <!-- Order Info Grid -->
                    <div class="order-info-grid">
                        <div class="info-item">
                            <span class="info-label">📅 Order Date</span>
                            <span class="info-value" style="font-size: 0.95rem;">${createdDate}</span>
                            <span style="font-size: 0.75rem; color: #9ca3af;">${createdTime}</span>
                        </div>

                        <div class="info-item">
                            <span class="info-label">💳 Payment Method</span>
                            <span class="info-value" style="font-size: 0.95rem;">${capitalize(order.payment_method)}</span>
                            <span style="font-size: 0.75rem; color: #9ca3af;">
                                ${order.payment_status === 'completed' ? '✓ Paid' : 'Pending'}
                            </span>
                        </div>

                        ${order.delivered_at ? `
                            <div class="info-item">
                                <span class="info-label">🚚 Delivered</span>
                                <span class="info-value" style="font-size: 0.95rem;">
                                    ${new Date(order.delivered_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Delivery Address -->
                    ${order.delivery_address ? `
                        <div style="margin: 1rem 0; padding: 1rem; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 6px;">
                            <span style="font-size: 0.875rem; color: #6b7280; font-weight: 500;">📍 Delivery Address</span>
                            <p style="margin: 0.5rem 0 0 0; color: #1f2937; font-weight: 500;">${order.delivery_address}</p>
                        </div>
                    ` : ''}

                    <!-- Special Instructions -->
                    ${order.special_instructions ? `
                        <div style="margin: 1rem 0; padding: 1rem; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                            <span style="font-size: 0.875rem; color: #92400e; font-weight: 500;">📝 Special Instructions</span>
                            <p style="margin: 0.5rem 0 0 0; color: #78350f;">${order.special_instructions}</p>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="action-buttons">
                        <button class="btn-small btn-primary" onclick="viewOrderDetails(${order.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${order.status === 'pending' || order.status === 'confirmed' ? `
                            <button class="btn-small btn-outline" onclick="cancelOrder(${order.id})">
                                <i class="fas fa-times"></i> Cancel Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // Feedback status is now handled in the order details modal
}

/**
 * Display empty state
 */
function displayEmptyState(title, message) {
    const container = document.getElementById('orders-container');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">${title}</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">${message}</p>
            <button onclick="goToOrdering()" class="btn-small btn-primary" style="justify-content: center; margin: 0 auto;">
                <i class="fas fa-shopping-cart"></i> Start Ordering
            </button>
        </div>
    `;
    document.getElementById('pagination-container').innerHTML = '';
}

/**
 * Apply filters to orders
 */
function applyFilters() {
    const statusFilter = document.getElementById('filter-status').value;

    filteredOrders = allOrders.filter(order => {
        if (statusFilter && order.status !== statusFilter) {
            return false;
        }
        return true;
    });

    currentPage = 1;
    displayOrders();
    updatePagination();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('filter-status').value = '';
    filteredOrders = [...allOrders];
    currentPage = 1;
    displayOrders();
    updatePagination();
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';

    // Previous button
    html += `<button ${currentPage === 1 ? 'disabled' : 'onclick="changePage(' + (currentPage - 1) + ')"'}>
        <i class="fas fa-chevron-left"></i> Prev
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button 
                    class="${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})"
                >
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<button disabled>...</button>';
        }
    }

    // Next button
    html += `<button ${currentPage === totalPages ? 'disabled' : 'onclick="changePage(' + (currentPage + 1) + ')"'}>
        Next <i class="fas fa-chevron-right"></i>
    </button>`;

    html += '</div>';
    paginationContainer.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
    currentPage = page;
    displayOrders();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * View order details in modal
 */
async function viewOrderDetails(orderId) {
    try {
        showLoading('Loading order details...');

        const endpoint = `${API_ENDPOINTS.ORDER_DETAILS}/${orderId}`;
        const response = await apiGet(endpoint);

        hideLoading();

        const order = response.order;
        const items = response.items || [];

        let itemsHtml = '';
        items.forEach(item => {
            itemsHtml += `
                <div class="item-preview">
                    <div>
                        <div class="item-name">${item.item_name}</div>
                        <div class="item-quantity">${item.quantity} × $${parseFloat(item.price).toFixed(2)}</div>
                        ${item.special_request ? `<div style="font-size: 0.75rem; color: #f97316; margin-top: 0.25rem;"><i class="fas fa-note-sticky"></i> ${item.special_request}</div>` : ''}
                    </div>
                    <div class="item-price">$${parseFloat(item.subtotal).toFixed(2)}</div>
                </div>
            `;
        });

        const modalBody = document.getElementById('modal-body');
        const statusClass = `status-${order.status}`;

        modalBody.innerHTML = `
            <!-- Order Header -->
            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; color: #1f2937;">Order #${order.order_number}</h3>
                        <p style="margin: 0.5rem 0 0 0; color: #6b7280; font-size: 0.875rem;">
                            Placed on ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <span class="status-badge ${statusClass}">${capitalize(order.status)}</span>
                </div>
            </div>

            <!-- Customer Info -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Customer Information</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: #9ca3af; font-weight: 500;">Name</span>
                        <span style="font-weight: 500; color: #1f2937;">${order.customer_name}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: #9ca3af; font-weight: 500;">Phone</span>
                        <span style="font-weight: 500; color: #1f2937;">${order.customer_phone}</span>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <span style="display: block; font-size: 0.75rem; color: #9ca3af; font-weight: 500;">Email</span>
                        <span style="font-weight: 500; color: #1f2937;">${order.customer_email}</span>
                    </div>
                </div>
            </div>

            <!-- Delivery Address -->
            <div style="background: #f0f9ff; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #0ea5e9;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: #0369a1;">📍 Delivery Address</h4>
                <p style="margin: 0; color: #1f2937; font-weight: 500;">${order.delivery_address}</p>
            </div>

            <!-- Special Instructions -->
            ${order.special_instructions ? `
                <div style="background: #fef3c7; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: #92400e;">📝 Special Instructions</h4>
                    <p style="margin: 0; color: #78350f;">${order.special_instructions}</p>
                </div>
            ` : ''}

            <!-- Order Items -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Order Items</h4>
                <div class="order-items-preview">
                    ${itemsHtml}
                </div>
            </div>

            <!-- Order Summary -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Order Summary</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.875rem;">
                    <span style="color: #6b7280;">Subtotal</span>
                    <span style="color: #1f2937; font-weight: 500;">$${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 0.75rem; display: flex; justify-content: space-between;">
                    <span style="font-weight: 600; color: #1f2937;">Total Amount</span>
                    <span style="font-weight: 700; color: var(--color-dark); font-size: 1.125rem;">$${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
            </div>

            <!-- Payment Information -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Payment Information</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.875rem;">
                    <span style="color: #6b7280;">Method</span>
                    <span style="color: #1f2937; font-weight: 500;">${capitalize(order.payment_method)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                    <span style="color: #6b7280;">Status</span>
                    <span style="color: ${order.payment_status === 'completed' ? '#16a34a' : '#ea580c'}; font-weight: 500;">
                        ${capitalize(order.payment_status)}
                    </span>
                </div>
            </div>

            <!-- Feedback Section (will be populated based on order status) -->
            <div id="feedback-section-${order.id}"></div>

            <!-- Action Buttons -->
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button class="btn-small" style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 500;" onclick="closeModal()">
                    <i class="fas fa-times"></i> Close
                </button>
                <button class="btn-small btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;" onclick="printOrder(${order.id})">
                    <i class="fas fa-print"></i> Download Invoice
                </button>
            </div>
        `;

        document.getElementById('modal-order-title').textContent = `Order #${order.order_number}`;
        document.getElementById('order-modal').style.display = 'block';

        // Populate feedback section if order is delivered
        if (order.status === 'delivered') {
            const feedbackSection = document.getElementById(`feedback-section-${order.id}`);
            const feedback = allUserFeedback[order.id];

            if (feedback) {
                // Display existing feedback
                const fullStars = '★'.repeat(feedback.rating);
                const emptyStars = '☆'.repeat(5 - feedback.rating);
                const starsDisplay = fullStars + emptyStars;
                const feedbackDate = new Date(feedback.created_at);
                const formattedDate = feedbackDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });

                feedbackSection.innerHTML = `
                    <div style="background: #fef3c7; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">
                        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.875rem; font-weight: 600; color: #92400e;">⭐ Your Feedback</h4>
                        
                        <div style="margin-bottom: 0.75rem;">
                            <span style="display: block; font-size: 0.75rem; color: #b45309; font-weight: 500;">Rating</span>
                            <span style="font-size: 1.25rem; color: #fbbf24;">${starsDisplay}</span>
                            <span style="margin-left: 8px; color: #92400e;">(${feedback.rating}/${5} stars)</span>
                        </div>

                        ${feedback.comment ? `
                            <div style="margin-bottom: 0.75rem;">
                                <span style="display: block; font-size: 0.75rem; color: #b45309; font-weight: 500;">Comment</span>
                                <p style="margin: 0.25rem 0 0 0; color: #78350f; font-size: 0.875rem;">${feedback.comment}</p>
                            </div>
                        ` : ''}

                        <div style="margin-bottom: 0.5rem;">
                            <span style="display: block; font-size: 0.75rem; color: #b45309; font-weight: 500;">Status</span>
                            <span style="display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 0.75rem; ${feedback.is_approved ? 'background-color: #d4edda; color: #155724;' : 'background-color: #fff3cd; color: #856404;'}">
                                ${feedback.is_approved ? '✓ Approved' : '⏳ Pending Approval'}
                            </span>
                        </div>

                        <div style="font-size: 0.75rem; color: #b45309;">
                            Submitted on ${formattedDate}
                        </div>
                    </div>
                `;
            } else {
                // Show button to add feedback
                feedbackSection.innerHTML = `
                    <div style="background: #dbeafe; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #0ea5e9;">
                        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.875rem; font-weight: 600; color: #0369a1;">💬 No Feedback Yet</h4>
                        <p style="margin: 0 0 0.75rem 0; color: #075985; font-size: 0.875rem;">Share your experience with this order by leaving feedback.</p>
                        <button class="btn-small btn-primary" style="width: 100%; justify-content: center;" onclick="window.location.href='../feedback/submit-feedback.html?order_id=${order.id}'; closeModal();">
                            <i class="fas fa-star"></i> Leave Feedback
                        </button>
                    </div>
                `;
            }
        }

    } catch (error) {
        hideLoading();
        console.error('Error loading order details:', error);
        await showError('Error', 'Failed to load order details. Please try again.');
    }
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('order-modal').style.display = 'none';
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('order-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Feedback modal logic
window.orderingSystem = window.orderingSystem || {};
window.orderingSystem.openFeedbackModal = async function(orderId) {
    // Render feedback form as SweetAlert2 modal
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    // If feedback already exists, do not allow submission
    if (allUserFeedback[orderId]) {
        Swal.fire({
            title: 'Feedback Already Submitted',
            text: 'You have already submitted feedback for this order.',
            icon: 'info',
            confirmButtonText: 'Close'
        });
        return;
    }
    let selectedRating = 0;
    let comment = '';
    await Swal.fire({
        title: 'Leave Feedback',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:1rem;">
                    <strong>Order:</strong> #${order.order_number}
                </div>
                <div style="margin-bottom:1rem;">
                    <strong>Rating:</strong><br/>
                    <span id="swal-stars">
                        ${[1,2,3,4,5].map(i => `<button type='button' class='swal-star' data-value='${i}' style='font-size:1.5em;border:none;background:none;color:#ccc;cursor:pointer;'>☆</button>`).join('')}
                    </span>
                </div>
                <div style="margin-bottom:1rem;">
                    <strong>Comment (optional):</strong><br/>
                    <textarea id="swal-comment" rows="3" style="width:100%;padding:6px;border-radius:4px;"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit',
        preConfirm: () => {
            const rating = selectedRating;
            const commentVal = document.getElementById('swal-comment').value;
            if (!rating) {
                Swal.showValidationMessage('Please select a rating');
                return false;
            }
            return { rating, comment: commentVal };
        },
        didOpen: () => {
            // Star picker logic
            const stars = Swal.getHtmlContainer().querySelectorAll('.swal-star');
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    selectedRating = parseInt(this.getAttribute('data-value'));
                    stars.forEach((s, idx) => {
                        s.textContent = idx < selectedRating ? '★' : '☆';
                        s.style.color = idx < selectedRating ? '#fbbf24' : '#ccc';
                    });
                });
            });
        }
    }).then(async result => {
        if (result.isConfirmed && result.value) {
            // Submit feedback
            try {
                const resp = await apiPost(API_ENDPOINTS.FEEDBACK_SUBMIT, {
                    order_id: orderId,
                    rating: result.value.rating,
                    comment: result.value.comment
                });
                // Update feedback cache
                await loadUserFeedback();
                // Refresh modal
                viewOrderDetails(orderId);
                Swal.fire({
                    title: 'Thank You!',
                    text: 'Your feedback has been submitted.',
                    icon: 'success',
                    confirmButtonText: 'Close'
                });
            } catch (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.message || 'Failed to submit feedback.',
                    icon: 'error',
                    confirmButtonText: 'Close'
                });
            }
        }
    });
};

/**
 * Cancel order
 */
async function cancelOrder(orderId) {
    const result = await Swal.fire({
        title: 'Cancel Order?',
        text: 'Are you sure you want to cancel this order? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: APP_CONFIG.THEME.PRIMARY,
        cancelButtonColor: APP_CONFIG.THEME.ACCENT,
        confirmButtonText: 'Yes, Cancel Order',
        cancelButtonText: 'No, Keep It'
    });

    if (result.isConfirmed) {
        try {
            showLoading('Cancelling order...');
            
            // TODO: Implement cancel order API endpoint on backend
            // For now, just show a message
            hideLoading();
            await showSuccess('Coming Soon', 'Order cancellation feature will be available soon.');
            
        } catch (error) {
            hideLoading();
            console.error('Error cancelling order:', error);
            await showError('Error', 'Failed to cancel order.');
        }
    }
}

/**
 * Navigate back
 */
function goBack() {
    window.location.href = '../user/dashboard.html';
}

/**
 * Navigate to ordering
 */
function goToOrdering() {
    window.location.href = 'menu.html';
}

/**
 * Logout function
 */
function logout() { return confirmLogout(); }

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Print order - opens receipt in new browser tab with PDF download option
 */
function printOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        alert('Order not found');
        return;
    }

    // Get items for this order
    const items = order.items && Array.isArray(order.items) ? order.items : [];

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);

    // Create professional invoice-style receipt template
    const receiptHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - Order #${order.order_number}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    padding: 15px;
                    color: #333;
                    line-height: 1.6;
                }

                .invoice-container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                /* Header Section */
                .invoice-header {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    color: white;
                    padding: 40px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .company-info h1 {
                    font-size: 28px;
                    margin-bottom: 5px;
                    font-weight: 700;
                }

                .company-info p {
                    font-size: 12px;
                    opacity: 0.85;
                    margin: 2px 0;
                }

                .invoice-number {
                    text-align: right;
                }

                .invoice-number .label {
                    font-size: 11px;
                    opacity: 0.8;
                    text-transform: uppercase;
                }

                .invoice-number .value {
                    font-size: 24px;
                    font-weight: bold;
                    margin-top: 5px;
                }

                /* Main Content */
                .invoice-content {
                    padding: 30px;
                }

                .info-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .info-block h3 {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #666;
                    margin-bottom: 12px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .info-block p {
                    font-size: 13px;
                    margin: 3px 0;
                    color: #333;
                }

                .info-block .label {
                    font-weight: 500;
                    color: #555;
                }

                /* Items Table */
                .items-section {
                    margin-bottom: 30px;
                }

                .items-section h3 {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #666;
                    margin-bottom: 15px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .items-table thead {
                    background-color: #f5f5f5;
                    border-top: 2px solid #2c3e50;
                    border-bottom: 2px solid #2c3e50;
                }

                .items-table th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #333;
                }

                .items-table td {
                    padding: 12px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .items-table tbody tr:last-child td {
                    border-bottom: 2px solid #2c3e50;
                }

                .text-right {
                    text-align: right;
                }

                .text-center {
                    text-align: center;
                }

                /* Summary Section */
                .summary-section {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 30px;
                }

                .summary-box {
                    width: 300px;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    font-size: 13px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .summary-row.total {
                    background-color: #f5f5f5;
                    border: 2px solid #2c3e50;
                    padding: 12px;
                    margin-top: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    color: #2c3e50;
                }

                .summary-row.subtotal {
                    padding-top: 15px;
                    font-weight: 500;
                }

                .summary-label {
                    color: #555;
                    font-weight: 500;
                }

                .summary-value {
                    font-weight: 600;
                    color: #333;
                }

                /* Footer */
                .invoice-footer {
                    background-color: #f8f9fa;
                    padding: 25px 30px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }

                .footer-text {
                    font-size: 12px;
                    color: #666;
                    margin: 5px 0;
                }

                .thank-you {
                    font-size: 13px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }

                /* Top Buttons */
                #topButtons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #ecf0f1;
                    border-radius: 4px;
                }

                .btn {
                    padding: 11px 22px;
                    border: none;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-download {
                    background-color: #27ae60;
                    color: white;
                }

                .btn-download:hover {
                    background-color: #229954;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .btn-close {
                    background-color: #95a5a6;
                    color: white;
                }

                .btn-close:hover {
                    background-color: #7f8c8d;
                    transform: translateY(-2px);
                }

                #receiptContent {
                    background: white;
                }

                @page {
                    size: A4;
                    margin: 10mm;
                }

                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    #topButtons {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            <div id="topButtons">
                <button class="btn btn-download" onclick="downloadPDF()">
                    <i class="fas fa-download"></i> Download Invoice
                </button>
                <button class="btn btn-close" onclick="window.close()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>

            <div id="receiptContent">
                <div class="invoice-container">
                    <!-- Header -->
                    <div class="invoice-header">
                        <div class="company-info">
                            <h1><i class="fas fa-utensils"></i> Food Ordering System</h1>
                            <p>Premium Food Delivery Service</p>
                            <p>Email: support@foodorder.com</p>
                            <p>Phone: +1 (555) 123-4567</p>
                        </div>
                        <div class="invoice-number">
                            <div class="label">Invoice Number</div>
                            <div class="value">#${order.order_number}</div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="invoice-content">
                        <!-- Info Section -->
                        <div class="info-section">
                            <div class="info-block">
                                <h3>Order Details</h3>
                                <p><span class="label">Order Date:</span> ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p><span class="label">Order Time:</span> ${new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                <p><span class="label">Status:</span> ${capitalize(order.status)}</p>
                            </div>
                            <div class="info-block">
                                <h3>Payment Info</h3>
                                <p><span class="label">Payment Method:</span> ${capitalize(order.payment_method)}</p>
                                <p><span class="label">Payment Status:</span> ${capitalize(order.payment_status)}</p>
                                <p><span class="label">Reference:</span> ${order.id}</p>
                            </div>
                            <div class="info-block">
                                <h3>Delivery Address</h3>
                                <p>${order.delivery_address || 'Not specified'}</p>
                            </div>
                        </div>

                        <!-- Items Table -->
                        <div class="items-section">
                            <h3>Order Items</h3>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th class="text-center">Quantity</th>
                                        <th class="text-right">Unit Price</th>
                                        <th class="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => `
                                        <tr>
                                            <td>${item.item_name}</td>
                                            <td class="text-center">${item.quantity} x</td>
                                            <td class="text-right">$${parseFloat(item.price).toFixed(2)}</td>
                                            <td class="text-right">$${parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Summary Section -->
                        <div class="summary-section">
                            <div class="summary-box">
                                <div class="summary-row subtotal">
                                    <span class="summary-label">Subtotal:</span>
                                    <span class="summary-value">$${subtotal.toFixed(2)}</span>
                                </div>
                                <div class="summary-row total">
                                    <span class="summary-label">TOTAL AMOUNT:</span>
                                    <span class="summary-value">$${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="invoice-footer">
                        <div class="thank-you">Thank you for your order!</div>
                        <div class="footer-text">For inquiries or support, please contact us.</div>
                        <div class="footer-text">We appreciate your business!</div>
                    </div>
                </div>
            </div>

            <script>
                function downloadPDF() {
                    const element = document.getElementById('receiptContent');
                    const opt = {
                        margin: [10, 10, 10, 10],
                        filename: 'invoice_${order.order_number}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, logging: false },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            </script>
        </body>
        </html>
    `;

    // Create blob URL for the receipt
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open receipt in new window
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    
    if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    } else {
        alert('Please disable popup blocker to open the invoice.');
    }
}
