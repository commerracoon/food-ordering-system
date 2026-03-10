# 🍔 Food Ordering System

A complete desktop food ordering application built with **Electron** and **Python Flask**, featuring user authentication, menu management, order processing, invoicing, and customer feedback system.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Electron](https://img.shields.io/badge/electron-28.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Table of Contents
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [Implemented Modules](#-implemented-modules)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Future Recommendations](#-future-recommendations)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ Dual authentication system (Session-based + JWT tokens)
- ✅ User registration and login
- ✅ Admin registration (super admin only)
- ✅ Role-based access control (super_admin, admin, manager)
- ✅ Secure password hashing with Werkzeug
- ✅ Auto-clear cart on logout/app close

### 👤 User Management
- ✅ User profile management (edit profile, upload image)
- ✅ User dashboard with order statistics
- ✅ Account activation/deactivation
- ✅ Profile image upload support

### 🍕 Menu & Ordering
- ✅ Browse menu by categories
- ✅ View menu items with ratings and reviews
- ✅ Real-time cart management with localStorage
- ✅ Add/remove items from cart
- ✅ Place orders with special instructions
- ✅ Multiple payment methods (Cash, Card, Online)
- ✅ Order tracking with status updates
- ✅ View order history

### 👨‍💼 Admin Features
- ✅ Admin dashboard with statistics
- ✅ Menu management (Categories & Items)
- ✅ Order management and status updates
- ✅ Feedback approval system
- ✅ User management capabilities
- ✅ Real-time order monitoring

### 🧾 Invoice System
- ✅ Auto-generate invoices for orders
- ✅ Invoice number generation with prefix
- ✅ Tax calculation and breakdown
- ✅ View invoice list
- ✅ Detailed invoice view
- ✅ Print-ready invoice templates
- ✅ PDF-ready HTML format

### ⭐ Feedback & Ratings
- ✅ Submit feedback after order delivery
- ✅ Rate menu items (1-5 stars)
- ✅ Write detailed reviews
- ✅ View aggregated ratings in menu
- ✅ Admin approval workflow
- ✅ Automatic rating calculations
- ✅ Feedback moderation system

## 🛠 Technology Stack

### Backend
- **Python 3.8+** - Core backend language
- **Flask 3.0.0** - Web framework
- **MySQL 8.0+** - Database (via XAMPP)
- **PyJWT 2.8.0** - JWT token authentication
- **Werkzeug 3.0.1** - Password hashing & security
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **mysql-connector-python 8.2.0** - MySQL driver

### Frontend
- **Electron 28.0.0** - Desktop application framework
- **HTML5/CSS3** - Markup and styling
- **JavaScript (ES6+)** - Client-side logic
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **SweetAlert2 11.26.3** - Beautiful alerts and modals
- **Chart.js 4.5.1** - Data visualization
- **Font Awesome 6.4.0** - Icon library
- **Animate.css 4.1.1** - CSS animations
- **AOS 2.3.4** - Animate on scroll library
- **Axios 1.6.2** - HTTP client

### Development Tools
- **Node.js & npm** - Package management
- **XAMPP** - Local MySQL server
- **Git** - Version control
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
food-ordering-system/
├── backend/                           # Backend API (Python Flask)
│   ├── common/                        # Shared utilities
│   │   ├── __init__.py
│   │   ├── config.py                  # Configuration classes
│   │   ├── database.py                # Database connection pool
│   │   └── middleware.py              # Auth decorators & JWT
│   ├── modules/                       # Application modules
│   │   ├── user/                      # User module
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # User endpoints
│   │   ├── admin/                     # Admin module
│   │   │   ├── __init__.py
│   │   │   ├── routes.py              # Admin endpoints
│   │   │   └── menu_routes.py         # Menu management
│   │   ├── order/                     # Order module
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # Order endpoints
│   │   ├── invoice/                   # Invoice module
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # Invoice endpoints
│   │   └── feedback/                  # Feedback module
│   │       ├── __init__.py
│   │       └── routes.py              # Feedback endpoints
│   ├── app.py                         # Main Flask application
│   ├── requirements.txt               # Python dependencies
│   ├── README.md                      # Backend documentation
│   └── API_DOCUMENTATION.md           # Complete API reference
│
├── frontend/                          # Frontend (Electron + HTML/CSS/JS)
│   ├── common/                        # Shared resources
│   │   ├── css/                       # Global styles
│   │   └── js/                        # Utility scripts
│   │       ├── config.js              # API endpoints & constants
│   │       ├── api.js                 # HTTP request wrappers
│   │       ├── auth.js                # Authentication utilities
│   │       ├── utils.js               # Helper functions
│   │       └── navbar.js              # Navigation component
│   ├── modules/                       # Feature modules
│   │   ├── auth/                      # Authentication
│   │   │   ├── login.html             # Login page
│   │   │   └── register.html          # Registration page
│   │   ├── user/                      # User features
│   │   │   ├── dashboard.html         # User dashboard
│   │   │   └── profile.html           # User profile
│   │   ├── admin/                     # Admin features
│   │   │   ├── dashboard.html         # Admin dashboard
│   │   │   ├── menu-management.html   # Menu CRUD
│   │   │   └── menu-management.js     # Menu logic
│   │   └── order/                     # Ordering system
│   │       ├── menu.html              # Browse & order
│   │       ├── order.js               # Order logic
│   │       └── order-styles.css       # Order styles
│   └── index.html                     # Landing page
│
├── database/                          # Database files
│   ├── schema.sql                     # MySQL schema
│   ├── setup_database.py              # Database setup script
│   └── README.md                      # Database documentation
│
├── uploads/                           # User uploaded files
│   ├── profiles/                      # Profile images
│   └── menu/                          # Menu item images
│
├── main.js                            # Electron main process
├── package.json                       # Node.js dependencies
├── tailwind.config.js                 # Tailwind configuration
└── README.md                          # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **Python 3.8+** - [Download](https://www.python.org/)
3. **XAMPP** (for MySQL) - [Download](https://www.apachefriends.org/)
4. **npm** or **yarn** - Package manager (comes with Node.js)
5. **Git** - Version control (optional)

## 🚀 Installation

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

### 5. Configure Environment (Optional)

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=food_ordering_system
```

### 6. Start the Application

**Option A: Using Electron (Recommended)**
```bash
npm start
```
This will automatically start both the backend server and the Electron app.

**Option B: Manual Start**

Terminal 1 - Start Backend Server:
```bash
cd backend
python app.py
```

Terminal 2 - Start Electron App:
```bash
npm start
```

### 7. Development Mode

To run in development mode with DevTools:
```bash
npm run dev
```

## 📖 Usage

### Default Admin Account

```
Email: admin@foodorder.com
Password: admin123
```

**⚠️ Important: Change this password after first login!**

### User Flow

1. **Registration**: New users can register from the login page
2. **Browse Menu**: View available food items by category
3. **Add to Cart**: Select items and add them to cart
4. **Checkout**: Fill in delivery details and place order
5. **Track Order**: Monitor order status in real-time
6. **Feedback**: Rate and review items after delivery

### Admin Flow

1. **Login**: Use admin credentials to access admin panel
2. **Dashboard**: View statistics and pending orders
3. **Menu Management**: Add/edit/delete categories and menu items
4. **Order Management**: Update order status and manage deliveries
5. **Feedback Management**: Approve or reject customer feedback

## 📊 Development Progress

### ✅ Completed (MVP Features)

#### Authentication & Core System
- ✅ Dual authentication (JWT + Session-based)
- ✅ User registration and login with validation
- ✅ Admin account management
- ✅ Role-based access control
- ✅ Secure password hashing
- ✅ Auto-logout on app close

#### User Ordering System
- ✅ Menu browsing by categories
- ✅ Real-time cart management with localStorage
- ✅ Add/remove items from cart
- ✅ Order placement with delivery address
- ✅ Order history view
- ✅ Order details with items list (JOIN order_items table)
- ✅ Multiple payment methods (Cash, Card, Online)

#### Invoice & Receipt System
- ✅ Invoice generation and storage
- ✅ Professional invoice template (invoice-style format)
- ✅ Display invoice in new browser tab
- ✅ PDF download functionality (html2pdf library)
- ✅ Proper subtotal calculation from items
- ✅ Order summary with totals

#### Admin Features
- ✅ Admin dashboard basics
- ✅ Menu category management
- ✅ Menu item CRUD operations
- ✅ View all orders
- ✅ Order items display (with JOIN queries)

#### Feedback System
- ✅ Feedback submission endpoints (backend)
- ✅ Feedback approval workflow
- ✅ Rating system (1-5 stars)
- ✅ JWT token support for feedback routes

#### Bug Fixes (Current Session)
- ✅ Fixed syntax error in order-history.js (malformed addEventListener)
- ✅ Fixed unauthorized API error (added JWT support to feedback routes)
- ✅ Fixed empty items field (added JOIN with order_items table)
- ✅ Fixed print dialog issue (switched from window.print() to new window approach)
- ✅ Fixed SQL column errors (removed non-existent tax_amount, delivery_fee from orders queries)
- ✅ Fixed subtotal calculation (calculate from items instead of order totals)

---

### 🔄 In Progress / Pending Completion

#### High Priority
1. **Admin Order Management Dashboard**
   - View all orders with status filters
   - Update order status (pending → confirmed → preparing → ready → delivered)
   - Track order progress
   - Assign delivery personnel

2. **User Feedback/Rating Interface**
   - Display feedback form after order delivery
   - Submit ratings and reviews
   - Display aggregated ratings on menu items
   - Show customer reviews in menu details
   - Admin approval workflow for feedback

3. **Payment Processing**
   - Implement payment method handling
   - Order confirmation after payment
   - Payment failure handling

#### Medium Priority
4. **User Profile Management**
   - Edit profile information
   - Manage delivery addresses
   - Account settings
   - Change password

5. **Real-time Order Tracking**
   - Live order status updates
   - Estimated preparation time
   - Delivery time estimation
   - Order notifications

6. **Invoice Management Interface**
   - View invoice history
   - Search/filter invoices
   - Re-download invoices
   - Invoice details view

---

### ⏳ Not Started (Future Features)

### High Priority Features
1. **Kitchen Display System (KDS)**
   - Real-time order display for kitchen staff
   - Order preparation status updates
   - Queue management

2. **Advanced Reporting**
   - Sales analytics dashboard
   - Popular items analysis
   - Revenue reports
   - Customer statistics

### Medium Priority
3. **Payment Gateway Integration**
   - Stripe integration
   - PayPal integration
   - Payment history and receipts

4. **Loyalty & Promotions**
   - Coupon code system
   - Discount management
   - Loyalty points program

5. **Inventory Management**
   - Stock tracking
   - Low stock alerts
   - Automatic menu availability

### Low Priority
6. **Mobile App**
   - React Native app
   - iOS/Android support
   - Push notifications

7. **Advanced Features**
   - GPS delivery tracking
   - Table reservation
   - AI recommendations
   - Social sharing

8. **Multi-language Support**
   - i18n implementation
   - Language switcher

---

## 🎯 Next Steps (Recommended Priority)

### Week 1-2: Admin Order Management
1. Implement admin order dashboard with status filters
2. Add order status update functionality
3. Display order items in admin view
4. Add order action buttons (confirm, prepare, ready, deliver)

### Week 2-3: User Feedback System
1. Display feedback form on delivered orders
2. Implement rating submission
3. Show customer reviews on menu items
4. Add admin feedback approval page

### Week 3-4: Payment & Checkout
1. Implement payment method selection
2. Order confirmation flow
3. Payment status tracking
4. Order receipt display

### Ongoing
- Bug fixes and testing
- UI/UX improvements
- Performance optimization
- Database query optimization


- Profile management (view, update)
- Profile image upload
- Password change
- Account activation/deactivation

**Endpoints:**
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - User login
- `POST /api/user/logout` - User logout
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### 2. Admin Module (`backend/modules/admin/`)
**Features:**
- Admin registration (super admin only)
- Admin login with role-based access
- Role hierarchy (super_admin, admin, manager)
- Admin profile management
- Last login tracking
- Menu management (categories & items)

**Endpoints:**
- `POST /api/admin/register` - Register new admin (super admin only)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `GET /api/admin/menu/categories` - Get all categories
- `POST /api/admin/menu/categories` - Create category
- `PUT /api/admin/menu/categories/:id` - Update category
- `DELETE /api/admin/menu/categories/:id` - Delete category
- `GET /api/admin/menu/items` - Get all menu items
- `POST /api/admin/menu/items` - Create menu item
- `PUT /api/admin/menu/items/:id` - Update menu item
- `DELETE /api/admin/menu/items/:id` - Delete menu item

### 3. Order Module (`backend/modules/order/`)
**Features:**
- Browse menu with categories
- View menu items with ratings
- Place orders with cart items
- Order history for users
- Order management for admins
- Order status tracking
- Special instructions support
- Multiple payment methods

**Endpoints:**
- `GET /api/order/categories` - Get all categories
- `GET /api/order/menu` - Get available menu items
- `POST /api/order/place` - Place new order
- `GET /api/order/my-orders` - Get user's orders
- `GET /api/order/:id` - Get order details
- `GET /api/order/all` - Get all orders (admin)
- `PUT /api/order/update-status/:id` - Update order status (admin)

### 4. Invoice Module (`backend/modules/invoice/`)
**Features:**
- Auto-generate invoices for orders
- Invoice number with custom prefix
- Tax calculation (configurable rate)
- Invoice list view
- Detailed invoice view
- Print-ready HTML templates
- PDF-ready format

**Endpoints:**
- `GET /api/invoice/list` - Get all invoices
- `GET /api/invoice/:id` - Get invoice details
- `GET /api/invoice/order/:order_id` - Get invoice by order ID
- `GET /api/invoice/print/:id` - Get printable invoice HTML

### 5. Feedback Module (`backend/modules/feedback/`)
**Features:**
- Submit feedback after delivery
- Rate menu items (1-5 stars)
- Write detailed reviews
- Admin approval system
- Aggregated ratings
- Automatic rating calculations
- Feedback moderation

**Endpoints:**
- `POST /api/feedback/submit` - Submit feedback
- `GET /api/feedback/menu-item/:id` - Get feedback for menu item
- `GET /api/feedback/eligible-orders` - Get orders eligible for feedback
- `GET /api/feedback/all` - Get all feedback (admin)
- `PUT /api/feedback/approve/:id` - Approve feedback (admin)
- `DELETE /api/feedback/:id` - Delete feedback (admin)

## 🗄 Database Schema

The system uses **MySQL** with the following main tables:

### Core Tables
- **users** - Customer accounts and profiles
- **admins** - Admin accounts with roles
- **categories** - Food categories
- **menu_items** - Menu items with details
- **orders** - Customer orders
- **order_items** - Order line items
- **invoices** - Generated invoices
- **feedback** - Customer feedback and ratings
- **menu_item_ratings** - Aggregated ratings (auto-updated via triggers)

### Key Features
- Foreign key constraints for data integrity
- Indexes on frequently queried columns
- Triggers for automatic invoice and rating updates
- Timestamps for audit trails
- Soft delete support (is_active flags)

For detailed schema, see `database/schema.sql`

## 📚 API Documentation

Complete API documentation is available in `backend/API_DOCUMENTATION.md`

### Authentication
All protected endpoints require either:
- **Session Cookie** (for web browsers)
- **JWT Token** in Authorization header: `Bearer <token>`

### Response Format
```json
{
  "message": "Success message",
  "data": { ... },
  "error": "Error message (if any)"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🔮 Future Recommendations

### High Priority
1. **Real-time Notifications**
   - WebSocket integration for live order updates
   - Push notifications for order status changes
   - Admin alerts for new orders

2. **Payment Gateway Integration**
   - Stripe/PayPal integration
   - Multiple payment options
   - Payment history and receipts
   - Refund management

3. **Advanced Search & Filters**
   - Search menu items by name, ingredients
   - Filter by price range, ratings, dietary preferences
   - Sort by popularity, price, ratings

4. **Delivery Tracking**
   - GPS-based delivery tracking
   - Estimated delivery time
   - Delivery person assignment
   - Route optimization

5. **Reporting & Analytics**
   - Sales reports (daily, weekly, monthly)
   - Popular items analysis
   - Revenue analytics with charts
   - Customer behavior insights
   - Export reports to PDF/Excel

### Medium Priority
6. **Loyalty Program**
   - Points system for orders
   - Rewards and discounts
   - Referral bonuses
   - Membership tiers

7. **Promotions & Discounts**
   - Coupon code system
   - Time-based offers
   - Bundle deals
   - First-time user discounts

8. **Multi-language Support**
   - i18n implementation
   - Language switcher
   - RTL support for Arabic/Hebrew

9. **Mobile App**
   - React Native or Flutter app
   - iOS and Android support
   - Push notifications
   - Offline mode

10. **Inventory Management**
    - Stock tracking
    - Low stock alerts
    - Automatic menu item availability
    - Supplier management

### Low Priority
11. **Social Features**
    - Share favorite items on social media
    - User reviews with photos
    - Follow other users
    - Community recipes

12. **AI Recommendations**
    - Personalized menu suggestions
    - Order history-based recommendations
    - Trending items
    - Similar items suggestions

13. **Table Reservation**
    - Dine-in table booking
    - Reservation management
    - Table availability calendar

14. **Kitchen Display System**
    - Real-time order display for kitchen
    - Order preparation tracking
    - Kitchen staff management

15. **Customer Support**
    - Live chat support
    - Ticket system
    - FAQ section
    - Chatbot integration

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript code
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Flask documentation
- Electron documentation
- Tailwind CSS team
- SweetAlert2 contributors
- All open-source contributors

---

**Made using Electron and Flask**