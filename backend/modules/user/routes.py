"""
User Module Routes - Handle user registration, login, logout, and profile management
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from common import Database, dict_to_sql_insert, dict_to_sql_update
from common.middleware import login_required, create_token

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
        
        # Hash password using pbkdf2:sha256 for compatibility
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
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
    """User login - supports login by username or email"""
    try:
        data = request.json

        # Validate required fields
        login_identifier = data.get('email') or data.get('username')
        if not login_identifier or not data.get('password'):
            return jsonify({'error': 'Username/Email and password are required'}), 400

        # Get user from database - check both email and username
        user = Database.execute_query(
            """SELECT id, username, email, password, full_name, phone, address,
                      profile_image, is_active
               FROM users WHERE email = %s OR username = %s""",
            (login_identifier, login_identifier),
            fetch_one=True
        )

        if not user:
            return jsonify({'error': 'Invalid username/email or password'}), 401

        # Check if user is active
        if not user['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 403

        # Verify password
        if not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid username/email or password'}), 401

        # Create session (for backward compatibility)
        session['user_id'] = user['id']
        session['user_type'] = 'user'
        session['username'] = user['username']
        session.permanent = True

        # Create JWT token
        token = create_token(
            user_id=user['id'],
            user_type='user',
            username=user['username']
        )

        # Remove password from response
        user_data = {k: v for k, v in user.items() if k != 'password'}

        return jsonify({
            'message': 'Login successful',
            'user': user_data,
            'token': token  # Return JWT token
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
@login_required
def get_profile():
    """Get user profile"""
    try:
        # Get user_id from JWT token or session
        user_id = getattr(request, 'user_id', None) or session.get('user_id')
        user_type = getattr(request, 'user_type', None) or session.get('user_type')

        # Check if user is logged in
        if not user_id or user_type != 'user':
            return jsonify({'error': 'Unauthorized'}), 401

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
@login_required
def update_profile():
    """Update user profile"""
    try:
        # Get user_id from JWT token or session
        user_id = getattr(request, 'user_id', None) or session.get('user_id')
        user_type = getattr(request, 'user_type', None) or session.get('user_type')

        # Check if user is logged in
        if not user_id or user_type != 'user':
            return jsonify({'error': 'Unauthorized'}), 401

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


@user_bp.route('/profile/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password"""
    try:
        # Get user_id from JWT token or session
        user_id = getattr(request, 'user_id', None) or session.get('user_id')
        user_type = getattr(request, 'user_type', None) or session.get('user_type')

        # Check if user is logged in
        if not user_id or user_type != 'user':
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.json

        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400

        # Get current user password
        user = Database.execute_query(
            "SELECT password FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify current password
        if not check_password_hash(user['password'], data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Validate new password length
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        # Hash new password
        new_hashed_password = generate_password_hash(data['new_password'], method='pbkdf2:sha256')

        # Update password
        Database.execute_query(
            "UPDATE users SET password = %s WHERE id = %s",
            (new_hashed_password, user_id)
        )

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
