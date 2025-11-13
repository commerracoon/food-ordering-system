# Food Ordering System - Backend

## 🏗️ Architecture

This is a modular Flask application with MySQL database (XAMPP).

### Project Structure
```
backend/
├── app.py                      # Main application entry point
├── config.py                   # Configuration settings
├── database.py                 # Database connection manager
├── requirements.txt            # Python dependencies
├── API_DOCUMENTATION.md        # Complete API documentation
├── modules/                    # Application modules
│   ├── __init__.py
│   ├── user_module.py         # User authentication & profile
│   ├── admin_module.py        # Admin management
│   ├── order_module.py        # Menu & order management
│   ├── invoice_module.py      # Invoice generation & printing
│   └── feedback_module.py     # Ratings & reviews
└── database/
    ├── schema.sql             # MySQL database schema
    ├── setup_database.py      # Database setup script
    └── README.md              # Database documentation
```

## 📋 Prerequisites

1. **XAMPP** - MySQL server running
2. **Python 3.8+**
3. **pip** - Python package manager

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database

Make sure XAMPP MySQL is running, then:

```bash
cd database
python setup_database.py
```

Or manually via phpMyAdmin:
1. Open http://localhost/phpmyadmin
2. Create database: `food_ordering_system`
3. Import `database/schema.sql`

### 3. Configure Environment (Optional)

Create a `.env` file in the backend directory:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=food_ordering_system
MYSQL_PORT=3306
```

### 4. Run the Server

```bash
python app.py
```

Server will start at: http://127.0.0.1:5000

## 📚 Modules

### 1. User Module
- User registration and authentication
- Profile management
- Session-based login

### 2. Admin Module
- Admin registration (super admin only)
- Admin authentication
- Role-based access control (super_admin, admin, manager)

### 3. Order Module
- Browse menu with categories
- View menu items with ratings
- Place orders
- View order history
- Admin: Manage all orders and update status

### 4. Invoice Module
- Auto-generate invoices for orders
- View invoice list
- Get detailed invoice information
- Print invoice (HTML template)

### 5. Feedback Module
- Submit feedback after order delivery
- Rate menu items (1-5 stars)
- View feedback and ratings
- Admin: Approve/reject/delete feedback

## 🔐 Authentication

The system uses **session-based authentication**:
- Login creates a session cookie
- Session expires after 7 days
- Logout clears the session

### User Types
- **user** - Regular customers
- **admin** - Admin users with roles (super_admin, admin, manager)

## 🗄️ Database

### Tables
- `users` - Customer accounts
- `admins` - Admin accounts
- `categories` - Food categories
- `menu_items` - Menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `invoices` - Generated invoices
- `feedback` - Customer feedback
- `menu_item_ratings` - Aggregated ratings (auto-updated)
- `user_sessions` - Active sessions
- `activity_logs` - System activity logs

### Default Admin Account
```
Email: admin@foodorder.com
Password: admin123
```

**⚠️ Change this password in production!**

## 🧪 Testing the API

### Using curl

```bash
# Health check
curl http://127.0.0.1:5000/api/health

# Register user
curl -X POST http://127.0.0.1:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","full_name":"Test User"}'

# Login (by email)
curl -X POST http://127.0.0.1:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Login (by username)
curl -X POST http://127.0.0.1:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' \
  -c cookies.txt

# Get menu (with session)
curl http://127.0.0.1:5000/api/order/menu -b cookies.txt
```

### Using Postman
1. Import the API endpoints from `API_DOCUMENTATION.md`
2. Enable "Send cookies" in Postman settings
3. Test each endpoint

## 📖 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🔧 Configuration

Edit `config.py` to customize:
- Database connection
- Session settings
- Tax rate and delivery fee
- File upload settings
- Email configuration (future use)

## 🐛 Troubleshooting

### Database Connection Error
- Make sure XAMPP MySQL is running
- Check database credentials in `config.py`
- Verify database exists: `food_ordering_system`

### Import Errors
- Install all dependencies: `pip install -r requirements.txt`
- Make sure you're in the correct directory

### Session Not Working
- Check if cookies are enabled
- Verify `SECRET_KEY` is set in config
- Clear browser cookies and try again

## 📝 Development

### Adding a New Module

1. Create `backend/modules/new_module.py`
2. Define Blueprint:
```python
from flask import Blueprint
new_bp = Blueprint('new', __name__, url_prefix='/api/new')
```
3. Add routes to the blueprint
4. Register in `app.py`:
```python
from modules.new_module import new_bp
app.register_blueprint(new_bp)
```

### Database Queries

Use the Database class for all queries:
```python
from database import Database

# Fetch one
user = Database.execute_query(
    "SELECT * FROM users WHERE id = %s",
    (user_id,),
    fetch_one=True
)

# Fetch all
users = Database.execute_query(
    "SELECT * FROM users",
    fetch_all=True
)

# Insert/Update
Database.execute_query(
    "UPDATE users SET full_name = %s WHERE id = %s",
    (new_name, user_id)
)
```

## 🚀 Deployment

For production deployment:
1. Set `FLASK_ENV=production`
2. Change all secret keys
3. Use a production WSGI server (gunicorn, uWSGI)
4. Enable HTTPS
5. Set up proper MySQL user with limited permissions
6. Configure firewall rules

## 📄 License

This project is for educational purposes.

