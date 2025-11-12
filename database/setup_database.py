"""
Database Setup Script for Food Ordering System
Automatically creates database and tables in MySQL (XAMPP)
"""

import mysql.connector
from mysql.connector import Error
import os

# Database configuration for XAMPP
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Default XAMPP has no password
    'port': 3306
}

DB_NAME = 'food_ordering_system'

def create_database_connection():
    """Create connection to MySQL server"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✓ Successfully connected to MySQL server")
            return connection
    except Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        return None

def execute_sql_file(connection, filename):
    """Execute SQL file with support for triggers and multi-statement blocks"""
    try:
        cursor = connection.cursor()

        # Read SQL file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        sql_file = os.path.join(script_dir, filename)

        with open(sql_file, 'r', encoding='utf-8') as file:
            sql_script = file.read()

        # Remove comments
        lines = sql_script.split('\n')
        cleaned_lines = []
        for line in lines:
            # Remove inline comments
            if '--' in line:
                line = line[:line.index('--')]
            line = line.strip()
            if line:
                cleaned_lines.append(line)

        sql_script = ' '.join(cleaned_lines)

        # Split statements intelligently (handle triggers)
        statements = []
        current_statement = []
        in_trigger = False

        for line in sql_script.split(';'):
            line = line.strip()
            if not line:
                continue

            current_statement.append(line)

            # Check if we're entering a trigger
            if 'CREATE TRIGGER' in line.upper():
                in_trigger = True

            # Check if we're exiting a trigger
            if in_trigger and line.upper().endswith('END'):
                in_trigger = False
                statements.append(';'.join(current_statement))
                current_statement = []
            elif not in_trigger:
                statements.append(';'.join(current_statement))
                current_statement = []

        # Execute each statement
        for statement in statements:
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                except Error as e:
                    # Only show actual errors, not warnings
                    if e.errno and e.errno != 1050:  # 1050 = table already exists
                        print(f"Warning: {e}")

        connection.commit()
        print(f"✓ Successfully executed {filename}")
        cursor.close()
        return True

    except Error as e:
        print(f"✗ Error executing SQL file: {e}")
        return False
    except FileNotFoundError:
        print(f"✗ SQL file not found: {filename}")
        return False

def setup_database():
    """Main setup function"""
    print("\n" + "="*50)
    print("Food Ordering System - Database Setup")
    print("="*50 + "\n")
    
    # Connect to MySQL
    connection = create_database_connection()
    if not connection:
        print("\n✗ Setup failed: Could not connect to MySQL")
        print("\nTroubleshooting:")
        print("1. Make sure XAMPP is running")
        print("2. Check if MySQL service is started")
        print("3. Verify MySQL is running on port 3306")
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create database
        print(f"\n→ Creating database '{DB_NAME}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"✓ Database '{DB_NAME}' created/verified")
        
        # Use database
        cursor.execute(f"USE {DB_NAME}")
        
        cursor.close()
        
        # Execute schema file
        print("\n→ Creating tables and inserting data...")
        if execute_sql_file(connection, 'schema.sql'):
            print("\n" + "="*50)
            print("✓ Database setup completed successfully!")
            print("="*50)
            
            # Display summary
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"\n📊 Created {len(tables)} tables:")
            for table in tables:
                print(f"   - {table[0]}")
            
            print("\n🔐 Default Admin Credentials:")
            print("   Username: admin")
            print("   Email: admin@foodorder.com")
            print("   Password: admin123")
            
            print("\n📝 Next Steps:")
            print("   1. Update backend/config.py with database settings")
            print("   2. Run: python backend/app.py")
            print("   3. Access: http://localhost:5000")
            
            cursor.close()
            return True
        else:
            print("\n✗ Setup failed during table creation")
            return False
            
    except Error as e:
        print(f"\n✗ Error during setup: {e}")
        return False
    
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("\n→ Database connection closed")

if __name__ == "__main__":
    try:
        success = setup_database()
        if success:
            print("\n✓ You can now start the application!")
        else:
            print("\n✗ Setup incomplete. Please check errors above.")
    except KeyboardInterrupt:
        print("\n\n✗ Setup cancelled by user")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")

