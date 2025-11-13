"""
Modules package for Food Ordering System
"""

from .user import user_bp
from .admin import admin_bp
from .order import order_bp
from .invoice import invoice_bp
from .feedback import feedback_bp

__all__ = [
    'user_bp',
    'admin_bp',
    'order_bp',
    'invoice_bp',
    'feedback_bp'
]

