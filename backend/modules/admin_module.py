"""
Admin Module - Handle admin registration, login, logout, and profile management
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import Database, dict_to_sql_insert, dict_to_sql_update

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ============================================
# ADMIN REGISTRATION
# ============================================

@admin_bp.route('/register', methods=['POST'])
def register():
    """Register a new admin (requires super_admin permission)"""
    try:
        # Check if requester is super admin
        if session.get('user_type') != 'admin' or session.get('admin_role') != 'super_admin':
            return jsonify({'error': 'Unauthorized. Super admin access required'}), 403
        
        data = request.json
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if admin already exists
        existing_admin = Database.execute_query(
            "SELECT id FROM admins WHERE email = %s OR username = %s",
            (data['email'], data['username']),
            fetch_one=True
        )
        
        if existing_admin:
            return jsonify({'error': 'Admin with this email or username already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Prepare admin data
        admin_data = {
            'username': data['username'],
            'email': data['email'],
            'password': hashed_password,
            'full_name': data['full_name'],
            'phone': data.get('phone', ''),
            'role': data.get('role', 'admin')  # Default role is 'admin'
        }
        
        # Insert admin
        query, values = dict_to_sql_insert('admins', admin_data)
        admin_id = Database.execute_query(query, values)
        
        return jsonify({
            'message': 'Admin registered successfully',
            'admin_id': admin_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN LOGIN
# ============================================

@admin_bp.route('/login', methods=['POST'])
def login():
    """Admin login"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Get admin from database
        admin = Database.execute_query(
            """SELECT id, username, email, password, full_name, phone, role,
                      profile_image, is_active 
               FROM admins WHERE email = %s""",
            (data['email'],),
            fetch_one=True
        )
        
        if not admin:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if admin is active
        if not admin['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not check_password_hash(admin['password'], data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        Database.execute_query(
            "UPDATE admins SET last_login = NOW() WHERE id = %s",
            (admin['id'],)
        )
        
        # Create session
        session['user_id'] = admin['id']
        session['user_type'] = 'admin'
        session['admin_role'] = admin['role']
        session['username'] = admin['username']
        session.permanent = True
        
        # Remove password from response
        admin_data = {k: v for k, v in admin.items() if k != 'password'}
        
        return jsonify({
            'message': 'Login successful',
            'admin': admin_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN LOGOUT
# ============================================

@admin_bp.route('/logout', methods=['POST'])
def logout():
    """Admin logout"""
    try:
        session.clear()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN PROFILE
# ============================================

@admin_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get admin profile"""
    try:
        # Check if admin is logged in
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        
        admin_id = session['user_id']
        
        # Get admin data
        admin = Database.execute_query(
            """SELECT id, username, email, full_name, phone, role,
                      profile_image, created_at, updated_at, last_login 
               FROM admins WHERE id = %s""",
            (admin_id,),
            fetch_one=True
        )
        
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404
        
        return jsonify({'admin': admin}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update admin profile"""
    try:
        # Check if admin is logged in
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        
        admin_id = session['user_id']
        data = request.json
        
        # Prepare update data (only allowed fields)
        allowed_fields = ['full_name', 'phone', 'profile_image']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update admin
        query, values = dict_to_sql_update('admins', update_data, 'id = %s', (admin_id,))
        Database.execute_query(query, values)
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

