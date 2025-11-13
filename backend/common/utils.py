"""
Utility functions for the Food Ordering System backend
"""


def dict_to_sql_insert(table, data):
    """
    Convert dictionary to SQL INSERT statement
    
    Args:
        table: Table name
        data: Dictionary of column:value pairs
        
    Returns:
        Tuple of (query, values)
        
    Example:
        >>> dict_to_sql_insert('users', {'name': 'John', 'email': 'john@example.com'})
        ('INSERT INTO users (name, email) VALUES (%s, %s)', ('John', 'john@example.com'))
    """
    columns = ', '.join(data.keys())
    placeholders = ', '.join(['%s'] * len(data))
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
    values = tuple(data.values())
    return query, values


def dict_to_sql_update(table, data, where_clause, where_params):
    """
    Convert dictionary to SQL UPDATE statement
    
    Args:
        table: Table name
        data: Dictionary of column:value pairs to update
        where_clause: WHERE clause (e.g., "id = %s")
        where_params: Parameters for WHERE clause (tuple)
        
    Returns:
        Tuple of (query, values)
        
    Example:
        >>> dict_to_sql_update('users', {'name': 'Jane'}, 'id = %s', (1,))
        ('UPDATE users SET name = %s WHERE id = %s', ('Jane', 1))
    """
    set_clause = ', '.join([f"{k} = %s" for k in data.keys()])
    query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
    values = tuple(data.values()) + tuple(where_params)
    return query, values


def validate_email(email):
    """
    Validate email format
    
    Args:
        email: Email string to validate
        
    Returns:
        Boolean indicating if email is valid
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """
    Validate phone number format
    
    Args:
        phone: Phone number string to validate
        
    Returns:
        Boolean indicating if phone is valid
    """
    import re
    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it's 10-15 digits
    return cleaned.isdigit() and 10 <= len(cleaned) <= 15


def sanitize_filename(filename):
    """
    Sanitize filename for safe storage
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    import re
    import os
    # Get file extension
    name, ext = os.path.splitext(filename)
    # Remove special characters
    name = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    return f"{name}{ext}"


def generate_order_number():
    """
    Generate unique order number
    
    Returns:
        Order number string (e.g., 'ORD-20240113-001')
    """
    from datetime import datetime
    import random
    date_str = datetime.now().strftime('%Y%m%d')
    random_num = random.randint(100, 999)
    return f"ORD-{date_str}-{random_num}"


def generate_invoice_number():
    """
    Generate unique invoice number
    
    Returns:
        Invoice number string (e.g., 'INV-20240113-001')
    """
    from datetime import datetime
    import random
    date_str = datetime.now().strftime('%Y%m%d')
    random_num = random.randint(100, 999)
    return f"INV-{date_str}-{random_num}"


def calculate_order_total(items, tax_rate=0.10, delivery_fee=5.00):
    """
    Calculate order total with tax and delivery fee
    
    Args:
        items: List of items with 'price' and 'quantity'
        tax_rate: Tax rate (default 10%)
        delivery_fee: Delivery fee (default $5.00)
        
    Returns:
        Dictionary with subtotal, tax, delivery_fee, and total
    """
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    tax = subtotal * tax_rate
    total = subtotal + tax + delivery_fee
    
    return {
        'subtotal': round(subtotal, 2),
        'tax': round(tax, 2),
        'delivery_fee': round(delivery_fee, 2),
        'total': round(total, 2)
    }

