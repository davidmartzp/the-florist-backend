CREATE TABLE IF NOT EXISTS permissions (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY permissions_code_unique (code)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  deactivated_at DATETIME NULL,
  reset_password_token_hash CHAR(64) NULL,
  reset_password_expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_reset_password_token_hash_idx (reset_password_token_hash)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id SMALLINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT user_permissions_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT user_permissions_permission_id_fk FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  has_vat TINYINT(1) NOT NULL DEFAULT 1,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00,
  stock INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_slug_unique (slug)
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(130) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY tags_slug_unique (slug)
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, category_id),
  KEY product_categories_category_id_idx (category_id),
  CONSTRAINT product_categories_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT product_categories_category_id_fk FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS catalogs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY catalogs_slug_unique (slug)
);

CREATE TABLE IF NOT EXISTS product_catalogs (
  product_id BIGINT UNSIGNED NOT NULL,
  catalog_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, catalog_id),
  KEY product_catalogs_catalog_id_idx (catalog_id),
  CONSTRAINT product_catalogs_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT product_catalogs_catalog_id_fk FOREIGN KEY (catalog_id) REFERENCES catalogs (id)
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, tag_id),
  KEY product_tags_tag_id_idx (tag_id),
  CONSTRAINT product_tags_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT product_tags_tag_id_fk FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE IF NOT EXISTS shipping_methods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY shipping_methods_slug_unique (slug)
);

CREATE TABLE IF NOT EXISTS product_price_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  has_vat TINYINT(1) NOT NULL DEFAULT 1,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00,
  change_type VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY product_price_history_product_id_idx (product_id),
  CONSTRAINT product_price_history_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(13) NULL,
  user_id BIGINT UNSIGNED NULL,
  shipping_method_id BIGINT UNSIGNED NULL,
  shipping_name VARCHAR(150) NULL,
  shipping_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  includes_shipping_price TINYINT(1) NOT NULL DEFAULT 0,
  customer_name VARCHAR(150) NULL,
  customer_email VARCHAR(150) NULL,
  customer_phone VARCHAR(50) NULL,
  shipping_address VARCHAR(255) NULL,
  includes_card TINYINT(1) NOT NULL DEFAULT 0,
  card_message VARCHAR(500) NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  payment_provider VARCHAR(100) NULL,
  payment_reference VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_code_idx (code),
  KEY orders_user_id_idx (user_id),
  KEY orders_shipping_method_id_idx (shipping_method_id),
  CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT orders_shipping_method_id_fk FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  preference_id VARCHAR(255) NOT NULL,
  payload TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  payment_reference VARCHAR(255) NULL,
  order_id BIGINT UNSIGNED NULL,
  order_code VARCHAR(13) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY checkout_sessions_preference_id_idx (preference_id),
  KEY checkout_sessions_order_id_idx (order_id),
  CONSTRAINT checkout_sessions_order_id_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  has_vat TINYINT(1) NOT NULL DEFAULT 1,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_items_order_id_idx (order_id),
  KEY order_items_product_id_idx (product_id),
  CONSTRAINT order_items_order_id_fk FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT order_items_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id)
);

INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('USERS', 'Users', 'Access to the internal users CRUD module'),
  ('ORDERS', 'Orders', 'Access to the internal orders CRUD module'),
  ('PRODUCTS', 'Products', 'Access to the internal products CRUD module');

SET @products_has_vat_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'has_vat'
);
SET @products_has_vat_sql := IF(
  @products_has_vat_exists = 0,
  'ALTER TABLE products ADD COLUMN has_vat TINYINT(1) NOT NULL DEFAULT 1 AFTER price',
  'SELECT 1'
);
PREPARE stmt FROM @products_has_vat_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @products_vat_rate_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'vat_rate'
);
SET @products_vat_rate_sql := IF(
  @products_vat_rate_exists = 0,
  'ALTER TABLE products ADD COLUMN vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00 AFTER has_vat',
  'SELECT 1'
);
PREPARE stmt FROM @products_vat_rate_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @products_type_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'type'
);
SET @products_type_sql := IF(
  @products_type_exists = 0,
  'ALTER TABLE products ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT ''GENERAL'' AFTER image',
  'SELECT 1'
);
PREPARE stmt FROM @products_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_subtotal_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'subtotal'
);
SET @orders_subtotal_sql := IF(
  @orders_subtotal_exists = 0,
  'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER user_id',
  'SELECT 1'
);
PREPARE stmt FROM @orders_subtotal_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_tax_total_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'tax_total'
);
SET @orders_tax_total_sql := IF(
  @orders_tax_total_exists = 0,
  'ALTER TABLE orders ADD COLUMN tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal',
  'SELECT 1'
);
PREPARE stmt FROM @orders_tax_total_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_method_id_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_method_id'
);
SET @orders_shipping_method_id_sql := IF(
  @orders_shipping_method_id_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_method_id BIGINT UNSIGNED NULL AFTER user_id',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_method_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_name_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_name'
);
SET @orders_shipping_name_sql := IF(
  @orders_shipping_name_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_name VARCHAR(150) NULL AFTER shipping_method_id',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_name_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_price_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_price'
);
SET @orders_shipping_price_sql := IF(
  @orders_shipping_price_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_price DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER shipping_name',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_price_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_includes_shipping_price_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'includes_shipping_price'
);
SET @orders_includes_shipping_price_sql := IF(
  @orders_includes_shipping_price_exists = 0,
  'ALTER TABLE orders ADD COLUMN includes_shipping_price TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_price',
  'SELECT 1'
);
PREPARE stmt FROM @orders_includes_shipping_price_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_customer_name_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_name'
);
SET @orders_customer_name_sql := IF(
  @orders_customer_name_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_name VARCHAR(150) NULL AFTER includes_shipping_price',
  'SELECT 1'
);
PREPARE stmt FROM @orders_customer_name_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_customer_email_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_email'
);
SET @orders_customer_email_sql := IF(
  @orders_customer_email_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_email VARCHAR(150) NULL AFTER customer_name',
  'SELECT 1'
);
PREPARE stmt FROM @orders_customer_email_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_customer_phone_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_phone'
);
SET @orders_customer_phone_sql := IF(
  @orders_customer_phone_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50) NULL AFTER customer_email',
  'SELECT 1'
);
PREPARE stmt FROM @orders_customer_phone_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_address_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_address'
);
SET @orders_shipping_address_sql := IF(
  @orders_shipping_address_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_address VARCHAR(255) NULL AFTER customer_phone',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_address_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_includes_card_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'includes_card'
);
SET @orders_includes_card_sql := IF(
  @orders_includes_card_exists = 0,
  'ALTER TABLE orders ADD COLUMN includes_card TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_address',
  'SELECT 1'
);
PREPARE stmt FROM @orders_includes_card_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_card_message_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'card_message'
);
SET @orders_card_message_sql := IF(
  @orders_card_message_exists = 0,
  'ALTER TABLE orders ADD COLUMN card_message VARCHAR(500) NULL AFTER includes_card',
  'SELECT 1'
);
PREPARE stmt FROM @orders_card_message_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_method_id_idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'orders_shipping_method_id_idx'
);
SET @orders_shipping_method_id_idx_sql := IF(
  @orders_shipping_method_id_idx_exists = 0,
  'ALTER TABLE orders ADD KEY orders_shipping_method_id_idx (shipping_method_id)',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_method_id_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_shipping_method_id_fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND CONSTRAINT_NAME = 'orders_shipping_method_id_fk'
);
SET @orders_shipping_method_id_fk_sql := IF(
  @orders_shipping_method_id_fk_exists = 0,
  'ALTER TABLE orders ADD CONSTRAINT orders_shipping_method_id_fk FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @orders_shipping_method_id_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_product_name_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'product_name'
);
SET @order_items_product_name_sql := IF(
  @order_items_product_name_exists = 0,
  'ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) NOT NULL DEFAULT '''' AFTER product_id',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_product_name_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_has_vat_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'has_vat'
);
SET @order_items_has_vat_sql := IF(
  @order_items_has_vat_exists = 0,
  'ALTER TABLE order_items ADD COLUMN has_vat TINYINT(1) NOT NULL DEFAULT 1 AFTER unit_price',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_has_vat_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_vat_rate_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'vat_rate'
);
SET @order_items_vat_rate_sql := IF(
  @order_items_vat_rate_exists = 0,
  'ALTER TABLE order_items ADD COLUMN vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00 AFTER has_vat',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_vat_rate_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_subtotal_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'subtotal'
);
SET @order_items_subtotal_sql := IF(
  @order_items_subtotal_exists = 0,
  'ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER vat_rate',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_subtotal_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_tax_total_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'tax_total'
);
SET @order_items_tax_total_sql := IF(
  @order_items_tax_total_exists = 0,
  'ALTER TABLE order_items ADD COLUMN tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_tax_total_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @order_items_total_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'total'
);
SET @order_items_total_sql := IF(
  @order_items_total_exists = 0,
  'ALTER TABLE order_items ADD COLUMN total DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER tax_total',
  'SELECT 1'
);
PREPARE stmt FROM @order_items_total_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_code_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'code'
);
SET @orders_code_sql := IF(
  @orders_code_exists = 0,
  'ALTER TABLE orders ADD COLUMN code VARCHAR(13) NULL AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @orders_code_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_code_idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'orders_code_idx'
);
SET @orders_code_idx_sql := IF(
  @orders_code_idx_exists = 0,
  'ALTER TABLE orders ADD UNIQUE KEY orders_code_idx (code)',
  'SELECT 1'
);
PREPARE stmt FROM @orders_code_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @checkout_sessions_payment_reference_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'checkout_sessions'
    AND COLUMN_NAME = 'payment_reference'
);
SET @checkout_sessions_payment_reference_sql := IF(
  @checkout_sessions_payment_reference_exists = 0,
  'ALTER TABLE checkout_sessions ADD COLUMN payment_reference VARCHAR(255) NULL AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @checkout_sessions_payment_reference_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @checkout_sessions_order_code_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'checkout_sessions'
    AND COLUMN_NAME = 'order_code'
);
SET @checkout_sessions_order_code_sql := IF(
  @checkout_sessions_order_code_exists = 0,
  'ALTER TABLE checkout_sessions ADD COLUMN order_code VARCHAR(13) NULL AFTER order_id',
  'SELECT 1'
);
PREPARE stmt FROM @checkout_sessions_order_code_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_payment_provider_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'payment_provider'
);
SET @orders_payment_provider_sql := IF(
  @orders_payment_provider_exists = 0,
  'ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(100) NULL AFTER card_message',
  'SELECT 1'
);
PREPARE stmt FROM @orders_payment_provider_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_payment_reference_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'payment_reference'
);
SET @orders_payment_reference_sql := IF(
  @orders_payment_reference_exists = 0,
  'ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255) NULL AFTER payment_provider',
  'SELECT 1'
);
PREPARE stmt FROM @orders_payment_reference_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @products_is_active_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'is_active'
);
SET @products_is_active_sql := IF(
  @products_is_active_exists = 0,
  'ALTER TABLE products ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER type',
  'SELECT 1'
);
PREPARE stmt FROM @products_is_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @categories_is_active_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categories'
    AND COLUMN_NAME = 'is_active'
);
SET @categories_is_active_sql := IF(
  @categories_is_active_exists = 0,
  'ALTER TABLE categories ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description',
  'SELECT 1'
);
PREPARE stmt FROM @categories_is_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_is_active_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'is_active'
);
SET @orders_is_active_sql := IF(
  @orders_is_active_exists = 0,
  'ALTER TABLE orders ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @orders_is_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @tags_is_active_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tags'
    AND COLUMN_NAME = 'is_active'
);
SET @tags_is_active_sql := IF(
  @tags_is_active_exists = 0,
  'ALTER TABLE tags ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER slug',
  'SELECT 1'
);
PREPARE stmt FROM @tags_is_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_is_paid_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'is_paid'
);
SET @orders_is_paid_sql := IF(
  @orders_is_paid_exists = 0,
  'ALTER TABLE orders ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 0 AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @orders_is_paid_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_billing_document_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_document'
);
SET @orders_billing_document_sql := IF(
  @orders_billing_document_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_document VARCHAR(50) NULL AFTER customer_phone',
  'SELECT 1'
);
PREPARE stmt FROM @orders_billing_document_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_billing_document_type_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_document_type'
);
SET @orders_billing_document_type_sql := IF(
  @orders_billing_document_type_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_document_type VARCHAR(20) NULL AFTER billing_document',
  'SELECT 1'
);
PREPARE stmt FROM @orders_billing_document_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_billing_city_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_city'
);
SET @orders_billing_city_sql := IF(
  @orders_billing_city_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_city VARCHAR(100) NULL AFTER billing_document_type',
  'SELECT 1'
);
PREPARE stmt FROM @orders_billing_city_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_billing_address_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_address'
);
SET @orders_billing_address_sql := IF(
  @orders_billing_address_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_address VARCHAR(255) NULL AFTER billing_city',
  'SELECT 1'
);
PREPARE stmt FROM @orders_billing_address_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_receiver_name_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'receiver_name'
);
SET @orders_receiver_name_sql := IF(
  @orders_receiver_name_exists = 0,
  'ALTER TABLE orders ADD COLUMN receiver_name VARCHAR(150) NULL AFTER shipping_address',
  'SELECT 1'
);
PREPARE stmt FROM @orders_receiver_name_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_receiver_phone_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'receiver_phone'
);
SET @orders_receiver_phone_sql := IF(
  @orders_receiver_phone_exists = 0,
  'ALTER TABLE orders ADD COLUMN receiver_phone VARCHAR(50) NULL AFTER receiver_name',
  'SELECT 1'
);
PREPARE stmt FROM @orders_receiver_phone_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_delivery_date_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'delivery_date'
);
SET @orders_delivery_date_sql := IF(
  @orders_delivery_date_exists = 0,
  'ALTER TABLE orders ADD COLUMN delivery_date DATE NULL AFTER receiver_phone',
  'SELECT 1'
);
PREPARE stmt FROM @orders_delivery_date_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @orders_card_signature_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'card_signature'
);
SET @orders_card_signature_sql := IF(
  @orders_card_signature_exists = 0,
  'ALTER TABLE orders ADD COLUMN card_signature VARCHAR(150) NULL AFTER card_message',
  'SELECT 1'
);
PREPARE stmt FROM @orders_card_signature_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
