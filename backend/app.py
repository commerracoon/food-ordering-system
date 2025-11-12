"""
Food Ordering System - Main Application
Modular Flask application with MySQL database
"""

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from datetime import timedelta
import os
import sys

# Import configuration
from config import config, Config

# Import database
from database import Database

# Import all modules
from modules.user_module import user_bp
from modules.admin_module import admin_bp
from modules.order_module import order_bp
from modules.invoice_module import invoice_bp
from modules.feedback_module import feedback_bp


def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Enable CORS
    CORS(app, supports_credentials=True)

    # Configure session
    app.secret_key = app.config['SECRET_KEY']
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    # Initialize database connection pool
    Database.initialize_pool(app.config)

    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(invoice_bp)
    app.register_blueprint(feedback_bp)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            db_status = Database.test_connection()
            return jsonify({
                'status': 'healthy' if db_status else 'unhealthy',
                'database': 'connected' if db_status else 'disconnected',
                'message': 'Food Ordering System API is running'
            }), 200 if db_status else 503
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 503

    # Session check endpoint
    @app.route('/api/session', methods=['GET'])
    def check_session():
        """Check current session"""
        if 'user_id' in session:
            return jsonify({
                'logged_in': True,
                'user_id': session['user_id'],
                'user_type': session.get('user_type'),
                'username': session.get('username')
            }), 200
        else:
            return jsonify({'logged_in': False}), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app


# Create application instance
app = create_app(os.getenv('FLASK_ENV', 'development'))



if __name__ == '__main__':
    print("\n" + "="*60)
    print("🍔 Food Ordering System - Starting Server")
    print("="*60)
    print("\n📊 Database: MySQL (XAMPP)")
    print("🌐 Server: http://127.0.0.1:5000")
    print("📝 API Docs: http://127.0.0.1:5000/api/health")
    print("\n💡 Make sure:")
    print("   1. XAMPP MySQL is running")
    print("   2. Database is set up (run: python database/setup_database.py)")
    print("   3. Frontend is configured to use this API")
    print("\n" + "="*60 + "\n")

    app.run(host='127.0.0.1', port=5000, debug=True)

