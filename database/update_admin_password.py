"""
Update admin password to use werkzeug hash format
"""

import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'food_ordering_system',
    'port': 3306
}

def update_admin_password():
    """Update admin password to werkzeug hash format"""
    try:
        # Connect to database
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Generate new hash for 'admin123'
        new_password_hash = generate_password_hash('admin123')
        
        print("Updating admin password...")
        print(f"New hash: {new_password_hash[:50]}...")
        
        # Update admin password
        cursor.execute(
            "UPDATE admins SET password = %s WHERE email = 'admin@foodorder.com'",
            (new_password_hash,)
        )
        
        connection.commit()
        
        print("✓ Admin password updated successfully!")
        print("\nYou can now login with:")
        print("  Email: admin@foodorder.com")
        print("  Password: admin123")
        
        cursor.close()
        connection.close()
        
    except Error as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    update_admin_password()

