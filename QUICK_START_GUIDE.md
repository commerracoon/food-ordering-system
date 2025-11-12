# 🚀 Quick Start Guide - Food Ordering System

## ⚡ 5-Minute Setup

### Step 1: Start XAMPP MySQL
1. Open XAMPP Control Panel
2. Click "Start" for MySQL
3. Wait for green indicator

### Step 2: Setup Database
```bash
cd database
python setup_database.py
```

**Expected Output:**
```
✅ Connected to MySQL server
✅ Database 'food_ordering_system' created
✅ Schema executed successfully
✅ Database setup complete!
```

### Step 3: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Start Backend Server
```bash
python app.py
```

**Expected Output:**
```
============================================================
🍔 Food Ordering System - Starting Server
============================================================

📊 Database: MySQL (XAMPP)
🌐 Server: http://127.0.0.1:5000
📝 API Docs: http://127.0.0.1:5000/api/health
```

### Step 5: Start Frontend (New Terminal)
```bash
npm start
```

**Done! The application should now be running! 🎉**

---

## 🧪 Quick Test

### Test 1: Health Check
Open browser: http://127.0.0.1:5000/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "message": "Food Ordering System API is running"
}
```

### Test 2: Get Menu
Open browser: http://127.0.0.1:5000/api/order/menu

**Expected:** JSON array of menu items with ratings

### Test 3: Login as Admin
```bash
curl -X POST http://127.0.0.1:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodorder.com","password":"admin123"}'
```

---

## 📱 Using the Application

### As a Customer:

1. **Register Account**
   - Click "Register" or use `/api/user/register`
   - Fill in: username, email, password, full name

2. **Browse Menu**
   - View categories
   - See menu items with ratings
   - Read customer reviews

3. **Place Order**
   - Add items to cart
   - Specify quantities and special requests
   - Choose payment method
   - Provide delivery address

4. **Track Order**
   - View order history
   - Check order status
   - View order details

5. **Give Feedback**
   - After order is delivered
   - Rate menu items (1-5 stars)
   - Write review

6. **View Invoices**
   - See all your invoices
   - View invoice details
   - Print invoices

### As an Admin:

1. **Login**
   - Email: `admin@foodorder.com`
   - Password: `admin123`
   - **⚠️ Change this password immediately!**

2. **Manage Orders**
   - View all orders
   - Update order status:
     - pending → confirmed → preparing → ready → delivered

3. **Manage Feedback**
   - View all feedback
   - Approve or reject reviews
   - Delete inappropriate feedback

4. **View Invoices**
   - See all invoices
   - Access customer details

---

## 🔧 Common Commands

### Backend
```bash
# Start server
cd backend
python app.py

# Install dependencies
pip install -r requirements.txt

# Check Python version
python --version
```

### Frontend
```bash
# Start Electron app
npm start

# Install dependencies
npm install

# Check Node version
node --version
```

### Database
```bash
# Setup database
cd database
python setup_database.py

# Access MySQL CLI
mysql -u root -p
USE food_ordering_system;
SHOW TABLES;
```

---

## 🐛 Troubleshooting

### Problem: "Can't connect to MySQL server"
**Solution:**
1. Open XAMPP
2. Start MySQL
3. Wait for green indicator
4. Try again

### Problem: "Database 'food_ordering_system' doesn't exist"
**Solution:**
```bash
cd database
python setup_database.py
```

### Problem: "Module not found" (Python)
**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Problem: "Port 5000 already in use"
**Solution:**
1. Find process: `netstat -ano | findstr :5000` (Windows)
2. Kill process or change port in `backend/app.py`

### Problem: "Session not working"
**Solution:**
1. Clear browser cookies
2. Restart backend server
3. Try again

---

## 📚 API Quick Reference

### User Endpoints
- `POST /api/user/register` - Register
- `POST /api/user/login` - Login
- `GET /api/user/profile` - Get profile

### Order Endpoints
- `GET /api/order/menu` - Get menu
- `POST /api/order/place` - Place order
- `GET /api/order/my-orders` - My orders

### Invoice Endpoints
- `GET /api/invoice/my-invoices` - My invoices
- `GET /api/invoice/print/<id>` - Print invoice

### Feedback Endpoints
- `POST /api/feedback/submit` - Submit feedback
- `GET /api/feedback/menu-item/<id>` - Get reviews

**Full API Docs:** `backend/API_DOCUMENTATION.md`

---

## 📖 Documentation

- **Main README:** `README.md`
- **Setup Complete:** `SETUP_COMPLETE.md`
- **Backend API:** `backend/API_DOCUMENTATION.md`
- **Backend Setup:** `backend/README.md`
- **Database:** `database/README.md`

---

## ✅ Checklist

- [ ] XAMPP MySQL is running
- [ ] Database is set up
- [ ] Backend dependencies installed
- [ ] Backend server is running (port 5000)
- [ ] Frontend dependencies installed
- [ ] Electron app is running
- [ ] Can access http://127.0.0.1:5000/api/health
- [ ] Changed default admin password

---

**Need Help?** Check the documentation files or troubleshooting section above.

**Ready to code?** All backend modules are complete and ready to use! 🚀

