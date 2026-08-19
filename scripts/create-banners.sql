-- Creates the `banners` table and the `ADMIN` permission row.
-- Safe to run against an existing/deployed database more than once
-- (CREATE TABLE IF NOT EXISTS + INSERT IGNORE on the unique `code` column).
--
-- Uso: mysql -u<user> -p <database> < scripts/create-banners.sql

CREATE TABLE IF NOT EXISTS banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  desktop_image VARCHAR(500) NULL,
  mobile_image VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('ADMIN', 'Admin', 'Access to global/site-configuration CMS modules (e.g. banners)');
