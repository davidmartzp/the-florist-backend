SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'billing_address'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE orders ADD COLUMN billing_address VARCHAR(255) NULL AFTER billing_city',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
