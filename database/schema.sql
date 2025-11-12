-- Food Ordering System Database Schema
-- MySQL Database for XAMPP

-- Create Database
CREATE DATABASE IF NOT EXISTS food_ordering_system;
USE food_ordering_system;

-- ============================================
-- USER MODULE TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ADMIN MODULE TABLES
-- ============================================

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MENU MODULE TABLES
-- ============================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    preparation_time INT DEFAULT 15 COMMENT 'in minutes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ORDER MODULE TABLES
-- ============================================

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    delivery_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_request TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INVOICE MODULE TABLES
-- ============================================

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_user (user_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_invoice_date (invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- FEEDBACK MODULE TABLES
-- ============================================

-- Feedback/Reviews Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    menu_item_id INT NULL COMMENT 'Optional: feedback for specific item',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_order (order_id),
    INDEX idx_menu_item (menu_item_id),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved),
    UNIQUE KEY unique_order_feedback (user_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menu Item Ratings (Aggregated)
CREATE TABLE IF NOT EXISTS menu_item_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT UNIQUE NOT NULL,
    total_ratings INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    rating_1_count INT DEFAULT 0,
    rating_2_count INT DEFAULT 0,
    rating_3_count INT DEFAULT 0,
    rating_4_count INT DEFAULT 0,
    rating_5_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SESSION MANAGEMENT (Optional)
-- ============================================

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_type ENUM('user', 'admin') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- AUDIT LOG (Optional but recommended)
-- ============================================

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_type ENUM('user', 'admin', 'guest') DEFAULT 'guest',
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default admin
INSERT INTO admins (username, email, password, full_name, role) VALUES
('admin', 'admin@foodorder.com', 'scrypt:32768:8:1$rnNUWv01iAROT9vY$9721ed75fdfac75dfb603eaab4ee021399cefb4f51eba689b933ac99a349a54fb8619a6c314ffc810983df74ca0b967b9635731f7827ddfe680dbbb8dc01bcb00', 'System Admin', 'super_admin');
-- Default password: admin123 (hashed with werkzeug scrypt)

-- Insert default categories
INSERT INTO categories (name, description, display_order) VALUES
('Pizza', 'Delicious pizzas with various toppings', 1),
('Burgers', 'Juicy burgers with fresh ingredients', 2),
('Pasta', 'Italian pasta dishes', 3),
('Salads', 'Fresh and healthy salads', 4),
('Drinks', 'Refreshing beverages', 5),
('Desserts', 'Sweet treats and desserts', 6);

-- Insert sample menu items
INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES
(1, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, TRUE),
(1, 'Pepperoni Pizza', 'Pizza topped with pepperoni and cheese', 14.99, TRUE),
(2, 'Classic Burger', 'Beef patty with lettuce, tomato, and cheese', 9.99, TRUE),
(2, 'Chicken Burger', 'Grilled chicken with special sauce', 10.99, FALSE),
(3, 'Spaghetti Carbonara', 'Creamy pasta with bacon and parmesan', 13.99, TRUE),
(3, 'Penne Arrabiata', 'Spicy tomato sauce with penne pasta', 11.99, FALSE),
(4, 'Caesar Salad', 'Romaine lettuce with caesar dressing', 8.99, FALSE),
(4, 'Greek Salad', 'Fresh vegetables with feta cheese', 9.99, FALSE),
(5, 'Coca Cola', 'Refreshing cola drink', 2.99, FALSE),
(5, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, FALSE),
(6, 'Chocolate Cake', 'Rich chocolate cake slice', 6.99, TRUE),
(6, 'Ice Cream', 'Vanilla ice cream with toppings', 5.99, FALSE);

-- Initialize menu item ratings
INSERT INTO menu_item_ratings (menu_item_id, total_ratings, average_rating)
SELECT id, 0, 0.00 FROM menu_items;

-- ============================================
-- VIEWS FOR EASIER QUERIES
-- ============================================

-- View: Order Details with User Info
CREATE OR REPLACE VIEW order_details_view AS
SELECT
    o.id,
    o.order_number,
    o.total_amount,
    o.status,
    o.payment_method,
    o.payment_status,
    o.created_at,
    u.id as user_id,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone
FROM orders o
JOIN users u ON o.user_id = u.id;

-- View: Menu Items with Ratings
CREATE OR REPLACE VIEW menu_with_ratings_view AS
SELECT
    m.id,
    m.name,
    m.description,
    m.price,
    m.image_url,
    m.is_available,
    m.is_featured,
    c.name as category_name,
    c.id as category_id,
    COALESCE(r.average_rating, 0) as average_rating,
    COALESCE(r.total_ratings, 0) as total_ratings
FROM menu_items m
JOIN categories c ON m.category_id = c.id
LEFT JOIN menu_item_ratings r ON m.id = r.menu_item_id;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update menu item ratings when feedback is added
CREATE TRIGGER after_feedback_insert
AFTER INSERT ON feedback
FOR EACH ROW
BEGIN
    IF NEW.menu_item_id IS NOT NULL THEN
        UPDATE menu_item_ratings
        SET
            total_ratings = total_ratings + 1,
            average_rating = (
                SELECT AVG(rating)
                FROM feedback
                WHERE menu_item_id = NEW.menu_item_id AND is_approved = TRUE
            ),
            rating_1_count = rating_1_count + IF(NEW.rating = 1, 1, 0),
            rating_2_count = rating_2_count + IF(NEW.rating = 2, 1, 0),
            rating_3_count = rating_3_count + IF(NEW.rating = 3, 1, 0),
            rating_4_count = rating_4_count + IF(NEW.rating = 4, 1, 0),
            rating_5_count = rating_5_count + IF(NEW.rating = 5, 1, 0)
        WHERE menu_item_id = NEW.menu_item_id;
    END IF;
END;

-- Trigger: Auto-generate order number
CREATE TRIGGER before_order_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END;

-- Trigger: Auto-generate invoice number
CREATE TRIGGER before_invoice_insert
BEFORE INSERT ON invoices
FOR EACH ROW
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        SET NEW.invoice_number = CONCAT('INV', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(FLOOR(RAND() * 9999), 4, '0'));
    END IF;
END;

