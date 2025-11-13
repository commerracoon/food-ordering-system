"""
Middleware and decorators for authentication and authorization
"""

from functools import wraps
from flask import session, jsonify, request, current_app
import jwt
from datetime import datetime, timedelta


def get_token_from_request():
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None


def decode_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login_required(f):
    """
    Decorator to require login for a route (supports both JWT and session)

    Usage:
        @app.route('/protected')
        @login_required
        def protected_route():
            return jsonify({'message': 'You are logged in'})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try JWT token first
        token = get_token_from_request()
        if token:
            payload = decode_token(token)
            if payload:
                # Store user info in request context for the route to use
                request.user_id = payload.get('user_id')
                request.user_type = payload.get('user_type')
                request.username = payload.get('username')
                request.admin_role = payload.get('admin_role')
                return f(*args, **kwargs)

        # Fallback to session-based auth
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """
    Decorator to require admin login for a route (supports both JWT and session)

    Usage:
        @app.route('/admin/dashboard')
        @admin_required
        def admin_dashboard():
            return jsonify({'message': 'Admin access granted'})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try JWT token first
        token = get_token_from_request()
        if token:
            payload = decode_token(token)
            if payload:
                if payload.get('user_type') != 'admin':
                    return jsonify({'error': 'Admin access required'}), 403
                # Store user info in request context
                request.user_id = payload.get('user_id')
                request.user_type = payload.get('user_type')
                request.username = payload.get('username')
                request.admin_role = payload.get('admin_role')
                return f(*args, **kwargs)
            else:
                return jsonify({'error': 'Invalid or expired token'}), 401

        # Fallback to session-based auth
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def super_admin_required(f):
    """
    Decorator to require super admin access for a route (supports both JWT and session)

    Usage:
        @app.route('/admin/create')
        @super_admin_required
        def create_admin():
            return jsonify({'message': 'Super admin access granted'})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        if session.get('user_type') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        if session.get('admin_role') != 'super_admin':
            return jsonify({'error': 'Super admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def validate_request_data(required_fields):
    """
    Decorator to validate required fields in request JSON
    
    Args:
        required_fields: List of required field names
        
    Usage:
        @app.route('/register', methods=['POST'])
        @validate_request_data(['username', 'email', 'password'])
        def register():
            # All required fields are guaranteed to be present
            data = request.json
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            
            if not request.json:
                return jsonify({'error': 'Request body must be JSON'}), 400
            
            missing_fields = [field for field in required_fields if not request.json.get(field)]
            
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def allowed_file(filename, allowed_extensions=None):
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions (default: {'png', 'jpg', 'jpeg', 'gif'})
        
    Returns:
        Boolean indicating if file is allowed
    """
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def create_token(user_id, user_type, username, admin_role=None):
    """
    Create JWT token for user

    Args:
        user_id: User ID
        user_type: 'user' or 'admin'
        username: Username
        admin_role: Admin role (optional, for admin users)

    Returns:
        JWT token string
    """
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'username': username,
        'admin_role': admin_role,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }

    from flask import current_app
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token


def get_current_user():
    """
    Get current logged-in user information from JWT token or session

    Returns:
        Dictionary with user_id, user_type, and username (or None if not logged in)
    """
    # Try JWT token first
    token = get_token_from_request()
    if token:
        payload = decode_token(token)
        if payload:
            return {
                'user_id': payload.get('user_id'),
                'user_type': payload.get('user_type'),
                'username': payload.get('username'),
                'admin_role': payload.get('admin_role')
            }

    # Fallback to session
    if 'user_id' not in session:
        return None

    return {
        'user_id': session.get('user_id'),
        'user_type': session.get('user_type'),
        'username': session.get('username'),
        'admin_role': session.get('admin_role')  # Only for admin users
    }


def is_logged_in():
    """
    Check if user is logged in
    
    Returns:
        Boolean indicating if user is logged in
    """
    return 'user_id' in session


def is_admin():
    """
    Check if current user is an admin
    
    Returns:
        Boolean indicating if user is an admin
    """
    return session.get('user_type') == 'admin'

