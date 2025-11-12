# 🍔 Food Ordering System

A complete food ordering application with user authentication, menu management, order processing, invoicing, and customer feedback system.

## 🎯 Features

### User Module
- ✅ User registration and login
- ✅ Profile management (edit profile, upload image)
- ✅ Session-based authentication
- ✅ Secure password hashing

### Admin Module
- ✅ Admin registration (super admin only)
- ✅ Admin login with role-based access
- ✅ Admin profile management
- ✅ Role hierarchy (super_admin, admin, manager)

### Order Food Module
- ✅ Browse menu by categories
- ✅ View menu items with ratings and reviews
- ✅ Add items to cart
- ✅ Place orders with special instructions
- ✅ View order history
- ✅ Track order status
- ✅ Admin: Manage all orders and update status

### Invoice Module
- ✅ Auto-generate invoices for orders
- ✅ View invoice list
- ✅ Single invoice details
- ✅ Print invoice (HTML template with print button)
- ✅ Tax calculation and breakdown

### Feedback Module
- ✅ Submit feedback after order delivery
- ✅ Rate menu items (1-5 stars)
- ✅ Write reviews
- ✅ View feedback and ratings in menu list
- ✅ Admin approval system for feedback
- ✅ Aggregated ratings with automatic updates

## 🏗️ Technologies

### Frontend
- **Electron** - Desktop application framework
- **HTML5/CSS3** - Structure and styling
- **JavaScript** - Client-side logic
- **Tailwind CSS** - Utility-first CSS framework
- **SweetAlert2** - Beautiful alerts and notifications
- **Animate.css** - CSS animations
- **AOS** - Animate on scroll
- **Chart.js** - Data visualization

### Backend
- **Python 3.8+** - Programming language
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Werkzeug** - Password hashing and security
- **MySQL** - Database (via XAMPP)
- **mysql-connector-python** - MySQL driver

### Database
- **MySQL 8.0+** - Relational database
- **XAMPP** - Local development environment

## 📋 Prerequisites

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **Python 3.8+** - [Download](https://www.python.org/)
3. **XAMPP** - [Download](https://www.apachefriends.org/)
4. **npm** or **yarn** - Package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd food-ordering-system
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Setup Database

**Option A: Using Python Script (Recommended)**
```bash
# Make sure XAMPP MySQL is running
cd database
python setup_database.py
cd ..
```

**Option B: Using phpMyAdmin**
1. Start XAMPP and open http://localhost/phpmyadmin
2. Create a new database: `food_ordering_system`
3. Import `database/schema.sql`

### 5. Start the Application

**Terminal 1 - Start Backend Server:**
```bash
cd backend
python app.py
```

**Terminal 2 - Start Electron App:**
```bash
npm start
```

## 📁 Project Structure

```
food-ordering-system/
├── backend/                    # Backend API
│   ├── modules/               # Application modules
│   │   ├── user_module.py    # User authentication
│   │   ├── admin_module.py   # Admin management
│   │   ├── order_module.py   # Orders & menu
│   │   ├── invoice_module.py # Invoice generation
│   │   └── feedback_module.py # Ratings & reviews
│   ├── app.py                # Main Flask application
│   ├── config.py             # Configuration
│   ├── database.py           # Database manager
│   ├── requirements.txt      # Python dependencies
│   ├── README.md             # Backend documentation
│   └── API_DOCUMENTATION.md  # API reference
├── database/                  # Database files
│   ├── schema.sql            # MySQL schema
│   ├── setup_database.py     # Setup script
│   └── README.md             # Database docs
├── index.html                # Main HTML file
├── app.js                    # Main JavaScript
├── main.js                   # Electron main process
├── styles.css                # Styling
├── package.json              # Node dependencies
└── README.md                 # This file
```

## 🔐 Default Credentials

### Admin Account
```
Email: admin@foodorder.com
Password: admin123
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

## 📖 Documentation

- **Backend API:** See [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **Backend Setup:** See [backend/README.md](backend/README.md)
- **Database:** See [database/README.md](database/README.md)

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://127.0.0.1:5000/api/health

# Get menu
curl http://127.0.0.1:5000/api/order/menu

# Get categories
curl http://127.0.0.1:5000/api/order/categories
```

### Test Frontend
1. Start the application with `npm start`
2. Register a new user
3. Browse menu and add items to cart
4. Place an order
5. Submit feedback after order is delivered

## 🔧 Configuration

### Backend Configuration
Edit `backend/config.py`:
- Database connection settings
- Tax rate and delivery fee
- Session configuration
- File upload settings

### Frontend Configuration
Edit `main.js`:
- Window size and settings
- Development tools

## 🐛 Troubleshooting

### Database Connection Error
- Ensure XAMPP MySQL is running
- Check database credentials in `backend/config.py`
- Verify database `food_ordering_system` exists

### Backend Import Errors
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Not Loading
- Check if backend is running on port 5000
- Clear browser cache
- Check console for errors

### Session/Login Issues
- Clear cookies
- Check if `SECRET_KEY` is set in config
- Verify session settings

## 📝 Next Steps

- [ ] Restructure frontend into separate files for easier maintenance
- [ ] Add payment gateway integration
- [ ] Email notifications
- [ ] Real-time order tracking
- [ ] Mobile responsive design
- [ ] Admin dashboard with analytics

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ using Flask, Electron, and MySQL**
