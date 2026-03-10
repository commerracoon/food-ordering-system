// Feedback frontend logic

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure user is logged in
    if (!isLoggedIn()) {
        window.location.href = '../auth/login.html';
        return;
    }

    // init navbar (if loaded)
    if (typeof initNavigation === 'function') initNavigation();

    const orderSelect = document.getElementById('order-select');
    const form = document.getElementById('feedback-form');
    const submitBtn = document.getElementById('submit-btn');

    // Load eligible orders and populate select
    let eligibleOrders = [];
    try {
        orderSelect.innerHTML = '<option value="">Loading orders...</option>';
        
        try {
            const resp = await apiGet(API_ENDPOINTS.FEEDBACK_ELIGIBLE);
            eligibleOrders = resp.orders || [];
        } catch (apiErr) {
            // If eligible orders endpoint fails, try to load all delivered orders
            console.warn('Could not load eligible orders, trying alternative method:', apiErr);
            try {
                const allOrdersResp = await apiGet(API_ENDPOINTS.ORDER_LIST);
                eligibleOrders = (allOrdersResp.orders || []).filter(o => o.status === 'delivered');
            } catch (fallbackErr) {
                throw new Error('Failed to load orders: ' + (fallbackErr.message || 'Unknown error'));
            }
        }

        if (eligibleOrders.length === 0) {
            orderSelect.innerHTML = '<option value="">No eligible orders found</option>';
            orderSelect.disabled = true;
            submitBtn.disabled = true;
        } else {
            orderSelect.innerHTML = '<option value="">Select an order</option>' + eligibleOrders.map(o => {
                const label = o.order_number ? `#${o.order_number}` : `Order ${o.id}`;
                const date = o.delivered_at ? new Date(o.delivered_at).toLocaleString() : '';
                return `<option value="${o.id}">${label} — ${date} — ${APP_CONFIG.DEFAULT_CURRENCY}${parseFloat(o.total_amount||0).toFixed(2)}</option>`;
            }).join('');
        }
    } catch (err) {
        console.error('Failed to load eligible orders', err);
        orderSelect.innerHTML = '<option value="">Failed to load orders</option>';
        orderSelect.disabled = true;
        submitBtn.disabled = true;
    }

    // Preselect order if provided in query params
    const params = new URLSearchParams(window.location.search);
    const preselectOrderId = params.get('order_id') || params.get('order') || null;
    if (preselectOrderId) {
        // If eligibleOrders includes it, select it; otherwise show warning and disable
        const found = eligibleOrders.find(o => String(o.id) === String(preselectOrderId));
        if (found) {
            orderSelect.value = String(preselectOrderId);
        } else {
            await Swal.fire({icon: 'info', title: 'Order not eligible', text: 'This order is not eligible for feedback or feedback was already submitted.'});
            // disable submitting
            orderSelect.disabled = true;
            submitBtn.disabled = true;
        }
    }

    // Star picker handling
    const stars = Array.from(document.querySelectorAll('#star-picker .star'));
    const ratingInput = document.getElementById('rating-select');
    let selectedRating = null;

    function updateStars(value) {
        stars.forEach(s => {
            const v = Number(s.getAttribute('data-value'));
            if (v <= value) {
                s.textContent = '★';
                s.setAttribute('aria-checked', 'true');
                s.classList.add('selected');
            } else {
                s.textContent = '☆';
                s.setAttribute('aria-checked', 'false');
                s.classList.remove('selected');
            }
        });
        if (ratingInput) ratingInput.value = value;
        selectedRating = value;
    }

    stars.forEach(s => {
        s.addEventListener('click', () => {
            const v = Number(s.getAttribute('data-value'));
            updateStars(v);
        });
        s.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const v = Number(s.getAttribute('data-value'));
                updateStars(v);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const orderId = document.getElementById('order-select') ? document.getElementById('order-select').value : null;
        const rating = ratingInput ? ratingInput.value : selectedRating;
        const comment = document.getElementById('comment').value;

        if (!orderId || !rating) {
            await Swal.fire({icon: 'warning', title: 'Missing fields', text: 'Please choose an order and rating.'});
            return;
        }

        // Double-check eligibility right before submit to prevent duplicate feedback
        try {
            const checkResp = await apiGet(API_ENDPOINTS.FEEDBACK_ELIGIBLE);
            const stillEligible = (checkResp.orders || []).some(o => String(o.id) === String(orderId));
            if (!stillEligible) {
                await Swal.fire({icon: 'info', title: 'No longer eligible', text: 'This order is no longer eligible for feedback (maybe you already submitted).'});
                // disable submitting
                if (orderSelect) orderSelect.disabled = true;
                submitBtn.disabled = true;
                return;
            }
        } catch (e) {
            // If eligibility check fails, continue but warn
            console.warn('Eligibility check failed, proceeding with submission', e);
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const payload = {
                order_id: Number(orderId),
                rating: Number(rating),
                comment: comment
            };

            const res = await apiPost(API_ENDPOINTS.FEEDBACK_SUBMIT, payload);
            await Swal.fire({icon: 'success', title: 'Thank you!', text: res.message || 'Feedback submitted.'});
            // redirect to order history
            window.location.href = '../order/order-history.html';

        } catch (err) {
            console.error('Submit feedback failed', err);
            handleApiError(err, 'Failed to submit feedback');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback';
        }
    });
});
