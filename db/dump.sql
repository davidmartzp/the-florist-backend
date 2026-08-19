-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: the_florist
-- ------------------------------------------------------
-- Server version	8.4.8-0ubuntu1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `desktop_image` varchar(500) DEFAULT NULL,
  `mobile_image` varchar(500) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `catalogs`
--

DROP TABLE IF EXISTS `catalogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `catalogs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `catalogs_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalogs`
--

LOCK TABLES `catalogs` WRITE;
/*!40000 ALTER TABLE `catalogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `catalogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Día de las madres','dia-de-las-madres',NULL,1,'2026-05-02 10:17:38','2026-05-05 01:57:10');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkout_sessions`
--

DROP TABLE IF EXISTS `checkout_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkout_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `preference_id` varchar(255) NOT NULL,
  `external_reference` varchar(100) DEFAULT NULL,
  `payload` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'created',
  `payment_reference` varchar(255) DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `order_code` varchar(13) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_sessions_preference_id_idx` (`preference_id`),
  KEY `checkout_sessions_order_id_idx` (`order_id`),
  KEY `checkout_sessions_external_reference_idx` (`external_reference`),
  CONSTRAINT `checkout_sessions_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout_sessions`
--

LOCK TABLES `checkout_sessions` WRITE;
/*!40000 ALTER TABLE `checkout_sessions` DISABLE KEYS */;
INSERT INTO `checkout_sessions` VALUES (17,'3372301200-bdd27f18-2ee4-4df6-84d1-018fc1a5cbab',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 16:12:36','2026-05-02 16:12:36'),(18,'3372301200-9b6e30bd-0c07-435a-9a08-11a3154d24c1',NULL,'{\"cart\":[{\"productId\":3,\"quantity\":1,\"unitPrice\":300000,\"name\":\"Base Esencia\"},{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 16:53:29','2026-05-02 16:53:29'),(19,'3372301200-3aab3fb2-0805-45d1-b56a-4d12de0cd28d',NULL,'{\"cart\":[{\"productId\":3,\"quantity\":1,\"unitPrice\":300000,\"name\":\"Base Esencia\"},{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 16:57:54','2026-05-02 16:57:54'),(20,'3372301200-c3142bfb-f04c-4826-acd9-d8730d4c3f47',NULL,'{\"cart\":[{\"productId\":3,\"quantity\":1,\"unitPrice\":300000,\"name\":\"Base Esencia\"},{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 17:04:33','2026-05-02 17:04:33'),(21,'3372301200-57a41a00-d8ac-460d-8a08-9ccfa1d50866',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"},{\"productId\":5,\"quantity\":1,\"unitPrice\":120000,\"name\":\"Vela La Veranera\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 17:08:55','2026-05-02 17:08:55'),(22,'3372301200-27523fdb-f6be-48ca-b38f-04b794a2e65c',NULL,'{\"cart\":[{\"productId\":3,\"quantity\":1,\"unitPrice\":300000,\"name\":\"Base Esencia\"},{\"productId\":6,\"quantity\":1,\"unitPrice\":18000,\"name\":\"Galletas Topis\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','confirmed','TEST_PAGO_123',6,'MAY2026020001','2026-05-02 17:13:24','2026-05-02 22:25:35'),(23,'3372301200-ef25b43f-98a4-4a99-8e12-70efae64d4a1',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','confirmed','TEST_PAGO_123',7,'MAY2026020011','2026-05-02 17:57:32','2026-05-02 22:58:59'),(24,'3373866478-694b5f40-e735-4839-abf3-5c63250a8fb3',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 19:22:27','2026-05-02 19:22:27'),(25,'3373866478-7c0194a5-89d3-486d-9a95-de3045849e3e',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":10,\"name\":\"Producto prueba\"},{\"productId\":6,\"quantity\":1,\"unitPrice\":18000,\"name\":\"Galletas Topis\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":2}','created',NULL,NULL,NULL,'2026-05-02 19:37:08','2026-05-02 19:37:08'),(26,'3373866478-0a235d4c-1d38-4e95-b854-4dac4b9e7139',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":10,\"name\":\"Producto prueba\"},{\"productId\":6,\"quantity\":1,\"unitPrice\":18000,\"name\":\"Galletas Topis\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:38:59','2026-05-02 19:38:59'),(27,'3373866478-473c917c-cf09-4c7a-9560-199cdef20a37',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":10,\"name\":\"Producto prueba\"},{\"productId\":6,\"quantity\":1,\"unitPrice\":18000,\"name\":\"Galletas Topis\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:40:40','2026-05-02 19:40:40'),(28,'3373866478-21717f21-a601-461d-946c-0dbe381a950c',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":10,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:50:13','2026-05-02 19:50:13'),(29,'3373866478-3b02df3a-7956-4e30-bee7-52f78f8d7e18',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:53:38','2026-05-02 19:53:38'),(30,'3373866478-61cf8d33-c18c-43e7-9582-a0dab327e047',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:54:24','2026-05-02 19:54:24'),(31,'3373866478-d69821c2-3edf-4b46-a26a-bf963a46f844',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:55:37','2026-05-02 19:55:37'),(32,'3373866478-84346a11-c360-4805-9f11-29a90e10cb00',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"},{\"productId\":6,\"quantity\":1,\"unitPrice\":18000,\"name\":\"Galletas Topis\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 19:57:26','2026-05-02 19:57:26'),(33,'3373866478-05c6d44b-7623-4394-9491-c8a091eec1d0',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 20:12:31','2026-05-02 20:12:31'),(34,'3373866478-cb007abf-2287-44d9-bd7b-252ae83ffad3',NULL,'{\"cart\":[{\"productId\":19,\"quantity\":1,\"unitPrice\":1000,\"name\":\"Producto prueba\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-02 20:14:20','2026-05-02 20:14:20'),(35,'3373866478-eb42a6f8-239e-415f-a3b5-7defc9be03aa',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1}','created',NULL,NULL,NULL,'2026-05-04 18:22:03','2026-05-04 18:22:03'),(36,'3373866478-1849d152-34e6-417b-93cc-b8c5eca326ee',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"billingDocument\":\"12345678\",\"billingCity\":\"BOGOTÁ, D.C.\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1,\"receiverName\":\"David Martinez\",\"receiverPhone\":\"+573209455417\",\"cardSignature\":\"980247\",\"deliveryDate\":\"2026-05-05\"}','created',NULL,NULL,NULL,'2026-05-04 20:05:44','2026-05-04 20:05:44'),(37,'3373866478-0902596b-9ea9-4ea8-91e4-f39a1c123641',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"billingDocument\":\"12345678\",\"billingCity\":\"BOGOTÁ, D.C.\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1,\"receiverName\":\"David Martinez\",\"receiverPhone\":\"+573209455417\",\"cardSignature\":\"980247\",\"deliveryDate\":\"2026-05-05\"}','created',NULL,NULL,NULL,'2026-05-04 20:07:04','2026-05-04 20:07:04'),(38,'3373866478-491fd88d-1dc7-4ad0-af13-2747e2b401d0',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"billingDocument\":\"12345678\",\"billingCity\":\"BOGOTÁ, D.C.\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1,\"receiverName\":\"David Martinez\",\"receiverPhone\":\"+573209455417\",\"cardSignature\":\"980247\",\"deliveryDate\":\"2026-05-05\"}','created',NULL,NULL,NULL,'2026-05-04 21:08:21','2026-05-04 21:08:21'),(39,'3373866478-c09849cc-3c3a-4102-9427-d6c641aa8cbc',NULL,'{\"cart\":[{\"productId\":4,\"quantity\":1,\"unitPrice\":380000,\"name\":\"Florero Raíz\"}],\"customerName\":\"David Martinez\",\"customerPhone\":\"3209455417\",\"customerEmail\":\"davidmartinez4888@gmail.com\",\"billingDocument\":\"12345678\",\"billingDocumentType\":\"CC\",\"billingCity\":\"BOGOTÁ, D.C.\",\"deliveryAddress\":\"Calle 50 #1319\\nApto 504\",\"shippingMethodId\":1,\"receiverName\":\"David Martinez\",\"receiverPhone\":\"+573209455417\",\"cardSignature\":\"980247\",\"deliveryDate\":\"2026-05-05\"}','created',NULL,NULL,NULL,'2026-05-04 21:33:43','2026-05-04 21:33:43');
/*!40000 ALTER TABLE `checkout_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `has_vat` tinyint(1) NOT NULL DEFAULT '1',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '19.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  CONSTRAINT `order_items_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (9,6,3,'Base Esencia',1,300000.00,1,19.00,300000.00,57000.00,357000.00,'2026-05-02 17:25:35'),(10,6,6,'Galletas Topis',1,18000.00,1,19.00,18000.00,3420.00,21420.00,'2026-05-02 17:25:35'),(12,7,4,'Florero Raíz',1,380000.00,0,19.00,380000.00,0.00,380000.00,'2026-05-02 18:00:10'),(18,8,3,'Base Esencia',1,300000.00,0,0.00,300000.00,0.00,300000.00,'2026-05-04 22:05:03'),(19,9,3,'Base Esencia',1,300000.00,0,0.00,300000.00,0.00,300000.00,'2026-05-05 09:37:04'),(20,9,2,'Bouquet Mama Mía',1,160000.00,0,0.00,160000.00,0.00,160000.00,'2026-05-05 09:37:04'),(21,10,3,'Base Esencia',1,300000.00,0,0.00,300000.00,0.00,300000.00,'2026-05-05 13:26:22'),(22,10,2,'Bouquet Mama Mía',1,160000.00,0,0.00,160000.00,0.00,160000.00,'2026-05-05 13:26:22'),(23,11,3,'Base Esencia',1,300000.00,0,0.00,300000.00,0.00,300000.00,'2026-05-05 13:38:27'),(24,12,3,'Base Esencia',1,300000.00,0,0.00,300000.00,0.00,300000.00,'2026-05-05 13:39:17');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(13) DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `shipping_method_id` bigint unsigned DEFAULT NULL,
  `shipping_name` varchar(150) DEFAULT NULL,
  `shipping_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `includes_shipping_price` tinyint(1) NOT NULL DEFAULT '0',
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_email` varchar(150) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `billing_document` varchar(50) DEFAULT NULL,
  `billing_document_type` varchar(20) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_address` varchar(255) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `includes_card` tinyint(1) NOT NULL DEFAULT '0',
  `card_message` varchar(500) DEFAULT NULL,
  `receiver_name` varchar(150) DEFAULT NULL,
  `receiver_phone` varchar(50) DEFAULT NULL,
  `card_signature` varchar(150) DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `payment_provider` varchar(100) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_code_idx` (`code`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_shipping_method_id_idx` (`shipping_method_id`),
  CONSTRAINT `orders_shipping_method_id_fk` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (6,'MAY2026020001',NULL,2,'Domicilio Bogotá',12000.00,1,'David Martinez','davidmartinez4888@gmail.com','3209455417',NULL,NULL,NULL,NULL,'Calle 50 #1319\nApto 504',0,NULL,NULL,NULL,NULL,NULL,'mercadopago','TEST_PAGO_123',318000.00,60420.00,390420.00,'pending',0,0,'2026-05-02 17:25:35','2026-05-03 04:24:44'),(7,'MAY2026020011',NULL,2,'Domicilio Bogotá',12000.00,1,'David Martinez','davidmartinez4888@gmail.com','3209455417',NULL,NULL,NULL,NULL,'Calle 50 #1319\nApto 504',0,NULL,NULL,NULL,NULL,NULL,'mercadopago','TEST_PAGO_123',380000.00,0.00,392000.00,'completed',0,0,'2026-05-02 17:58:59','2026-05-03 04:24:46'),(8,'MAY2026040001',NULL,1,'Retiro en tienda',0.00,1,'David','davidmartinez4888@gmail.com','3209455417','123456','CC','BOGOTÁ, D.C.',NULL,'Dirección de envío',1,'un mensaje bonito','Prueba receptor','123456789','David M','2026-05-05',NULL,NULL,300000.00,0.00,300000.00,'completed',1,1,'2026-05-04 21:39:16','2026-05-05 03:05:03'),(9,'MAY2026050001',NULL,1,'Retiro en tienda',0.00,0,'David Martínez','davidmartinez4888@gmail.com','3209455417','12345678','CC','BOGOTÁ, D.C.','Calle 50 #1319\nApto 504','Calle 50 #1319\nApto 504',1,'PRUEBA','PRUEBA','3209455417','PRUEBA','2026-05-06',NULL,NULL,460000.00,0.00,460000.00,'pending',0,1,'2026-05-05 09:37:04','2026-05-05 09:37:04'),(10,'MAY2026010001',NULL,1,'Retiro en tienda',0.00,1,'David M','davidmartinez4888@gmail.com','3209455417','123456','CC','BOGOTÁ, D.C.','Calle 50 #1319\nApto 504',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,460000.00,0.00,460000.00,'pending',0,1,'2026-05-01 00:00:00','2026-05-05 13:26:22'),(11,'MAY2026010002',NULL,1,'Retiro en tienda',0.00,1,'Prueba','davidmartinez4888@gmail.com','3209455417','123456','CC','BOGOTÁ, D.C.','Calle 50 #1319\nApto 504',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,300000.00,0.00,300000.00,'pending',0,1,'2026-05-01 00:00:00','2026-05-05 13:38:27'),(12,'MAY2026050002',NULL,1,'Retiro en tienda',0.00,0,'prueba','davidmartinez4888@gmail.com','3209455417','123456','CC','BOGOTÁ, D.C.','Calle 50 #1319\nApto 504',NULL,0,NULL,NULL,NULL,NULL,NULL,'tienda',NULL,300000.00,0.00,300000.00,'pending',0,1,'2026-05-05 00:00:00','2026-05-05 13:39:17');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'USERS','Users','Access to the internal users CRUD module','2026-05-01 07:19:04','2026-05-01 07:19:04'),(2,'ORDERS','Orders','Access to the internal orders CRUD module','2026-05-01 07:19:04','2026-05-01 07:19:04'),(3,'PRODUCTS','Products','Access to the internal products CRUD module','2026-05-01 07:19:04','2026-05-01 07:19:04'),(4,'ADMIN','Admin','Access to global/site-configuration CMS modules (e.g. banners)','2026-05-01 07:19:04','2026-05-01 07:19:04');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_catalogs`
--

DROP TABLE IF EXISTS `product_catalogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_catalogs` (
  `product_id` bigint unsigned NOT NULL,
  `catalog_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`catalog_id`),
  KEY `product_catalogs_catalog_id_idx` (`catalog_id`),
  CONSTRAINT `product_catalogs_catalog_id_fk` FOREIGN KEY (`catalog_id`) REFERENCES `catalogs` (`id`),
  CONSTRAINT `product_catalogs_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_catalogs`
--

LOCK TABLES `product_catalogs` WRITE;
/*!40000 ALTER TABLE `product_catalogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_catalogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `product_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`category_id`),
  KEY `product_categories_category_id_idx` (`category_id`),
  CONSTRAINT `product_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `product_categories_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,1,'2026-05-02 17:56:24'),(2,1,'2026-05-02 17:56:30'),(3,1,'2026-05-02 17:56:33'),(4,1,'2026-05-04 19:47:56'),(19,1,'2026-05-02 19:53:13');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_price_history`
--

DROP TABLE IF EXISTS `product_price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_price_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `has_vat` tinyint(1) NOT NULL DEFAULT '1',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '19.00',
  `change_type` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_price_history_product_id_idx` (`product_id`),
  CONSTRAINT `product_price_history_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_price_history`
--

LOCK TABLES `product_price_history` WRITE;
/*!40000 ALTER TABLE `product_price_history` DISABLE KEYS */;
INSERT INTO `product_price_history` VALUES (16,1,140000.00,1,0.00,'updated','2026-05-02 17:56:01'),(17,2,160000.00,1,0.00,'updated','2026-05-02 17:56:05'),(18,3,300000.00,1,0.00,'updated','2026-05-02 17:56:10'),(19,1,140000.00,0,0.00,'updated','2026-05-02 17:56:24'),(20,2,160000.00,0,0.00,'updated','2026-05-02 17:56:30'),(21,3,300000.00,0,0.00,'updated','2026-05-02 17:56:33'),(22,4,380000.00,0,19.00,'updated','2026-05-02 17:56:37'),(23,5,120000.00,0,19.00,'updated','2026-05-02 17:56:41'),(24,7,90000.00,0,19.00,'updated','2026-05-02 17:56:49'),(25,6,18000.00,0,19.00,'updated','2026-05-02 17:56:52'),(26,19,0.99,0,19.00,'created','2026-05-02 19:35:33'),(27,19,10.00,0,19.00,'updated','2026-05-02 19:36:48'),(28,19,1000.00,0,19.00,'updated','2026-05-02 19:53:13');
/*!40000 ALTER TABLE `product_price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_tags`
--

DROP TABLE IF EXISTS `product_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_tags` (
  `product_id` bigint unsigned NOT NULL,
  `tag_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`tag_id`),
  KEY `product_tags_tag_id_idx` (`tag_id`),
  CONSTRAINT `product_tags_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `product_tags_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_tags`
--

LOCK TABLES `product_tags` WRITE;
/*!40000 ALTER TABLE `product_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `has_vat` tinyint(1) NOT NULL DEFAULT '1',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '19.00',
  `stock` int NOT NULL DEFAULT '0',
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'GENERAL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Bouquet Gratitud',140000.00,0,0.00,100,'Un bouquet fresco y elegante en tonos verdes y rosados suaves, con una mezcla de flores delicadas y follajes naturales que transmiten calma y sofisticación.','https://lafloreriabyflorescolon.co/assets/productos/boucket_gratitud.jpeg','GENERAL',1,'2026-05-02 10:36:13','2026-05-02 22:56:24'),(2,'Bouquet Mama Mía',160000.00,0,0.00,98,'Un arreglo intenso y lleno de carácter en tonos rojos y rosados, ideal para expresar amor con un toque moderno y vibrante.','https://lafloreriabyflorescolon.co/assets/productos/mama-mia.jpeg','GENERAL',1,'2026-05-02 10:36:13','2026-05-05 18:26:22'),(3,'Base Esencia',300000.00,0,0.00,95,'Una composición alegre y llena de vida en una base decorativa, con una mezcla de colores cálidos y flores variadas que iluminan cualquier espacio.','https://lafloreriabyflorescolon.co/assets/productos/base_esencia.jpeg','GENERAL',1,'2026-05-02 10:36:13','2026-05-05 18:39:17'),(4,'Florero Raíz',380000.00,0,19.00,99,'Un florero impactante en tonos rojos profundos, perfecto para un regalo elegante y lleno de fuerza, que no pasa desapercibido. Viene con florero de vidrio','https://lafloreriabyflorescolon.co/assets/productos/florero_raiz.jpeg','GENERAL',1,'2026-05-02 10:36:13','2026-05-05 00:47:56'),(5,'Vela La Veranera',120000.00,0,19.00,100,'Un aroma amaderado, elegante y femenino que revela la verdadera esencia de lo divino.','https://lafloreriabyflorescolon.co/assets/productos/vela_veranera.jpeg','COMPLEMENT',1,'2026-05-02 10:36:13','2026-05-02 22:56:41'),(6,'Galletas Topis',18000.00,0,19.00,100,'Bolsa con 4 galletas tradicionales de \"Topis\" sabor a birthday cake','galletas-topis.jpeg','COMPLEMENT',1,'2026-05-02 10:36:13','2026-05-03 04:24:44'),(7,'Galletas Nuts',90000.00,0,19.00,97,'4 galletas saludables de sabores variados, a base de harina de almendras sin azucares refinadas.','galletas-nuts.jpeg','COMPLEMENT',1,'2026-05-02 10:36:13','2026-05-05 00:50:04'),(19,'Producto prueba',1000.00,0,19.00,0,'null','null','GENERAL',1,'2026-05-02 19:35:33','2026-05-05 01:50:34');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_methods`
--

DROP TABLE IF EXISTS `shipping_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipping_methods_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_methods`
--

LOCK TABLES `shipping_methods` WRITE;
/*!40000 ALTER TABLE `shipping_methods` DISABLE KEYS */;
INSERT INTO `shipping_methods` VALUES (1,'Retiro en tienda','retiro-en-tienda','El cliente recoge el pedido en el punto de venta.',0.00,1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(2,'Domicilio Bogotá','domicilio-bogota','Entrega estándar en Medellín y área metropolitana.',25000.00,1,'2026-05-02 00:14:55','2026-05-05 01:30:40');
/*!40000 ALTER TABLE `shipping_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(130) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tags_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Rosas','rosas',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(2,'Lirios','lirios',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(3,'Tulipanes','tulipanes',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(4,'Premium','premium',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(5,'Plantas','plantas',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(6,'Romántico','romantico',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(7,'Express','express',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(8,'Best seller','best-seller',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(9,'Sin IVA','sin-iva',1,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(10,'Condolencias','condolencias',1,'2026-05-02 00:14:55','2026-05-02 00:14:55');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `user_id` bigint unsigned NOT NULL,
  `permission_id` smallint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `user_permissions_permission_id_fk` (`permission_id`),
  CONSTRAINT `user_permissions_permission_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  CONSTRAINT `user_permissions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (1,1,'2026-05-02 00:14:54'),(1,2,'2026-05-02 00:14:54'),(1,3,'2026-05-02 00:14:54'),(2,2,'2026-05-02 00:14:55'),(2,3,'2026-05-02 00:14:55'),(3,3,'2026-05-02 00:14:55'),(4,2,'2026-05-02 00:14:55');
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deactivated_at` datetime DEFAULT NULL,
  `reset_password_token_hash` char(64) DEFAULT NULL,
  `reset_password_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_reset_password_token_hash_idx` (`reset_password_token_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@floreriacolon.local','Amalia','Colón','$2b$10$4bEcrLxjpY0qYW8EK2SDd.LpwBfgtds3o6VKD7iecAPM/fZkfrftO',1,NULL,NULL,NULL,'2026-05-02 00:14:54','2026-05-05 15:37:04'),(2,'ventas@floreriacolon.local','Lucía','Rosas','$2b$10$VVYPNqv4f6PNNtA4zh5LA.CeB1Sdo2syT.MUtlP5yxZ5bQ1D6fn5S',1,NULL,NULL,NULL,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(3,'catalogo@floreriacolon.local','Mateo','Jardín','$2b$10$/Nw6Yk1rMUtZpyPKoWJKX.hMqdwiLF4LlE0sWSVRENlV9i40Pv4VK',1,NULL,NULL,NULL,'2026-05-02 00:14:55','2026-05-02 00:14:55'),(4,'operaciones@floreriacolon.local','Sara','Entrega','$2b$10$x0K7zcv.t5lmO2IsZ.6VpuXvSzCYs5c5LEjxUJwiHKSmV8jjplHSu',1,NULL,NULL,NULL,'2026-05-02 00:14:55','2026-05-05 01:51:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-20 19:24:22
