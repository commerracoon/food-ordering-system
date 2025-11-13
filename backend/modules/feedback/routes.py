"""
Feedback Module - Handle customer feedback and ratings
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from common import Database, dict_to_sql_insert
from config import Config

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')


# ============================================
# SUBMIT FEEDBACK
# ============================================

@feedback_bp.route('/submit', methods=['POST'])
def submit_feedback():
    """Submit feedback for an order"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Please login to submit feedback'}), 401
        
        user_id = session['user_id']
        data = request.json
        
        # Validate required fields
        if not data.get('order_id') or not data.get('rating'):
            return jsonify({'error': 'Order ID and rating are required'}), 400
        
        order_id = data['order_id']
        rating = int(data['rating'])
        
        # Validate rating
        if rating < Config.MIN_RATING or rating > Config.MAX_RATING:
            return jsonify({'error': f'Rating must be between {Config.MIN_RATING} and {Config.MAX_RATING}'}), 400
        
        # Check if order exists and belongs to user
        order = Database.execute_query(
            "SELECT id, user_id, status FROM orders WHERE id = %s",
            (order_id,),
            fetch_one=True
        )
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if order is delivered
        if order['status'] != 'delivered':
            return jsonify({'error': 'Can only give feedback for delivered orders'}), 400
        
        # Check if feedback already exists
        existing_feedback = Database.execute_query(
            "SELECT id FROM feedback WHERE user_id = %s AND order_id = %s",
            (user_id, order_id),
            fetch_one=True
        )
        
        if existing_feedback:
            return jsonify({'error': 'Feedback already submitted for this order'}), 409
        
        # Create feedback
        feedback_data = {
            'user_id': user_id,
            'order_id': order_id,
            'menu_item_id': data.get('menu_item_id'),  # Optional
            'rating': rating,
            'comment': data.get('comment', ''),
            'is_approved': False  # Admin needs to approve
        }
        
        query, values = dict_to_sql_insert('feedback', feedback_data)
        feedback_id = Database.execute_query(query, values)
        
        return jsonify({
            'message': 'Feedback submitted successfully. It will be visible after admin approval.',
            'feedback_id': feedback_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# GET FEEDBACK FOR MENU ITEM
# ============================================

@feedback_bp.route('/menu-item/<int:menu_item_id>', methods=['GET'])
def get_menu_item_feedback(menu_item_id):
    """Get approved feedback for a menu item"""
    try:
        # Get feedback
        feedback_list = Database.execute_query(
            """SELECT 
                f.id, f.rating, f.comment, f.created_at,
                u.full_name as customer_name
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE f.menu_item_id = %s AND f.is_approved = TRUE
            ORDER BY f.created_at DESC
            LIMIT 50""",
            (menu_item_id,),
            fetch_all=True
        )
        
        # Get rating summary
        rating_summary = Database.execute_query(
            """SELECT 
                average_rating, total_ratings,
                rating_1_count, rating_2_count, rating_3_count,
                rating_4_count, rating_5_count
            FROM menu_item_ratings
            WHERE menu_item_id = %s""",
            (menu_item_id,),
            fetch_one=True
        )
        
        return jsonify({
            'feedback': feedback_list,
            'rating_summary': rating_summary or {
                'average_rating': 0,
                'total_ratings': 0,
                'rating_1_count': 0,
                'rating_2_count': 0,
                'rating_3_count': 0,
                'rating_4_count': 0,
                'rating_5_count': 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# GET MY FEEDBACK
# ============================================

@feedback_bp.route('/my-feedback', methods=['GET'])
def get_my_feedback():
    """Get current user's feedback"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_id = session['user_id']
        
        feedback_list = Database.execute_query(
            """SELECT 
                f.id, f.rating, f.comment, f.is_approved, f.created_at,
                o.order_number,
                m.name as menu_item_name
            FROM feedback f
            JOIN orders o ON f.order_id = o.id
            LEFT JOIN menu_items m ON f.menu_item_id = m.id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC""",
            (user_id,),
            fetch_all=True
        )
        
        return jsonify({'feedback': feedback_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN: GET ALL FEEDBACK
# ============================================

@feedback_bp.route('/all', methods=['GET'])
def get_all_feedback():
    """Get all feedback (admin only)"""
    try:
        # Check if admin is logged in
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required'}), 403

        approved_only = request.args.get('approved', 'false').lower() == 'true'

        query = """
            SELECT
                f.id, f.rating, f.comment, f.is_approved, f.created_at,
                u.full_name as customer_name, u.email as customer_email,
                o.order_number,
                m.name as menu_item_name
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            JOIN orders o ON f.order_id = o.id
            LEFT JOIN menu_items m ON f.menu_item_id = m.id
        """

        if approved_only:
            query += " WHERE f.is_approved = TRUE"

        query += " ORDER BY f.created_at DESC"

        feedback_list = Database.execute_query(query, fetch_all=True)

        return jsonify({'feedback': feedback_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@feedback_bp.route('/approve/<int:feedback_id>', methods=['PUT'])
def approve_feedback(feedback_id):
    """Approve or reject feedback (admin only)"""
    try:
        # Check if admin is logged in
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required'}), 403

        data = request.json
        is_approved = data.get('is_approved', True)

        # Update feedback
        Database.execute_query(
            "UPDATE feedback SET is_approved = %s WHERE id = %s",
            (is_approved, feedback_id)
        )

        return jsonify({
            'message': f'Feedback {"approved" if is_approved else "rejected"} successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@feedback_bp.route('/delete/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    """Delete feedback (admin only)"""
    try:
        # Check if admin is logged in
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required'}), 403

        Database.execute_query(
            "DELETE FROM feedback WHERE id = %s",
            (feedback_id,)
        )

        return jsonify({'message': 'Feedback deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# GET ORDERS ELIGIBLE FOR FEEDBACK
# ============================================

@feedback_bp.route('/eligible-orders', methods=['GET'])
def get_eligible_orders():
    """Get orders that can receive feedback"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Unauthorized'}), 401

        user_id = session['user_id']

        # Get delivered orders without feedback
        orders = Database.execute_query(
            """SELECT
                o.id, o.order_number, o.total_amount, o.delivered_at
            FROM orders o
            LEFT JOIN feedback f ON o.id = f.order_id AND f.user_id = %s
            WHERE o.user_id = %s
                AND o.status = 'delivered'
                AND f.id IS NULL
            ORDER BY o.delivered_at DESC""",
            (user_id, user_id),
            fetch_all=True
        )

        return jsonify({'orders': orders}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

