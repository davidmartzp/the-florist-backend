SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'checkout_sessions'
    AND COLUMN_NAME = 'external_reference'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE checkout_sessions ADD COLUMN external_reference VARCHAR(100) NULL AFTER preference_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'checkout_sessions'
    AND INDEX_NAME = 'checkout_sessions_external_reference_idx'
);
SET @idx_sql := IF(
  @idx_exists = 0,
  'ALTER TABLE checkout_sessions ADD INDEX checkout_sessions_external_reference_idx (external_reference)',
  'SELECT 1'
);
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
