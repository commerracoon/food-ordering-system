"""
Admin Module Routes - Handle admin registration, login, logout, and profile management
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from common import Database, dict_to_sql_insert, dict_to_sql_update
from common.middleware import login_required, admin_required, super_admin_required, create_token

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ============================================
# ADMIN REGISTRATION
# ============================================

@admin_bp.route('/register', methods=['POST'])
@super_admin_required
def register():
    """Register a new admin (requires super_admin permission)"""
    try:
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
        
        # Hash password using pbkdf2:sha256 for compatibility
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
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
    """Admin login - supports login by username or email"""
    try:
        data = request.json

        # Validate required fields
        login_identifier = data.get('email') or data.get('username')
        if not login_identifier or not data.get('password'):
            return jsonify({'error': 'Username/Email and password are required'}), 400

        # Get admin from database - check both email and username
        admin = Database.execute_query(
            """SELECT id, username, email, password, full_name, phone, role,
                      profile_image, is_active
               FROM admins WHERE email = %s OR username = %s""",
            (login_identifier, login_identifier),
            fetch_one=True
        )

        if not admin:
            return jsonify({'error': 'Invalid username/email or password'}), 401

        # Check if admin is active
        if not admin['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 403

        # Verify password
        if not check_password_hash(admin['password'], data['password']):
            return jsonify({'error': 'Invalid username/email or password'}), 401

        # Update last login
        Database.execute_query(
            "UPDATE admins SET last_login = NOW() WHERE id = %s",
            (admin['id'],)
        )

        # Create session (for backward compatibility)
        session['user_id'] = admin['id']
        session['user_type'] = 'admin'
        session['admin_role'] = admin['role']
        session['username'] = admin['username']
        session.permanent = True

        # Create JWT token
        token = create_token(
            user_id=admin['id'],
            user_type='admin',
            username=admin['username'],
            admin_role=admin['role']
        )

        # Remove password from response
        admin_data = {k: v for k, v in admin.items() if k != 'password'}

        return jsonify({
            'message': 'Login successful',
            'admin': admin_data,
            'token': token  # Return JWT token
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
@admin_required
def get_profile():
    """Get admin profile"""
    try:
        # Get admin_id from JWT token or session
        admin_id = getattr(request, 'user_id', None) or session.get('user_id')

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
@admin_required
def update_profile():
    """Update admin profile"""
    try:
        # Get admin_id from JWT token or session
        admin_id = getattr(request, 'user_id', None) or session.get('user_id')
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


# ============================================
# ADMIN: MANAGE USERS
# ============================================

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users (admin only)"""
    try:
        users = Database.execute_query(
            """SELECT id, username, email, phone, 
                      is_active, created_at, updated_at, profile_image
               FROM users
               ORDER BY created_at DESC""",
            fetch_all=True
        )
        
        return jsonify({'users': users}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user_admin():
    """Create a new customer user (admin only)"""
    try:
        # Handle both JSON and FormData
        if request.is_json:
            data = request.json
        else:
            data = request.form.to_dict()
        
        # Validate required fields
        if not data.get('username'):
            return jsonify({'error': 'Username is required'}), 400
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
        
        # Check if email already exists
        existing_email = Database.execute_query(
            "SELECT id FROM users WHERE email = %s",
            (data['email'],),
            fetch_one=True
        )
        
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 409
        
        # Check if username already exists
        existing_username = Database.execute_query(
            "SELECT id FROM users WHERE username = %s",
            (data['username'],),
            fetch_one=True
        )
        
        if existing_username:
            return jsonify({'error': 'Username already exists'}), 409
        
        # Hash password using the same method as user registration
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash(data['password'])
        
        # Handle profile image upload
        profile_image = None
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename:
                import uuid
                from werkzeug.utils import secure_filename
                # Generate unique filename
                filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
                upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                profile_image = f"uploads/{filename}"
        
        # Parse is_active
        is_active = data.get('is_active', True)
        if isinstance(is_active, str):
            is_active = is_active.lower() in ('true', '1', 'yes', 'on')
        
        user_data = {
            'username': data['username'],
            'email': data['email'],
            'password': hashed_password,
            'phone': data.get('phone', ''),
            'is_active': is_active
        }
        
        if profile_image:
            user_data['profile_image'] = profile_image
        
        query, values = dict_to_sql_insert('users', user_data)
        user_id = Database.execute_query(query, values)
        
        # Fetch the created user to return full details
        user = Database.execute_query(
            """SELECT id, username, email, phone, is_active, 
                      created_at, profile_image
               FROM users WHERE id = %s""",
            (user_id,),
            fetch_one=True
        )
        
        return jsonify({
            'message': 'Customer created successfully',
            'user': user,
            'user_id': user_id
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get user details"""
    try:
        user = Database.execute_query(
            """SELECT id, username, email, phone, is_active, created_at, 
                      updated_at, profile_image
               FROM users WHERE id = %s""",
            (user_id,),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user details"""
    try:
        print(f"[DEBUG] Update user {user_id} - request.is_json: {request.is_json}, files: {list(request.files.keys())}", flush=True)
        
        # Handle both JSON and FormData
        if request.is_json:
            data = request.json
        else:
            data = request.form.to_dict()
        
        print(f"[DEBUG] Update data: {data}", flush=True)
        
        # Check if user exists
        user = Database.execute_query(
            "SELECT id, profile_image FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prepare update data
        allowed_fields = ['phone', 'is_active']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        print(f"[DEBUG] Filtered update_data: {update_data}", flush=True)
        
        # Handle profile image upload
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename:
                import uuid
                from werkzeug.utils import secure_filename
                # Delete old image if exists
                if user['profile_image']:
                    old_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), user['profile_image'])
                    try:
                        if os.path.exists(old_path):
                            os.remove(old_path)
                    except Exception:
                        pass  # Ignore deletion errors
                
                # Save new image
                filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
                upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                update_data['profile_image'] = f"uploads/{filename}"
                print(f"[DEBUG] Saved image to: {update_data['profile_image']}", flush=True)
        
        # Parse is_active if present
        if 'is_active' in update_data:
            is_active = update_data['is_active']
            if isinstance(is_active, str):
                is_active = is_active.lower() in ('true', '1', 'yes', 'on')
            else:
                is_active = bool(int(is_active)) if isinstance(is_active, (int, str)) else bool(is_active)
            update_data['is_active'] = is_active
            print(f"[DEBUG] Parsed is_active: {is_active} (type: {type(is_active)})", flush=True)
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update user
        query, values = dict_to_sql_update('users', update_data, 'id = %s', (user_id,))
        print(f"[DEBUG] SQL Query: {query}, Values: {values}", flush=True)
        Database.execute_query(query, values)
        
        # Return updated user
        updated_user = Database.execute_query(
            """SELECT id, username, email, phone, is_active, created_at, profile_image
               FROM users WHERE id = %s""",
            (user_id,),
            fetch_one=True
        )
        
        print(f"[DEBUG] Updated user: {updated_user}", flush=True)
        return jsonify({'message': 'User updated successfully', 'user': updated_user}), 200
    
    except Exception as e:
        print(f"[ERROR] Update user error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user"""
    try:
        # Check if user exists
        user = Database.execute_query(
            "SELECT id FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user
        Database.execute_query("DELETE FROM users WHERE id = %s", (user_id,))
        
        return jsonify({'message': 'User deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/change-password', methods=['POST'])
@admin_required
def change_user_password(user_id):
    """Change/set user password (admin only) - supports both password reset and initial setup"""
    try:
        data = request.json
        
        # Check if user exists
        user = Database.execute_query(
            "SELECT id, password FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate new password
        new_password = data.get('password') or data.get('new_password')
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # If old_password is provided, verify it (password change scenario)
        # If not provided, skip verification (initial password setup scenario)
        if data.get('old_password'):
            from werkzeug.security import check_password_hash
            if not check_password_hash(user['password'], data['old_password']):
                return jsonify({'error': 'Old password is incorrect'}), 401
        
        # Hash new password
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash(new_password)
        
        # Update password
        Database.execute_query(
            "UPDATE users SET password = %s WHERE id = %s",
            (hashed_password, user_id)
        )
        
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN: MANAGE FEEDBACK
# ============================================

# ============================================
# FEEDBACK MANAGEMENT
# ============================================

@admin_bp.route('/feedback', methods=['POST'])
@admin_required
def create_feedback_admin():
    """Create feedback for an order (admin only)"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('order_id') or not data.get('rating'):
            return jsonify({'error': 'Order ID and rating are required'}), 400
        
        order_id = data['order_id']
        rating = int(data['rating'])
        
        # Validate rating
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Check if order exists
        order = Database.execute_query(
            "SELECT id, user_id, status FROM orders WHERE id = %s",
            (order_id,),
            fetch_one=True
        )
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if order is delivered
        if order['status'] != 'delivered':
            return jsonify({'error': f'Feedback can only be added for delivered orders. Current status: {order["status"]}'}), 400
        
        # Check if feedback already exists for this order
        existing_feedback = Database.execute_query(
            "SELECT id FROM feedback WHERE order_id = %s",
            (order_id,),
            fetch_one=True
        )
        
        if existing_feedback:
            return jsonify({'error': 'Feedback already exists for this order'}), 409
        
        # Create feedback
        feedback_data = {
            'user_id': order['user_id'],
            'order_id': order_id,
            'rating': rating,
            'comment': data.get('comment', ''),
            'is_approved': True  # Admin-created feedback is automatically approved
        }
        
        query, values = dict_to_sql_insert('feedback', feedback_data)
        feedback_id = Database.execute_query(query, values)
        
        return jsonify({
            'message': 'Feedback created successfully',
            'feedback_id': feedback_id
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/feedback/list', methods=['GET'])
@admin_required
def get_feedback_list():
    """Get all feedback"""
    try:
        feedback_list = Database.execute_query(
            """SELECT
                f.id, f.rating, f.comment, f.created_at,
                u.username, u.email,
                o.id as order_id
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            JOIN orders o ON f.order_id = o.id
            ORDER BY f.created_at DESC""",
            fetch_all=True
        )

        return jsonify({'feedback': feedback_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/feedback/<int:feedback_id>', methods=['GET'])
@admin_required
def get_feedback(feedback_id):
    """Get feedback details"""
    try:
        feedback = Database.execute_query(
            """SELECT
                f.id, f.rating, f.comment, f.created_at,
                u.email,
                o.id as order_id
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            JOIN orders o ON f.order_id = o.id
            WHERE f.id = %s""",
            (feedback_id,),
            fetch_one=True
        )
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        return jsonify({'feedback': feedback}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/feedback/<int:feedback_id>', methods=['PUT'])
@admin_required
def update_feedback(feedback_id):
    """Update feedback"""
    try:
        data = request.json
        
        # Check if feedback exists
        feedback = Database.execute_query(
            "SELECT id FROM feedback WHERE id = %s",
            (feedback_id,),
            fetch_one=True
        )
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Prepare update data
        allowed_fields = ['rating', 'comment']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update feedback
        query, values = dict_to_sql_update('feedback', update_data, 'id = %s', (feedback_id,))
        Database.execute_query(query, values)
        
        return jsonify({'message': 'Feedback updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/feedback/<int:feedback_id>', methods=['DELETE'])
@admin_required
def delete_feedback_admin(feedback_id):
    """Delete feedback"""
    try:
        # Check if feedback exists
        feedback = Database.execute_query(
            "SELECT id FROM feedback WHERE id = %s",
            (feedback_id,),
            fetch_one=True
        )
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Delete feedback
        Database.execute_query("DELETE FROM feedback WHERE id = %s", (feedback_id,))
        
        return jsonify({'message': 'Feedback deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

