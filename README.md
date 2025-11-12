# Food Ordering System - Desktop Application

A modern desktop food ordering system built with **Electron** and **Python Flask**.

## Features

- 🍔 Browse menu items by categories
- 🛒 Shopping cart functionality
- 💳 Checkout and order placement
- 📊 Order management
- 🎨 Modern, responsive UI
- 💾 SQLite database for data persistence

## Tech Stack

- **Frontend**: Electron, HTML, CSS, JavaScript
- **Backend**: Python Flask
- **Database**: SQLite

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7 or higher
- npm or yarn

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. **Start the application:**
   ```bash
   npm start
   ```

   This will:
   - Start the Python Flask backend server on port 5000
   - Launch the Electron desktop application
   - Initialize the SQLite database with sample data

2. **Development mode (with DevTools):**
   ```bash
   npm run dev
   ```

## Project Structure

```
food-ordering-system/
├── backend/
│   └── app.py              # Flask backend API
├── index.html              # Main HTML file
├── app.js                  # Frontend JavaScript
├── styles.css              # Styling
├── main.js                 # Electron main process
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies
└── food_ordering.db        # SQLite database (auto-generated)
```

## API Endpoints

- `GET /api/categories` - Get all categories
- `GET /api/menu` - Get all menu items
- `GET /api/menu?category_id=<id>` - Get menu items by category
- `GET /api/menu/<id>` - Get specific menu item
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/<id>` - Get specific order

## Database Schema

### Tables:
- **categories** - Food categories
- **menu_items** - Menu items with prices and descriptions
- **orders** - Customer orders
- **order_items** - Items in each order

## Usage

1. Browse menu items by clicking on categories in the sidebar
2. Click "Add to Cart" to add items to your cart
3. Click the cart icon to view your cart
4. Adjust quantities or remove items as needed
5. Click "Checkout" to place your order
6. Fill in customer details and confirm the order

## Customization

### Adding Menu Items

Edit the `backend/app.py` file and add items to the `menu_items` list in the `init_db()` function.

### Styling

Modify `styles.css` to customize the appearance of the application.

## License

MIT

