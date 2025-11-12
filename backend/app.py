from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATABASE = 'food_ordering.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db()
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category_id INTEGER,
                image_url TEXT,
                available INTEGER DEFAULT 1,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                customer_phone TEXT,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                menu_item_id INTEGER,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
            )
        ''')
        
        # Insert sample data
        cursor.execute("INSERT INTO categories (name, description) VALUES (?, ?)", 
                      ('Burgers', 'Delicious burgers'))
        cursor.execute("INSERT INTO categories (name, description) VALUES (?, ?)", 
                      ('Pizza', 'Fresh pizzas'))
        cursor.execute("INSERT INTO categories (name, description) VALUES (?, ?)", 
                      ('Drinks', 'Refreshing beverages'))
        cursor.execute("INSERT INTO categories (name, description) VALUES (?, ?)", 
                      ('Desserts', 'Sweet treats'))
        
        # Sample menu items
        menu_items = [
            ('Classic Burger', 'Beef patty with lettuce, tomato, and cheese', 8.99, 1, '🍔'),
            ('Cheese Burger', 'Double cheese with beef patty', 10.99, 1, '🍔'),
            ('Veggie Burger', 'Plant-based patty with fresh vegetables', 9.99, 1, '🍔'),
            ('Margherita Pizza', 'Classic tomato and mozzarella', 12.99, 2, '🍕'),
            ('Pepperoni Pizza', 'Loaded with pepperoni', 14.99, 2, '🍕'),
            ('Hawaiian Pizza', 'Ham and pineapple', 13.99, 2, '🍕'),
            ('Coca Cola', 'Chilled soft drink', 2.99, 3, '🥤'),
            ('Orange Juice', 'Fresh squeezed', 3.99, 3, '🧃'),
            ('Water', 'Mineral water', 1.99, 3, '💧'),
            ('Chocolate Cake', 'Rich chocolate dessert', 5.99, 4, '🍰'),
            ('Ice Cream', 'Vanilla ice cream', 4.99, 4, '🍦'),
        ]
        
        cursor.executemany(
            "INSERT INTO menu_items (name, description, price, category_id, image_url) VALUES (?, ?, ?, ?, ?)",
            menu_items
        )
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!")

# API Routes
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    categories = conn.execute('SELECT * FROM categories').fetchall()
    conn.close()
    return jsonify([dict(cat) for cat in categories])

@app.route('/api/menu', methods=['GET'])
def get_menu():
    category_id = request.args.get('category_id')
    conn = get_db()
    
    if category_id:
        items = conn.execute(
            'SELECT * FROM menu_items WHERE category_id = ? AND available = 1',
            (category_id,)
        ).fetchall()
    else:
        items = conn.execute('SELECT * FROM menu_items WHERE available = 1').fetchall()
    
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route('/api/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    conn = get_db()
    item = conn.execute('SELECT * FROM menu_items WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    
    if item:
        return jsonify(dict(item))
    return jsonify({'error': 'Item not found'}), 404

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    # Create order
    cursor.execute(
        'INSERT INTO orders (customer_name, customer_phone, total_amount, status) VALUES (?, ?, ?, ?)',
        (data['customer_name'], data.get('customer_phone', ''), data['total_amount'], 'pending')
    )
    order_id = cursor.lastrowid
    
    # Add order items
    for item in data['items']:
        cursor.execute(
            'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
            (order_id, item['menu_item_id'], item['quantity'], item['price'])
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({'order_id': order_id, 'message': 'Order created successfully'}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db()
    orders = conn.execute(
        'SELECT * FROM orders ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    return jsonify([dict(order) for order in orders])

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()

    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404

    items = conn.execute('''
        SELECT oi.*, mi.name, mi.description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
    ''', (order_id,)).fetchall()

    conn.close()

    return jsonify({
        'order': dict(order),
        'items': [dict(item) for item in items]
    })

if __name__ == '__main__':
    init_db()
    app.run(host='127.0.0.1', port=5000, debug=False)

