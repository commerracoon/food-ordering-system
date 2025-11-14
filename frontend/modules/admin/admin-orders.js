// Admin Orders Management
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize when on admin dashboard orders tab
    if (window.location.pathname.endsWith('/admin/dashboard.html') || true) {
        // Load orders immediately
        loadAdminOrders();
    }
});

async function loadAdminOrders(status = '', query = '') {
    try {
        showLoading('Loading orders...');
        let url = API_ENDPOINTS.ADMIN_ORDER_LIST;
        const params = [];
        if (status) params.push(`status=${encodeURIComponent(status)}`);
        if (query) params.push(`q=${encodeURIComponent(query)}`);
        if (params.length) url += '?' + params.join('&');

        const res = await apiGet(url);
        const orders = res.orders || [];

        // If a search query is provided, also filter client-side for safety
        let filtered = orders;
        if (query) {
            const q = query.toLowerCase();
            filtered = orders.filter(o => (o.order_number && String(o.order_number).toLowerCase().includes(q)) || (o.customer_name && o.customer_name.toLowerCase().includes(q)));
        }

        renderOrdersTable(filtered);
        hideLoading();
    } catch (err) {
        hideLoading();
        handleApiError(err, 'Failed to load orders');
        document.getElementById('orders-list').innerHTML = '<p class="text-red-500">Failed to load orders.</p>';
    }
}

function renderOrdersTable(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No orders found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'w-full table-auto border-collapse';
    table.innerHTML = `
        <thead>
            <tr class="text-left">
                <th class="p-2">Order#</th>
                <th class="p-2">Customer</th>
                <th class="p-2">Total</th>
                <th class="p-2">Status</th>
                <th class="p-2">Created</th>
                <th class="p-2">Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        tr.innerHTML = `
            <td class="p-2">${o.order_number || o.id}</td>
            <td class="p-2">${escapeHtml(o.customer_name || 'Unknown')}<br/><small class="text-gray-500">${escapeHtml(o.customer_phone || '')}</small></td>
            <td class="p-2">${formatCurrency(o.total_amount || 0)}</td>
            <td class="p-2"><span class="status-badge status-${o.status}">${capitalize(o.status)}</span></td>
            <td class="p-2">${formatDateTime(o.created_at)}</td>
            <td class="p-2">
                <div class="flex gap-2">
                    <button class="btn-small btn-secondary" onclick="viewOrder(${o.id})">View</button>
                    <button class="btn-small btn-primary" onclick="openEditOrderModal(${o.id})">Edit</button>
                    <div class="dropdown">
                        <button class="btn-small btn-outline">Update Status</button>
                        <div class="dropdown-menu hidden">
                            <button class="btn-small" onclick="updateOrderStatus(${o.id}, 'confirmed')">Confirm</button>
                            <button class="btn-small" onclick="updateOrderStatus(${o.id}, 'preparing')">Preparing</button>
                            <button class="btn-small" onclick="updateOrderStatus(${o.id}, 'ready')">Ready</button>
                            <button class="btn-small" onclick="updateOrderStatus(${o.id}, 'delivered')">Delivered</button>
                            <button class="btn-small" onclick="updateOrderStatus(${o.id}, 'cancelled')">Cancel</button>
                        </div>
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    container.innerHTML = '';
    container.appendChild(table);

    // attach simple dropdown toggle
    document.querySelectorAll('.dropdown').forEach(d => {
        const btn = d.querySelector('button');
        const menu = d.querySelector('.dropdown-menu');
        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });
        }
    });

    // close dropdown on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
    });
}

async function viewOrder(orderId) {
    try {
        showLoading('Loading order details...');
        const res = await apiGet(`${API_URL}/order/order/${orderId}`);
        hideLoading();
        // Show details modal using existing modal pattern if available
        const order = res.order;
        const items = res.items || [];
        let html = `<p><strong>Order #${order.order_number}</strong></p>`;
        html += `<p>Customer: ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_phone)})</p>`;
        html += `<p>Delivery: ${escapeHtml(order.delivery_address || '')}</p>`;
        html += '<hr/>';
        html += '<ul>';
        items.forEach(it => html += `<li>${escapeHtml(it.item_name)} x ${it.quantity} - ${formatCurrency(it.subtotal)}</li>`);
        html += '</ul>';

        Swal.fire({
            title: 'Order Details',
            html: html,
            width: '600px'
        });
    } catch (err) {
        hideLoading();
        handleApiError(err, 'Failed to load order details');
    }
}

async function updateOrderStatus(orderId, status) {
    const result = await Swal.fire({
        title: 'Update Order Status',
        text: `Change order status to ${status}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: APP_CONFIG.THEME.PRIMARY
    });

    if (!result.isConfirmed) return;

    try {
        showLoading('Updating status...');
        await apiPut(`${API_ENDPOINTS.ORDER_UPDATE_STATUS}/${orderId}`, { status });
        hideLoading();
        await showSuccess('Updated', 'Order status updated successfully');
        loadAdminOrders();
    } catch (err) {
        hideLoading();
        handleApiError(err, 'Failed to update status');
    }
}

// Edit order - allow editing delivery_address and special_instructions
async function openEditOrderModal(orderId) {
    try {
        showLoading('Loading order...');
        const res = await apiGet(`${API_URL}/order/order/${orderId}`);
        hideLoading();
        const order = res.order;

        const { value: formValues } = await Swal.fire({
            title: 'Edit Order',
            html: `
                <label>Delivery Address</label>
                <input id="swal-address" class="swal2-input" value="${escapeHtml(order.delivery_address || '')}">
                <label>Special Instructions</label>
                <input id="swal-instr" class="swal2-input" value="${escapeHtml(order.special_instructions || '')}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                return {
                    delivery_address: document.getElementById('swal-address').value,
                    special_instructions: document.getElementById('swal-instr').value
                };
            }
        });

        if (!formValues) return;

        showLoading('Saving changes...');
        await apiPut(`${API_ENDPOINTS.ORDER_UPDATE}/${orderId}`, formValues);
        hideLoading();
        await showSuccess('Saved', 'Order updated successfully');
        loadAdminOrders();

    } catch (err) {
        hideLoading();
        handleApiError(err, 'Failed to edit order');
    }
}

// Small helpers
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }
function capitalize(s){ if(!s) return ''; return s.charAt(0).toUpperCase()+s.slice(1); }

// Debounced search helper
let _searchTimer = null;
function debouncedSearch(value) {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
        const status = document.getElementById('filter-status').value;
        loadAdminOrders(status, value);
    }, 400);
}
