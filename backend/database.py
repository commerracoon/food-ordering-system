"""
Database connection and utilities for MySQL
"""

import mysql.connector
from mysql.connector import Error, pooling
from contextlib import contextmanager
from config import Config

class Database:
    """Database connection manager"""
    
    _connection_pool = None
    
    @classmethod
    def initialize_pool(cls, config=None):
        """Initialize connection pool"""
        if cls._connection_pool is None:
            try:
                # Handle both dict and object config
                if config and isinstance(config, dict):
                    host = config.get('MYSQL_HOST', Config.MYSQL_HOST)
                    user = config.get('MYSQL_USER', Config.MYSQL_USER)
                    password = config.get('MYSQL_PASSWORD', Config.MYSQL_PASSWORD)
                    database = config.get('MYSQL_DB', Config.MYSQL_DB)
                    port = config.get('MYSQL_PORT', Config.MYSQL_PORT)
                elif config:
                    host = config.MYSQL_HOST
                    user = config.MYSQL_USER
                    password = config.MYSQL_PASSWORD
                    database = config.MYSQL_DB
                    port = config.MYSQL_PORT
                else:
                    host = Config.MYSQL_HOST
                    user = Config.MYSQL_USER
                    password = Config.MYSQL_PASSWORD
                    database = Config.MYSQL_DB
                    port = Config.MYSQL_PORT

                pool_config = {
                    'pool_name': 'food_order_pool',
                    'pool_size': 5,
                    'pool_reset_session': True,
                    'host': host,
                    'user': user,
                    'password': password,
                    'database': database,
                    'port': port,
                    'autocommit': False
                }

                cls._connection_pool = pooling.MySQLConnectionPool(**pool_config)
                print("✓ Database connection pool initialized")

            except Error as e:
                print(f"✗ Error creating connection pool: {e}")
                raise
    
    @classmethod
    def get_connection(cls):
        """Get connection from pool"""
        if cls._connection_pool is None:
            cls.initialize_pool()
        
        try:
            return cls._connection_pool.get_connection()
        except Error as e:
            print(f"✗ Error getting connection from pool: {e}")
            raise
    
    @classmethod
    @contextmanager
    def get_cursor(cls, dictionary=True, buffered=True):
        """
        Context manager for database cursor
        Usage:
            with Database.get_cursor() as cursor:
                cursor.execute("SELECT * FROM users")
                results = cursor.fetchall()
        """
        connection = cls.get_connection()
        cursor = connection.cursor(dictionary=dictionary, buffered=buffered)
        
        try:
            yield cursor
            connection.commit()
        except Error as e:
            connection.rollback()
            print(f"✗ Database error: {e}")
            raise
        finally:
            cursor.close()
            connection.close()
    
    @classmethod
    def execute_query(cls, query, params=None, fetch_one=False, fetch_all=False):
        """
        Execute a query and return results
        
        Args:
            query: SQL query string
            params: Query parameters (tuple or dict)
            fetch_one: Return single row
            fetch_all: Return all rows
            
        Returns:
            Query results or lastrowid for INSERT
        """
        with cls.get_cursor() as cursor:
            cursor.execute(query, params or ())
            
            if fetch_one:
                return cursor.fetchone()
            elif fetch_all:
                return cursor.fetchall()
            else:
                return cursor.lastrowid
    
    @classmethod
    def execute_many(cls, query, params_list):
        """
        Execute query with multiple parameter sets
        
        Args:
            query: SQL query string
            params_list: List of parameter tuples
            
        Returns:
            Number of affected rows
        """
        with cls.get_cursor() as cursor:
            cursor.executemany(query, params_list)
            return cursor.rowcount
    
    @classmethod
    def test_connection(cls):
        """Test database connection"""
        try:
            with cls.get_cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                if result:
                    print("✓ Database connection test successful")
                    return True
        except Error as e:
            print(f"✗ Database connection test failed: {e}")
            return False


# Helper functions for common operations

def dict_to_sql_insert(table, data):
    """
    Convert dictionary to SQL INSERT statement
    
    Args:
        table: Table name
        data: Dictionary of column:value pairs
        
    Returns:
        Tuple of (query, values)
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
        where_params: Parameters for WHERE clause
        
    Returns:
        Tuple of (query, values)
    """
    set_clause = ', '.join([f"{k} = %s" for k in data.keys()])
    query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
    values = tuple(data.values()) + tuple(where_params)
    return query, values

