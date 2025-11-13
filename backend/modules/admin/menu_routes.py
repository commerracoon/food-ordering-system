"""
Admin Menu Management Routes - CRUD for Categories and Menu Items
"""

from flask import Blueprint, request, jsonify, session
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from common import Database, dict_to_sql_insert, dict_to_sql_update
from common.middleware import admin_required

menu_admin_bp = Blueprint('menu_admin', __name__, url_prefix='/api/admin/menu')


# ============================================
# CATEGORY CRUD
# ============================================

@menu_admin_bp.route('/categories', methods=['GET'])
@admin_required
def get_all_categories():
    """Get all categories (including inactive)"""
    try:
        categories = Database.execute_query(
            """SELECT id, name, description, image_url, is_active, display_order, 
                      created_at, updated_at,
                      (SELECT COUNT(*) FROM menu_items WHERE category_id = categories.id) as item_count
               FROM categories 
               ORDER BY display_order, name""",
            fetch_all=True
        )
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/categories/<int:category_id>', methods=['GET'])
@admin_required
def get_category(category_id):
    """Get single category"""
    try:
        category = Database.execute_query(
            """SELECT id, name, description, image_url, is_active, display_order, 
                      created_at, updated_at
               FROM categories WHERE id = %s""",
            (category_id,),
            fetch_one=True
        )
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        return jsonify({'category': category}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/categories', methods=['POST'])
@admin_required
def create_category():
    """Create new category"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Prepare category data
        category_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'image_url': data.get('image_url', ''),
            'is_active': data.get('is_active', True),
            'display_order': data.get('display_order', 0)
        }
        
        # Insert category
        query, values = dict_to_sql_insert('categories', category_data)
        category_id = Database.execute_query(query, values)
        
        return jsonify({
            'message': 'Category created successfully',
            'category_id': category_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    """Update category"""
    try:
        data = request.json
        
        # Check if category exists
        category = Database.execute_query(
            "SELECT id FROM categories WHERE id = %s",
            (category_id,),
            fetch_one=True
        )
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Prepare update data
        allowed_fields = ['name', 'description', 'image_url', 'is_active', 'display_order']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update category
        query, values = dict_to_sql_update('categories', update_data, 'id = %s', (category_id,))
        Database.execute_query(query, values)
        
        return jsonify({'message': 'Category updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Delete category (only if no menu items)"""
    try:
        # Check if category has menu items
        item_count = Database.execute_query(
            "SELECT COUNT(*) as count FROM menu_items WHERE category_id = %s",
            (category_id,),
            fetch_one=True
        )
        
        if item_count and item_count['count'] > 0:
            return jsonify({
                'error': f'Cannot delete category with {item_count["count"]} menu items. Delete or move items first.'
            }), 400
        
        # Delete category
        Database.execute_query(
            "DELETE FROM categories WHERE id = %s",
            (category_id,)
        )
        
        return jsonify({'message': 'Category deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# MENU ITEMS CRUD
# ============================================

@menu_admin_bp.route('/items', methods=['GET'])
@admin_required
def get_all_menu_items():
    """Get all menu items with category info"""
    try:
        # Get filter parameters
        category_id = request.args.get('category_id', type=int)
        is_available = request.args.get('is_available', type=str)

        # Build query
        query = """
            SELECT
                m.id, m.category_id, m.name, m.description, m.price,
                m.image_url, m.is_available, m.is_featured, m.preparation_time,
                m.created_at, m.updated_at,
                c.name as category_name,
                COALESCE(r.average_rating, 0) as average_rating,
                COALESCE(r.total_ratings, 0) as total_ratings
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            LEFT JOIN menu_item_ratings r ON m.id = r.menu_item_id
            WHERE 1=1
        """
        params = []

        if category_id:
            query += " AND m.category_id = %s"
            params.append(category_id)

        if is_available is not None:
            query += " AND m.is_available = %s"
            params.append(is_available == 'true')

        query += " ORDER BY c.display_order, m.name"

        menu_items = Database.execute_query(query, tuple(params) if params else None, fetch_all=True)

        return jsonify({'menu_items': menu_items}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/items/<int:item_id>', methods=['GET'])
@admin_required
def get_menu_item(item_id):
    """Get single menu item"""
    try:
        item = Database.execute_query(
            """SELECT
                m.id, m.category_id, m.name, m.description, m.price,
                m.image_url, m.is_available, m.is_featured, m.preparation_time,
                m.created_at, m.updated_at,
                c.name as category_name
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            WHERE m.id = %s""",
            (item_id,),
            fetch_one=True
        )

        if not item:
            return jsonify({'error': 'Menu item not found'}), 404

        return jsonify({'menu_item': item}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/items', methods=['POST'])
@admin_required
def create_menu_item():
    """Create new menu item"""
    try:
        data = request.json

        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Item name is required'}), 400
        if not data.get('category_id'):
            return jsonify({'error': 'Category is required'}), 400
        if not data.get('price'):
            return jsonify({'error': 'Price is required'}), 400

        # Validate category exists
        category = Database.execute_query(
            "SELECT id FROM categories WHERE id = %s",
            (data['category_id'],),
            fetch_one=True
        )

        if not category:
            return jsonify({'error': 'Invalid category'}), 400

        # Prepare menu item data
        item_data = {
            'category_id': data['category_id'],
            'name': data['name'],
            'description': data.get('description', ''),
            'price': data['price'],
            'image_url': data.get('image_url', ''),
            'is_available': data.get('is_available', True),
            'is_featured': data.get('is_featured', False),
            'preparation_time': data.get('preparation_time', 15)
        }

        # Insert menu item
        query, values = dict_to_sql_insert('menu_items', item_data)
        item_id = Database.execute_query(query, values)

        # Initialize rating record
        Database.execute_query(
            "INSERT INTO menu_item_ratings (menu_item_id, total_ratings, average_rating) VALUES (%s, 0, 0.00)",
            (item_id,)
        )

        return jsonify({
            'message': 'Menu item created successfully',
            'item_id': item_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/items/<int:item_id>', methods=['PUT'])
@admin_required
def update_menu_item(item_id):
    """Update menu item"""
    try:
        data = request.json

        # Check if item exists
        item = Database.execute_query(
            "SELECT id FROM menu_items WHERE id = %s",
            (item_id,),
            fetch_one=True
        )

        if not item:
            return jsonify({'error': 'Menu item not found'}), 404

        # If category_id is being updated, validate it exists
        if 'category_id' in data:
            category = Database.execute_query(
                "SELECT id FROM categories WHERE id = %s",
                (data['category_id'],),
                fetch_one=True
            )
            if not category:
                return jsonify({'error': 'Invalid category'}), 400

        # Prepare update data
        allowed_fields = ['category_id', 'name', 'description', 'price', 'image_url',
                         'is_available', 'is_featured', 'preparation_time']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        # Update menu item
        query, values = dict_to_sql_update('menu_items', update_data, 'id = %s', (item_id,))
        Database.execute_query(query, values)

        return jsonify({'message': 'Menu item updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@menu_admin_bp.route('/items/<int:item_id>', methods=['DELETE'])
@admin_required
def delete_menu_item(item_id):
    """Delete menu item"""
    try:
        # Check if item exists
        item = Database.execute_query(
            "SELECT id FROM menu_items WHERE id = %s",
            (item_id,),
            fetch_one=True
        )

        if not item:
            return jsonify({'error': 'Menu item not found'}), 404

        # Delete menu item (ratings will be deleted by CASCADE)
        Database.execute_query(
            "DELETE FROM menu_items WHERE id = %s",
            (item_id,)
        )

        return jsonify({'message': 'Menu item deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


