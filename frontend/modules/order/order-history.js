/**
 * Order History Module
 * Handles displaying and managing user's order history
 */

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        // Try backend session check as a fallback (supports session-cookie auth)
        try {
            const sess = await checkSession();
            if (sess && sess.logged_in) {
                // If backend returned limited info, fetch profile for complete user data
                let userId = sess.user_id || null;
                let username = sess.username || null;
                let userType = sess.user_type || 'user';

                if (!userId || !username) {
                    try {
                        const profileResp = await apiGet(API_ENDPOINTS.USER_PROFILE);
                        const profileUser = profileResp.user || profileResp.data || null;
                        if (profileUser) {
                            userId = userId || profileUser.id || profileUser.user_id;
                            username = username || profileUser.username || profileUser.full_name || profileUser.email;
                        }
                    } catch (profileErr) {
                        console.warn('Could not fetch profile during session fallback:', profileErr);
                    }
                }

                if (userId && username) {
                    // Save basic session info to localStorage so frontend utilities work
                    saveUserSession({ id: userId, username: username, user_type: userType }, null);
                } else {
                    // Not enough info to populate session; still allow the page to attempt API calls
                    console.warn('Session present but user info incomplete; proceeding without localStorage values.');
                }

                } else {
                    // Show a friendly message and let the user choose to login or go back
                    try {
                                const res = await Swal.fire({
                                    title: 'Not signed in',
                                    text: 'Please sign in to view your order history.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Go to Login',
                                    cancelButtonText: 'Back to Dashboard',
                                    confirmButtonColor: APP_CONFIG.THEME.PRIMARY
                                });

                        if (res.isConfirmed) {
                            window.location.href = '../auth/login.html';
                        } else {
                            window.location.href = '../user/dashboard.html';
                        }
                    } catch (swalErr) {
                        // Fallback: if SweetAlert is not available or fails, redirect as before
                        console.error('SweetAlert failed, falling back to redirect:', swalErr);
                        window.location.href = '../auth/login.html';
                    }
                    return;
                }
        } catch (err) {
            console.error('Session fallback check failed:', err);
            try {
                const res = await Swal.fire({
                    title: 'Session Check Failed',
                    text: 'Could not verify your session. Would you like to retry or go to login?',
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'Go to Login',
                    cancelButtonText: 'Retry',
                    confirmButtonColor: APP_CONFIG.THEME.PRIMARY
                });

                if (res.isConfirmed) {
                    window.location.href = '../auth/login.html';
                } else {
                    // Try reloading the page (which will re-run the session check)
                    window.location.reload();
                }
            } catch (swalErr) {
                console.error('SweetAlert failed, falling back to redirect:', swalErr);
                window.location.href = '../auth/login.html';
            }
            return;
        }
    }

    // Get current user
    currentUser = getCurrentUser();
    document.getElementById('user-name').textContent = currentUser.userName;

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
        
        const endpoint = `${API_ENDPOINTS.ORDER_DETAILS}/my-orders`;
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
                        ${order.status === 'delivered' ? `
                            <button class="btn-small btn-secondary" onclick="provideFeedback(${order.id})">
                                <i class="fas fa-star"></i> Leave Feedback
                            </button>
                        ` : ''}
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

        const endpoint = `${API_ENDPOINTS.ORDER_DETAILS}/order/${orderId}`;
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
            <div style="background: #f9fafb; border-radius: 8px; padding: 1rem;">
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

            <!-- Action Buttons -->
            <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
                <button class="btn-small btn-primary" style="flex: 1; justify-content: center;" onclick="printOrder(${order.id})">
                    <i class="fas fa-print"></i> Print Order
                </button>
                ${order.status === 'delivered' ? `
                    <button class="btn-small btn-secondary" style="flex: 1; justify-content: center;" onclick="provideFeedback(${order.id}); closeModal();">
                        <i class="fas fa-star"></i> Leave Feedback
                    </button>
                ` : ''}
            </div>
        `;

        document.getElementById('modal-order-title').textContent = `Order #${order.order_number}`;
        document.getElementById('order-modal').style.display = 'block';

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

/**
 * Print order (basic implementation)
 */
async function printOrder(orderId) {
    try {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        // Get full order details
        const endpoint = `${API_ENDPOINTS.ORDER_DETAILS}/order/${orderId}`;
        const response = await apiGet(endpoint);
        
        const orderData = response.order;
        const items = response.items || [];

        // Build a MYR-style receipt (compact, monospace)
        const merchantName = APP_CONFIG.APP_NAME || 'Food Ordering System';
        const merchantAddress = '123 Food Street, Kuala Lumpur';
        const receiptWidth = 320; // px, typical thermal receipt width

        // Calculate subtotal from items
        const calcSubtotal = items.reduce((s, it) => s + parseFloat(it.subtotal || (it.price * it.quantity)), 0);
        const tax = parseFloat((calcSubtotal * (APP_CONFIG.TAX_RATE || 0)).toFixed(2));
        const deliveryFee = parseFloat(orderData.delivery_fee || APP_CONFIG.DELIVERY_FEE || 0);
        const totalAmount = parseFloat(orderData.total_amount || (calcSubtotal + tax + deliveryFee));

        function fmt(v) { return formatCurrency(v, 'RM'); }

        let printContent = `
            <div style="font-family: 'Courier New', monospace; max-width: ${receiptWidth}px; margin: 0 auto; padding: 12px; font-size: 12px; color: #000;">
                <div style="text-align:center; font-weight:700; font-size:14px;">${merchantName}</div>
                <div style="text-align:center; font-size:11px; margin-bottom:8px;">${merchantAddress}</div>
                <div style="border-top:1px dashed #000; margin:6px 0;"></div>

                <div>Receipt: ${orderData.order_number}</div>
                <div>Date: ${new Date(orderData.created_at).toLocaleString('en-GB')}</div>
                <div>Status: ${capitalize(orderData.status)}</div>
                <div style="border-top:1px dashed #000; margin:6px 0;"></div>

                <div style="width:100%;">
                    <table style="width:100%; font-family: monospace; font-size:12px;">
                        <tbody>
        `;

        // Items: show name (possibly truncated), qty x unit, line total
        items.forEach(it => {
            const name = (it.item_name || '').substring(0, 24);
            const qty = parseInt(it.quantity || 1);
            const unit = parseFloat(it.price || 0);
            const lineTotal = parseFloat(it.subtotal || (unit * qty));
            printContent += `
                        <tr>
                            <td style="text-align:left; vertical-align:top;">${name}</td>
                            <td style="text-align:right; width:48px;">${qty} x</td>
                            <td style="text-align:right; width:80px;">${fmt(unit)}</td>
                            <td style="text-align:right; width:80px;">${fmt(lineTotal)}</td>
                        </tr>
                        `;
            if (it.special_request) {
                const req = (it.special_request || '').substring(0, 40);
                printContent += `
                        <tr><td colspan="4" style="text-align:left; font-size:11px; color:#555;">Note: ${req}</td></tr>
                        `;
            }
        });

        printContent += `
                        </tbody>
                    </table>
                </div>

                <div style="border-top:1px dashed #000; margin:6px 0;"></div>
                <div style="display:flex; justify-content:space-between; font-weight:600;">
                    <div>Subtotal</div>
                    <div>${fmt(calcSubtotal)}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div>Tax (${Math.round((APP_CONFIG.TAX_RATE||0)*100)}%)</div>
                    <div>${fmt(tax)}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div>Delivery</div>
                    <div>${fmt(deliveryFee)}</div>
                </div>
                <div style="border-top:1px solid #000; margin:6px 0;"></div>
                <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:800;">
                    <div>Total</div>
                    <div>${fmt(totalAmount)}</div>
                </div>

                <div style="margin-top:8px;">Payment: ${capitalize(orderData.payment_method)} (${capitalize(orderData.payment_status)})</div>

                <div style="border-top:1px dashed #000; margin:10px 0;"></div>
                <div style="text-align:center; font-size:11px;">Thank you for ordering!</div>
            </div>
        `;

        // Attempt to open a new window/tab for printing
        let printed = false;
        try {
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow && printWindow.document) {
                printWindow.document.write(printContent);
                printWindow.document.close();
                // Give the new window a moment to render
                setTimeout(() => {
                    try { printWindow.focus(); printWindow.print(); printed = true; } catch (e) { /* ignore */ }
                }, 250);
            }
        } catch (e) {
            // window.open may be blocked or unavailable (Electron/embedded contexts)
            console.warn('window.open print failed, will try iframe fallback', e);
        }

        // If window.open didn't work within a short timeframe, use an iframe fallback
        if (!printed) {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                const doc = iframe.contentWindow || iframe.contentDocument;
                const idoc = doc.document || doc;
                idoc.open();
                idoc.write(printContent);
                idoc.close();

                // Wait a bit for content to render then print
                setTimeout(() => {
                    try {
                        (iframe.contentWindow || iframe).focus();
                        (iframe.contentWindow || iframe).print();
                    } catch (err) {
                        console.error('Iframe print failed', err);
                        showError('Printing not supported in this environment.');
                    } finally {
                        // Clean up
                        setTimeout(() => { document.body.removeChild(iframe); }, 500);
                    }
                }, 500);

            } catch (err) {
                console.error('Error using iframe print fallback:', err);
                await showError('Printing not supported in this environment.');
            }
        }

    } catch (error) {
        console.error('Error printing order:', error);
        await showError('Error', 'Failed to print order.');
    }
}

/**
 * Provide feedback for delivered order
 */
function provideFeedback(orderId) {
    alert('Feedback feature coming soon! You will be able to rate items and leave reviews.');
    // TODO: Implement feedback form
}

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
