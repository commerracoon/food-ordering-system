"""
Modules package for Food Ordering System
"""

from .user_module import user_bp
from .admin_module import admin_bp
from .order_module import order_bp
from .invoice_module import invoice_bp
from .feedback_module import feedback_bp

__all__ = [
    'user_bp',
    'admin_bp',
    'order_bp',
    'invoice_bp',
    'feedback_bp'
]

