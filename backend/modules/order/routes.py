"""
Order Module - Handle menu list, cart, and order placement
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from common import Database, dict_to_sql_insert
from common.middleware import get_token_from_request, decode_token

order_bp = Blueprint('order', __name__, url_prefix='/api/order')


# ============================================
# MENU LIST
# ============================================

@order_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories"""
    try:
        categories = Database.execute_query(
            """SELECT id, name, description, image_url, display_order 
               FROM categories 
               WHERE is_active = TRUE 
               ORDER BY display_order, name""",
            fetch_all=True
        )
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@order_bp.route('/menu', methods=['GET'])
def get_menu():
    """Get menu items with optional category filter"""
    try:
        category_id = request.args.get('category_id')
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        
        # Base query with ratings
        query = """
            SELECT 
                m.id, m.name, m.description, m.price, m.image_url,
                m.is_available, m.is_featured, m.preparation_time,
                c.name as category_name, c.id as category_id,
                COALESCE(r.average_rating, 0) as average_rating,
                COALESCE(r.total_ratings, 0) as total_ratings
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            LEFT JOIN menu_item_ratings r ON m.id = r.menu_item_id
            WHERE m.is_available = TRUE
        """
        
        params = []
        
        if category_id:
            query += " AND m.category_id = %s"
            params.append(category_id)
        
        if featured_only:
            query += " AND m.is_featured = TRUE"
        
        query += " ORDER BY m.is_featured DESC, m.name"
        
        menu_items = Database.execute_query(query, tuple(params) if params else None, fetch_all=True)
        
        return jsonify({'menu_items': menu_items}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@order_bp.route('/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Get single menu item with details and reviews"""
    try:
        # Get menu item
        item = Database.execute_query(
            """SELECT 
                m.id, m.name, m.description, m.price, m.image_url,
                m.is_available, m.is_featured, m.preparation_time,
                c.name as category_name, c.id as category_id,
                COALESCE(r.average_rating, 0) as average_rating,
                COALESCE(r.total_ratings, 0) as total_ratings
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            LEFT JOIN menu_item_ratings r ON m.id = r.menu_item_id
            WHERE m.id = %s""",
            (item_id,),
            fetch_one=True
        )
        
        if not item:
            return jsonify({'error': 'Menu item not found'}), 404
        
        # Get recent reviews
        reviews = Database.execute_query(
            """SELECT 
                f.id, f.rating, f.comment, f.created_at,
                u.full_name as customer_name
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE f.menu_item_id = %s AND f.is_approved = TRUE
            ORDER BY f.created_at DESC
            LIMIT 10""",
            (item_id,),
            fetch_all=True
        )
        
        return jsonify({
            'item': item,
            'reviews': reviews
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# PLACE ORDER
# ============================================

@order_bp.route('/place', methods=['POST'])
def place_order():
    """Place a new order"""
    try:
        # Check if user is logged in (support both JWT and session)
        user_id = None
        user_type = None

        # Try JWT token first
        token = get_token_from_request()
        if token:
            payload = decode_token(token)
            if payload:
                user_id = payload.get('user_id')
                user_type = payload.get('user_type')

        # Fallback to session
        if not user_id:
            user_id = session.get('user_id')
            user_type = session.get('user_type')

        if not user_id or user_type != 'user':
            return jsonify({'error': 'Please login to place an order'}), 401

        data = request.json
        
        # Validate required fields
        if not data.get('items') or len(data['items']) == 0:
            return jsonify({'error': 'Order must contain at least one item'}), 400
        
        # Calculate total
        total_amount = 0
        order_items = []
        
        for item in data['items']:
            # Get menu item price
            menu_item = Database.execute_query(
                "SELECT id, price, is_available FROM menu_items WHERE id = %s",
                (item['menu_item_id'],),
                fetch_one=True
            )
            
            if not menu_item:
                return jsonify({'error': f'Menu item {item["menu_item_id"]} not found'}), 404
            
            if not menu_item['is_available']:
                return jsonify({'error': f'Menu item {item["menu_item_id"]} is not available'}), 400
            
            quantity = int(item['quantity'])
            price = float(menu_item['price'])
            subtotal = price * quantity
            total_amount += subtotal
            
            order_items.append({
                'menu_item_id': menu_item['id'],
                'quantity': quantity,
                'price': price,
                'subtotal': subtotal,
                'special_request': item.get('special_request', '')
            })
        
        # Create order
        order_data = {
            'user_id': user_id,
            'order_number': '',  # Will be auto-generated by trigger
            'total_amount': total_amount,
            'status': 'pending',
            'payment_method': data.get('payment_method', 'cash'),
            'payment_status': 'pending',
            'delivery_address': data.get('delivery_address', ''),
            'special_instructions': data.get('special_instructions', '')
        }
        
        query, values = dict_to_sql_insert('orders', order_data)
        order_id = Database.execute_query(query, values)
        
        # Insert order items
        for item in order_items:
            item['order_id'] = order_id
            query, values = dict_to_sql_insert('order_items', item)
            Database.execute_query(query, values)
        
        # Get order number
        order = Database.execute_query(
            "SELECT order_number FROM orders WHERE id = %s",
            (order_id,),
            fetch_one=True
        )
        
        return jsonify({
            'message': 'Order placed successfully',
            'order_id': order_id,
            'order_number': order['order_number'],
            'total_amount': total_amount
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ORDER LIST
# ============================================

@order_bp.route('/my-orders', methods=['GET'])
def get_my_orders():
    """Get current user's orders"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Unauthorized'}), 401

        user_id = session['user_id']

        # Get orders
        orders = Database.execute_query(
            """SELECT
                id, order_number, total_amount, status,
                payment_method, payment_status, created_at, delivered_at
            FROM orders
            WHERE user_id = %s
            ORDER BY created_at DESC""",
            (user_id,),
            fetch_all=True
        )

        return jsonify({'orders': orders}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@order_bp.route('/order/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    """Get order details with items"""
    try:
        # Check if user is logged in
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        user_id = session['user_id']
        user_type = session.get('user_type')

        # Get order
        order = Database.execute_query(
            """SELECT
                o.id, o.order_number, o.total_amount, o.status,
                o.payment_method, o.payment_status, o.delivery_address,
                o.special_instructions, o.created_at, o.delivered_at,
                u.full_name as customer_name, u.phone as customer_phone,
                u.email as customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = %s""",
            (order_id,),
            fetch_one=True
        )

        if not order:
            return jsonify({'error': 'Order not found'}), 404

        # Check permission (user can only see their own orders, admin can see all)
        if user_type == 'user':
            order_user = Database.execute_query(
                "SELECT user_id FROM orders WHERE id = %s",
                (order_id,),
                fetch_one=True
            )
            if order_user['user_id'] != user_id:
                return jsonify({'error': 'Unauthorized'}), 403

        # Get order items
        items = Database.execute_query(
            """SELECT
                oi.id, oi.quantity, oi.price, oi.subtotal, oi.special_request,
                m.name as item_name, m.description as item_description,
                m.image_url
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = %s""",
            (order_id,),
            fetch_all=True
        )

        return jsonify({
            'order': order,
            'items': items
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN: ALL ORDERS
# ============================================

@order_bp.route('/all', methods=['GET'])
def get_all_orders():
    """Get all orders (admin only)"""
    try:
        # Check if admin is logged in
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required'}), 403

        status = request.args.get('status')

        query = """
            SELECT
                o.id, o.order_number, o.total_amount, o.status,
                o.payment_method, o.payment_status, o.created_at,
                u.full_name as customer_name, u.phone as customer_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
        """

        params = []
        if status:
            query += " WHERE o.status = %s"
            params.append(status)

        query += " ORDER BY o.created_at DESC"

        orders = Database.execute_query(query, tuple(params) if params else None, fetch_all=True)

        return jsonify({'orders': orders}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@order_bp.route('/update-status/<int:order_id>', methods=['PUT'])
def update_order_status(order_id):
    """Update order status (admin only)"""
    try:
        # Check if admin is logged in
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required'}), 403

        data = request.json
        new_status = data.get('status')

        if not new_status:
            return jsonify({'error': 'Status is required'}), 400

        # Validate status
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400

        # Update order
        update_query = "UPDATE orders SET status = %s"
        params = [new_status]

        if new_status == 'delivered':
            update_query += ", delivered_at = NOW()"

        update_query += " WHERE id = %s"
        params.append(order_id)

        Database.execute_query(update_query, tuple(params))

        return jsonify({'message': 'Order status updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

