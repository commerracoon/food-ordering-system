/**
 * Admin Order Management Module
 * Handles viewing, filtering, and updating orders with real-time status updates
 */

// Order status progression mapping
const ORDER_STATUS_FLOW = {
    pending: { next: 'confirmed', label: 'Confirm', color: '#EF4444' },
    confirmed: { next: 'preparing', label: 'Prepare', color: '#F97316' },
    preparing: { next: 'ready', label: 'Ready', color: '#3B82F6' },
    ready: { next: 'delivered', label: 'Deliver', color: '#8B5CF6' },
    delivered: { next: null, label: 'Done', color: '#10B981' },
    cancelled: { next: null, label: 'Cancelled', color: '#6B7280' }
};

const ORDER_STATUS_COLORS = {
    pending: '#EF4444',
    confirmed: '#F97316',
    preparing: '#3B82F6',
    ready: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#6B7280'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin Orders] Module loaded');
    loadAdminOrders();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
        const isVisible = document.getElementById('tab-orders')?.classList.contains('border-primary');
        if (isVisible) {
            loadAdminOrders(document.getElementById('filter-status')?.value || '');
        }
    }, 10000);
});

/**
 * Load and display all admin orders
 */
async function loadAdminOrders(status, query) {
    try {
        showLoading('Loading orders...');
        
        // Get values from filter inputs
        const filterStatus = status !== undefined ? status : (document.getElementById('filter-status')?.value || '');
        const filterQuery = query !== undefined ? query : (document.getElementById('filter-search')?.value || '');
        
        let url = API_ENDPOINTS.ADMIN_ORDER_LIST;
        const params = [];
        if (filterStatus) params.push(`status=${encodeURIComponent(filterStatus)}`);
        if (params.length) url += '?' + params.join('&');

        const res = await apiGet(url);
        const orders = res.orders || [];

        // Client-side filtering for search query
        let filtered = orders;
        if (filterQuery) {
            const q = filterQuery.toLowerCase();
            filtered = orders.filter(o => 
                (o.order_number && String(o.order_number).toLowerCase().includes(q)) || 
                (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
            );
        }

        // Update statistics
        updateOrderStats(orders);
        
        // Render table
        renderOrdersTable(filtered);
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error('[Admin Orders] Error:', err);
        const container = document.getElementById('orders-list');
        if (container) {
            container.innerHTML = `
                <div style="background-color: #FEE2E2; border: 1px solid #FECACA; border-radius: 6px; padding: 16px;">
                    <p style="color: #8B5CF6;"><i class="fas fa-exclamation-circle"></i> Failed to load orders</p>
                    <small style="color: #DC2626;">${err.message}</small>
                </div>
            `;
        }
    }
}

/**
 * Reset order filters
 */
function resetOrdersFilter() {
    const filterStatusEl = document.getElementById('filter-status');
    const filterSearchEl = document.getElementById('filter-search');
    
    if (filterStatusEl) filterStatusEl.value = '';
    if (filterSearchEl) filterSearchEl.value = '';
    
    loadAdminOrders();
}

/**
 * Update order statistics display
 */
function updateOrderStats(orders) {
    if (!orders || orders.length === 0) return;
    
    const pending = orders.filter(o => o.status === 'pending').length;
    const total = orders.length;
    
    const totalEl = document.getElementById('total-orders');
    const pendingEl = document.getElementById('pending-orders');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
}

/**
 * Render orders table with enhanced styling
 */
function renderOrdersTable(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="background-color: #DBEAFE; border: 1px solid #BFDBFE; border-radius: 6px; padding: 16px; text-align: center;">
                <p style="color: #1E40AF;"><i class="fas fa-inbox"></i> No orders found</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="overflow-x: auto; position: relative; z-index: 1;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background-color: #F3F4F6;">
                    <tr>
                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Order #</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Customer</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Contact</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 14px;">Total</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 14px;">Status</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Items</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">Created</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 14px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => createOrderRow(order)).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
    attachOrderListeners();
}

/**
 * Create HTML for a single order row
 */
function createOrderRow(order) {
    const itemsCount = (order.items && Array.isArray(order.items)) ? order.items.length : 0;
    const statusColor = ORDER_STATUS_COLORS[order.status] || '#6B7280';
    const createdDate = new Date(order.created_at);
    const timeAgo = formatTimeAgo(createdDate);

    return `
        <tr style="border-bottom: 1px solid #E5E7EB; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#F9FAFB'" onmouseout="this.style.backgroundColor=''">
            <td style="padding: 12px;"><strong style="color: #0284C7;">#${order.order_number || order.id}</strong></td>
            <td style="padding: 12px; font-weight: 500;">${escapeHtml(order.customer_name || 'Unknown')}</td>
            <td style="padding: 12px; font-size: 14px; color: #666;"><i class="fas fa-phone"></i> ${order.customer_phone || 'N/A'}</td>
            <td style="padding: 12px; text-align: right; font-weight: 600;">$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
            <td style="padding: 12px; text-align: center;">
                <span style="background-color: ${statusColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${capitalize(order.status)}
                </span>
            </td>
            <td style="padding: 12px;">
                <span style="background-color: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${itemsCount} item${itemsCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td style="padding: 12px; font-size: 13px; color: #666;">${timeAgo}</td>
            <td style="padding: 12px; text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button style="padding: 6px 10px; background-color: #E0E7FF; color: #3730A3; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" 
                            onclick="viewOrderDetails(${order.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div style="position: relative; display: inline-block;">
                        <button style="padding: 6px 10px; background-color: #DBEAFE; color: #0284C7; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;" 
                                class="order-status-btn" title="Update Status" data-order-id="${order.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <div style="display: none; position: fixed; background: white; border: 1px solid #E5E7EB; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; min-width: 140px;" class="order-status-menu" data-order-id="${order.id}">
                            ${createStatusOptions(order.id, order.status)}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Create status update dropdown options
 */
function createStatusOptions(orderId, currentStatus) {
    const statuses = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    return statuses
        .filter(s => s !== currentStatus)
        .map(status => `
            <button style="display: block; width: 100%; padding: 10px; text-align: left; border: none; background: transparent; cursor: pointer; font-size: 13px; color: #374151; transition: background-color 0.2s;" 
                    onmouseover="this.style.backgroundColor='#F3F4F6'" onmouseout="this.style.backgroundColor=''"
                    onclick="updateOrderStatus(${orderId}, '${status}')">
                <i class="fas fa-arrow-right"></i> ${capitalize(status)}
            </button>
        `)
        .join('') || '<p style="padding: 10px; color: #999; font-size: 12px;">No actions</p>';
}

/**
 * Attach event listeners to order table elements
 */
function attachOrderListeners() {
    console.log('[Admin Orders] Attaching order listeners...');
    
    // Attach click listeners to status buttons
    document.querySelectorAll('.order-status-btn').forEach((btn, index) => {
        console.log('[Admin Orders] Attaching listener to status button', index);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('[Admin Orders] Status button clicked at index', index);
            toggleStatusMenu(btn);
        });
    });

    // Close all menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.order-status-btn') && !e.target.closest('.order-status-menu')) {
            console.log('[Admin Orders] Closing all menus due to outside click');
            document.querySelectorAll('.order-status-menu').forEach(m => m.style.display = 'none');
        }
    });
}

/**
 * Toggle status menu visibility with proper positioning
 */
function toggleStatusMenu(btn) {
    console.log('[Admin Orders] Toggle status menu clicked', btn);
    
    // Get the button's position
    const rect = btn.getBoundingClientRect();
    const menuSelector = btn.closest('div[style*="position"]')?.querySelector('.order-status-menu') || 
                        btn.parentElement.querySelector('.order-status-menu');
    
    if (!menuSelector) {
        console.error('[Admin Orders] Menu not found!');
        return;
    }
    
    const isHidden = menuSelector.style.display === 'none';
    
    if (isHidden) {
        // Position the menu below the button
        menuSelector.style.display = 'block';
        menuSelector.style.left = (rect.left) + 'px';
        menuSelector.style.top = (rect.bottom + 2) + 'px';
        console.log('[Admin Orders] Menu positioned at:', rect.left, rect.bottom + 2);
    } else {
        menuSelector.style.display = 'none';
        console.log('[Admin Orders] Menu hidden');
    }
}

/**
 * View detailed order information
 */
async function viewOrderDetails(orderId) {
    try {
        showLoading('Loading order details...');
        const res = await apiGet(`${API_ENDPOINTS.ORDER_DETAILS || API_URL + '/order/order'}/${orderId}`);
        hideLoading();

        const order = res.order || res;
        const items = res.items || [];

        let itemsHtml = '<div style="space-y: 8px;">';
        if (items.length > 0) {
            itemsHtml += items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #EDEDB3; align-items: center;">
                    <div>
                        <strong>${escapeHtml(item.item_name)}</strong><br/>
                        <small style="color: #999;">Qty: ${item.quantity}</small>
                    </div>
                    <div style="text-align: right; font-weight: 600;">$${parseFloat(item.subtotal).toFixed(2)}</div>
                </div>
            `).join('');
        } else {
            itemsHtml += '<p style="color: #999; padding: 8px;">No items</p>';
        }
        itemsHtml += '</div>';

        const statusColor = ORDER_STATUS_COLORS[order.status];

        const html = `
            <div style="text-align: left; line-height: 1.6;">
                <div style="background-color: #DBEAFE; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #1E40AF; margin: 0;">Order Number</p>
                    <p style="font-size: 18px; font-weight: bold; color: #0284C7; margin: 4px 0 0 0;">#${order.order_number || order.id}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #666; margin: 0;">Status</p>
                        <p style="margin: 8px 0 0 0;">
                            <span style="background-color: ${statusColor}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;">
                                ${capitalize(order.status)}
                            </span>
                        </p>
                    </div>
                    <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #666; margin: 0;">Total Amount</p>
                        <p style="font-size: 20px; font-weight: bold; color: #0284C7; margin: 4px 0 0 0;">$${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                </div>
                
                <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #666; margin: 0;">Customer Information</p>
                    <p style="font-weight: 600; margin: 8px 0 0 0;">${escapeHtml(order.customer_name || 'Unknown')}</p>
                    <p style="font-size: 13px; color: #666; margin: 2px 0;"><i class="fas fa-phone"></i> ${order.customer_phone || 'N/A'}</p>
                </div>
                
                <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #666; margin: 0;">Delivery Address</p>
                    <p style="font-weight: 600; margin: 8px 0 0 0;">${escapeHtml(order.delivery_address || 'Not provided')}</p>
                </div>
                
                <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #666; margin: 0 0 12px 0;">Order Items (${items.length})</p>
                    ${itemsHtml}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                    <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px;">
                        <p style="color: #666; margin: 0;">Payment Method</p>
                        <p style="font-weight: 600; margin: 4px 0 0 0;">${capitalize(order.payment_method || 'cash')}</p>
                    </div>
                    <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px;">
                        <p style="color: #666; margin: 0;">Payment Status</p>
                        <p style="font-weight: 600; margin: 4px 0 0 0;">${capitalize(order.payment_status || 'pending')}</p>
                    </div>
                </div>
            </div>
        `;

        await Swal.fire({
            title: 'Order Details',
            html: html,
            width: '600px',
            confirmButtonColor: '#0284C7'
        });

    } catch (err) {
        hideLoading();
        console.error('Error loading details:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load order details: ' + err.message,
            confirmButtonColor: '#EF4444'
        });
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    const confirm = await Swal.fire({
        title: 'Update Order Status',
        text: `Change order status to ${capitalize(newStatus)}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0284C7',
        cancelButtonColor: '#6B7280'
    });

    if (!confirm.isConfirmed) return;

    try {
        showLoading('Updating order status...');
        await apiPut(`${API_ENDPOINTS.ORDER_UPDATE_STATUS}/${orderId}`, { status: newStatus });
        hideLoading();
        
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Order status updated to ' + capitalize(newStatus),
            confirmButtonColor: '#10B981'
        });
        
        loadAdminOrders(document.getElementById('filter-status')?.value || '');
        
    } catch (err) {
        hideLoading();
        console.error('Error updating status:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update order status: ' + err.message,
            confirmButtonColor: '#EF4444'
        });
    }
}

/**
 * Handle search with debounce
 */
let searchTimeout = null;
function handleSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const status = document.getElementById('filter-status')?.value || '';
        loadAdminOrders(status, query);
    }, 500);
}

// Global exports
window.loadAdminOrders = loadAdminOrders;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.handleSearch = handleSearch;
window.toggleStatusMenu = toggleStatusMenu;
window.resetOrdersFilter = resetOrdersFilter;

// ============ UTILITY FUNCTIONS ============

function formatTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 2592000) return Math.floor(seconds / 86400) + 'd ago';
    return Math.floor(seconds / 2592000) + 'mo ago';
}

function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, s => map[s]);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

