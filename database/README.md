# Database Setup Guide

## Prerequisites
- XAMPP installed with MySQL running
- MySQL running on localhost (default port 3306)

## Setup Instructions

### 1. Start XAMPP
- Open XAMPP Control Panel
- Start Apache and MySQL services

### 2. Create Database

**Option A: Using phpMyAdmin**
1. Open browser and go to `http://localhost/phpmyadmin`
2. Click on "SQL" tab
3. Copy and paste the entire content of `schema.sql`
4. Click "Go" to execute

**Option B: Using MySQL Command Line**
```bash
# Navigate to XAMPP MySQL bin directory
cd C:\xampp\mysql\bin

# Login to MySQL
mysql -u root -p

# Run the schema file
source C:\xampp\htdocs\food-ordering-system\database\schema.sql
```

**Option C: Using Python Script**
```bash
# From project root
python database/setup_database.py
```

## Database Structure

### Tables Created

#### User Module
- `users` - Customer accounts
- `user_sessions` - Session management

#### Admin Module
- `admins` - Admin accounts with roles

#### Menu Module
- `categories` - Food categories
- `menu_items` - Menu items
- `menu_item_ratings` - Aggregated ratings

#### Order Module
- `orders` - Customer orders
- `order_items` - Order line items

#### Invoice Module
- `invoices` - Order invoices

#### Feedback Module
- `feedback` - Customer reviews and ratings

#### System
- `activity_logs` - Audit trail

## Default Credentials

### Admin Account
- **Username:** admin
- **Email:** admin@foodorder.com
- **Password:** admin123

## Database Configuration

Update your backend configuration:

**File:** `backend/config.py`
```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = ''  # Default XAMPP has no password
MYSQL_DB = 'food_ordering_system'
```

## Sample Data

The schema includes:
- 1 default admin account
- 6 food categories
- 12 sample menu items
- Initialized rating records

## Views

- `order_details_view` - Orders with customer information
- `menu_with_ratings_view` - Menu items with ratings

## Triggers

- `after_feedback_insert` - Auto-update ratings
- `before_order_insert` - Auto-generate order numbers
- `before_invoice_insert` - Auto-generate invoice numbers

## Verification

After setup, verify the database:

```sql
USE food_ordering_system;

-- Check tables
SHOW TABLES;

-- Check admin account
SELECT * FROM admins;

-- Check menu items
SELECT * FROM menu_items;

-- Check categories
SELECT * FROM categories;
```

## Troubleshooting

**Error: Access denied**
- Check MySQL is running in XAMPP
- Default XAMPP root user has no password
- Use `root` as username and leave password empty

**Error: Database exists**
- The script will not drop existing database
- Manually drop if needed: `DROP DATABASE food_ordering_system;`

**Error: Table already exists**
- Script uses `IF NOT EXISTS` - safe to re-run
- Or drop tables manually first

## Backup

To backup your database:
```bash
mysqldump -u root food_ordering_system > backup.sql
```

To restore:
```bash
mysql -u root food_ordering_system < backup.sql
```

