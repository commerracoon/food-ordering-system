"""
User Module - Handle user registration, login, logout, and profile management
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import Database, dict_to_sql_insert, dict_to_sql_update

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


# ============================================
# REGISTRATION
# ============================================

@user_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        existing_user = Database.execute_query(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (data['email'], data['username']),
            fetch_one=True
        )
        
        if existing_user:
            return jsonify({'error': 'User with this email or username already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Prepare user data
        user_data = {
            'username': data['username'],
            'email': data['email'],
            'password': hashed_password,
            'full_name': data['full_name'],
            'phone': data.get('phone', ''),
            'address': data.get('address', '')
        }
        
        # Insert user
        query, values = dict_to_sql_insert('users', user_data)
        user_id = Database.execute_query(query, values)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# LOGIN
# ============================================

@user_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Get user from database
        user = Database.execute_query(
            """SELECT id, username, email, password, full_name, phone, address, 
                      profile_image, is_active 
               FROM users WHERE email = %s""",
            (data['email'],),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create session
        session['user_id'] = user['id']
        session['user_type'] = 'user'
        session['username'] = user['username']
        session.permanent = True
        
        # Remove password from response
        user_data = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# LOGOUT
# ============================================

@user_bp.route('/logout', methods=['POST'])
def logout():
    """User logout"""
    try:
        session.clear()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# PROFILE
# ============================================

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_id = session['user_id']
        
        # Get user data
        user = Database.execute_query(
            """SELECT id, username, email, full_name, phone, address, 
                      profile_image, created_at, updated_at 
               FROM users WHERE id = %s""",
            (user_id,),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        # Check if user is logged in
        if 'user_id' not in session or session.get('user_type') != 'user':
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_id = session['user_id']
        data = request.json
        
        # Prepare update data (only allowed fields)
        allowed_fields = ['full_name', 'phone', 'address', 'profile_image']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update user
        query, values = dict_to_sql_update('users', update_data, 'id = %s', (user_id,))
        Database.execute_query(query, values)
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

