# Food Ordering System - API Documentation

## Base URL
```
http://127.0.0.1:5000/api
```

## Authentication
The API uses session-based authentication. After login, a session cookie is set automatically.

---

## 🔐 User Module (`/api/user`)

### Register User
- **POST** `/api/user/register`
- **Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St"
}
```

### Login
- **POST** `/api/user/login`
- **Body:** (supports login by username OR email)
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
OR
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

### Logout
- **POST** `/api/user/logout`

### Get Profile
- **GET** `/api/user/profile`
- **Auth Required:** Yes (User)

### Update Profile
- **PUT** `/api/user/profile`
- **Auth Required:** Yes (User)
- **Body:**
```json
{
  "full_name": "John Smith",
  "phone": "9876543210",
  "address": "456 Oak Ave",
  "profile_image": "https://example.com/image.jpg"
}
```

---

## 👨‍💼 Admin Module (`/api/admin`)

### Register Admin
- **POST** `/api/admin/register`
- **Auth Required:** Yes (Super Admin only)
- **Body:**
```json
{
  "username": "admin_user",
  "email": "admin@example.com",
  "password": "admin123",
  "full_name": "Admin User",
  "phone": "1234567890",
  "role": "admin"
}
```

### Admin Login
- **POST** `/api/admin/login`
- **Body:** (supports login by username OR email)
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
OR
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Admin Logout
- **POST** `/api/admin/logout`

### Get Admin Profile
- **GET** `/api/admin/profile`
- **Auth Required:** Yes (Admin)

### Update Admin Profile
- **PUT** `/api/admin/profile`
- **Auth Required:** Yes (Admin)

---

## 🍔 Order Module (`/api/order`)

### Get Categories
- **GET** `/api/order/categories`

### Get Menu Items
- **GET** `/api/order/menu`
- **Query Params:**
  - `category_id` (optional): Filter by category
  - `featured` (optional): true/false - Show only featured items

### Get Single Menu Item
- **GET** `/api/order/menu/<item_id>`

### Place Order
- **POST** `/api/order/place`
- **Auth Required:** Yes (User)
- **Body:**
```json
{
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2,
      "special_request": "No onions"
    }
  ],
  "payment_method": "cash",
  "delivery_address": "123 Main St",
  "special_instructions": "Ring doorbell"
}
```

### Get My Orders
- **GET** `/api/order/my-orders`
- **Auth Required:** Yes (User)

### Get Order Details
- **GET** `/api/order/order/<order_id>`
- **Auth Required:** Yes

### Get All Orders (Admin)
- **GET** `/api/order/all`
- **Auth Required:** Yes (Admin)
- **Query Params:**
  - `status` (optional): Filter by status

### Update Order Status (Admin)
- **PUT** `/api/order/update-status/<order_id>`
- **Auth Required:** Yes (Admin)
- **Body:**
```json
{
  "status": "confirmed"
}
```

---

## 📄 Invoice Module (`/api/invoice`)

### Generate Invoice
- **POST** `/api/invoice/generate/<order_id>`
- **Auth Required:** Yes

### Get My Invoices
- **GET** `/api/invoice/my-invoices`
- **Auth Required:** Yes (User)

### Get All Invoices (Admin)
- **GET** `/api/invoice/all`
- **Auth Required:** Yes (Admin)

### Get Invoice Details
- **GET** `/api/invoice/<invoice_id>`
- **Auth Required:** Yes

### Print Invoice (HTML)
- **GET** `/api/invoice/print/<invoice_id>`
- **Auth Required:** Yes
- **Returns:** HTML page for printing

---

## ⭐ Feedback Module (`/api/feedback`)

### Submit Feedback
- **POST** `/api/feedback/submit`
- **Auth Required:** Yes (User)
- **Body:**
```json
{
  "order_id": 1,
  "menu_item_id": 5,
  "rating": 5,
  "comment": "Excellent food!"
}
```

### Get Menu Item Feedback
- **GET** `/api/feedback/menu-item/<menu_item_id>`

### Get My Feedback
- **GET** `/api/feedback/my-feedback`
- **Auth Required:** Yes (User)

### Get Eligible Orders for Feedback
- **GET** `/api/feedback/eligible-orders`
- **Auth Required:** Yes (User)

### Get All Feedback (Admin)
- **GET** `/api/feedback/all`
- **Auth Required:** Yes (Admin)
- **Query Params:**
  - `approved` (optional): true/false

### Approve/Reject Feedback (Admin)
- **PUT** `/api/feedback/approve/<feedback_id>`
- **Auth Required:** Yes (Admin)
- **Body:**
```json
{
  "is_approved": true
}
```

### Delete Feedback (Admin)
- **DELETE** `/api/feedback/delete/<feedback_id>`
- **Auth Required:** Yes (Admin)

---

## 🏥 System Endpoints

### Health Check
- **GET** `/api/health`

### Check Session
- **GET** `/api/session`

---

## Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

