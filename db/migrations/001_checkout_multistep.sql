-- Migration: checkout multistep (billing, shipping, receiver)
-- Adds new columns to orders table for structured checkout data

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

SET @orders_billing_city_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_city'
);
SET @orders_billing_city_sql := IF(
  @orders_billing_city_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_city VARCHAR(100) NULL AFTER billing_document',
  'SELECT 1'
);
PREPARE stmt FROM @orders_billing_city_sql;
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
  'ALTER TABLE orders ADD COLUMN receiver_name VARCHAR(150) NULL AFTER card_message',
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

SET @orders_card_signature_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'card_signature'
);
SET @orders_card_signature_sql := IF(
  @orders_card_signature_exists = 0,
  'ALTER TABLE orders ADD COLUMN card_signature VARCHAR(150) NULL AFTER receiver_phone',
  'SELECT 1'
);
PREPARE stmt FROM @orders_card_signature_sql;
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
  'ALTER TABLE orders ADD COLUMN delivery_date DATE NULL AFTER card_signature',
  'SELECT 1'
);
PREPARE stmt FROM @orders_delivery_date_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
