-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: localhost    Database: the_florist
-- ------------------------------------------------------
-- Server version	8.4.8-0ubuntu0.25.10.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalogs`
--

LOCK TABLES `catalogs` WRITE;
/*!40000 ALTER TABLE `catalogs` DISABLE KEYS */;
INSERT INTO `catalogs` VALUES (1,'Colección Romance','coleccion-romance','Selección pensada para aniversarios, propuestas y San Valentín.',1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,'Madres en Flor','madres-en-flor','Curaduría de arreglos delicados para homenajear a mamá.',1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,'Cumpleaños Alegres','cumpleanos-alegres','Bouquets coloridos y vibrantes para celebraciones memorables.',1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,'Bodas Jardín','bodas-jardin','Diseños elegantes para novias, mesas principales y ceremonia.',1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(5,'Condolencias Serenas','condolencias-serenas','Arreglos blancos y verdes para acompañar con respeto.',1,'2026-04-18 14:45:20','2026-04-18 14:45:20');
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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Ramos clásicos','ramos-clasicos','Bouquets tradicionales para regalo inmediato y fechas especiales.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,'Arreglos premium','arreglos-premium','Diseños de alto valor con flores importadas, bases y detalles gourmet.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,'Plantas regalo','plantas-regalo','Opciones duraderas para oficina, hogar y obsequios corporativos.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,'Ocasiones especiales','ocasiones-especiales','Productos versátiles para cumpleaños, aniversarios y celebraciones.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(5,'Bodas','bodas','Ramos y arreglos pensados para ceremonias, novias y eventos.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(6,'Condolencias','condolencias','Diseños sobrios para acompañar homenajes y despedidas.','2026-04-18 14:45:20','2026-04-18 14:45:20'),(7,'Corporativo','corporativo','Arreglos y plantas para oficinas, recepción y clientes empresariales.','2026-04-18 14:45:20','2026-04-18 14:45:20');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
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
  `product_name` varchar(255) NOT NULL DEFAULT '',
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,'Ramo 12 rosas rojas',1,85000.00,1,19.00,85000.00,16150.00,101150.00,'2026-04-18 14:45:20'),(2,1,8,'Kit suculentas terrazo',2,48000.00,0,0.00,96000.00,0.00,96000.00,'2026-04-18 14:45:20'),(3,2,3,'Caja luxe 24 rosas y chocolates',1,169000.00,1,19.00,169000.00,32110.00,201110.00,'2026-04-18 14:45:20'),(4,3,4,'Orquídea blanca en cerámica',1,92000.00,1,19.00,92000.00,17480.00,109480.00,'2026-04-18 14:45:20'),(5,3,5,'Centro de mesa girasoles',1,74000.00,1,19.00,74000.00,14060.00,88060.00,'2026-04-18 14:45:20'),(6,4,6,'Corona serenidad blanca',1,185000.00,1,19.00,185000.00,35150.00,220150.00,'2026-04-18 14:45:20'),(7,5,7,'Bouquet novia marfil',1,145000.00,1,19.00,145000.00,27550.00,172550.00,'2026-04-18 14:45:20'),(8,5,9,'Tulipanes holandeses deluxe',1,98000.00,1,19.00,98000.00,18620.00,116620.00,'2026-04-18 14:45:20');
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
  `user_id` bigint unsigned NOT NULL,
  `shipping_method_id` bigint unsigned DEFAULT NULL,
  `shipping_name` varchar(150) DEFAULT NULL,
  `shipping_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `includes_shipping_price` tinyint(1) NOT NULL DEFAULT '0',
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_email` varchar(150) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `includes_card` tinyint(1) NOT NULL DEFAULT '0',
  `card_message` varchar(500) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_shipping_method_id_idx` (`shipping_method_id`),
  CONSTRAINT `orders_shipping_method_id_fk` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,2,'Domicilio Medellín',12000.00,1,'Valentina Mejía','valentina.mejia@example.com','3001234567','Cra. 43A #8-21, El Poblado, Medellín',1,'Feliz aniversario, que siempre florezca nuestro amor.',181000.00,16150.00,209150.00,'pending','2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,2,3,'Entrega express',25000.00,1,'Tomás Arbeláez','tomas.arbelaez@example.com','3019988776','Cl. 10 #35-14, Laureles, Medellín',1,'Que tengas un cumpleaños lleno de color.',169000.00,32110.00,226110.00,'confirmed','2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,4,1,'Retiro en tienda',0.00,0,'Marcela Gómez','marcela.gomez@example.com','3104567788',NULL,0,NULL,166000.00,31540.00,197540.00,'completed','2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,1,2,'Domicilio Medellín',12000.00,1,'Fundación Luz Serena','contacto@luzserena.org','6045553322','Av. Oriental #52-31, Medellín',1,'Con profundo respeto y solidaridad.',185000.00,35150.00,232150.00,'cancelled','2026-04-18 14:45:20','2026-04-18 14:45:20'),(5,2,4,'Envío nacional',28000.00,1,'Paula Restrepo','paula.restrepo@example.com','3152223344','Carrera 9 #18-45, Rionegro',0,NULL,243000.00,46170.00,317170.00,'completed','2026-04-18 14:45:20','2026-04-18 14:45:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'USERS','Users','Access to the internal users CRUD module','2026-04-18 11:44:29','2026-04-18 11:44:29'),(2,'ORDERS','Orders','Access to the internal orders CRUD module','2026-04-18 11:44:29','2026-04-18 11:44:29'),(3,'PRODUCTS','Products','Access to the internal products CRUD module','2026-04-18 11:44:29','2026-04-18 11:44:29');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_catalogs`
--

LOCK TABLES `product_catalogs` WRITE;
/*!40000 ALTER TABLE `product_catalogs` DISABLE KEYS */;
INSERT INTO `product_catalogs` VALUES (1,1,'2026-04-18 14:45:20'),(1,2,'2026-04-18 14:45:20'),(2,2,'2026-04-18 14:45:20'),(2,3,'2026-04-18 14:45:20'),(3,1,'2026-04-18 14:45:20'),(4,2,'2026-04-18 14:45:20'),(5,3,'2026-04-18 14:45:20'),(6,5,'2026-04-18 14:45:20'),(7,4,'2026-04-18 14:45:20'),(8,3,'2026-04-18 14:45:20'),(9,1,'2026-04-18 14:45:20'),(9,3,'2026-04-18 14:45:20');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,1,'2026-04-18 14:45:20'),(1,4,'2026-04-18 14:45:20'),(2,1,'2026-04-18 14:45:20'),(2,4,'2026-04-18 14:45:20'),(3,2,'2026-04-18 14:45:20'),(3,4,'2026-04-18 14:45:20'),(4,3,'2026-04-18 14:45:20'),(4,4,'2026-04-18 14:45:20'),(5,4,'2026-04-18 14:45:20'),(5,7,'2026-04-18 14:45:20'),(6,6,'2026-04-18 14:45:20'),(7,2,'2026-04-18 14:45:20'),(7,5,'2026-04-18 14:45:20'),(8,3,'2026-04-18 14:45:20'),(8,7,'2026-04-18 14:45:20'),(9,1,'2026-04-18 14:45:20'),(9,2,'2026-04-18 14:45:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_price_history`
--

LOCK TABLES `product_price_history` WRITE;
/*!40000 ALTER TABLE `product_price_history` DISABLE KEYS */;
INSERT INTO `product_price_history` VALUES (1,1,79000.00,1,19.00,'created','2026-04-18 14:45:20'),(2,2,68000.00,1,19.00,'created','2026-04-18 14:45:20'),(3,3,159000.00,1,19.00,'created','2026-04-18 14:45:20'),(4,4,92000.00,1,19.00,'created','2026-04-18 14:45:20'),(5,5,74000.00,1,19.00,'created','2026-04-18 14:45:20'),(6,6,185000.00,1,19.00,'created','2026-04-18 14:45:20'),(7,7,145000.00,1,19.00,'created','2026-04-18 14:45:20'),(8,8,45000.00,0,0.00,'created','2026-04-18 14:45:20'),(9,9,98000.00,1,19.00,'created','2026-04-18 14:45:20'),(10,1,85000.00,1,19.00,'updated','2026-04-18 14:45:20'),(11,2,72000.00,1,19.00,'updated','2026-04-18 14:45:20'),(12,3,169000.00,1,19.00,'updated','2026-04-18 14:45:20'),(13,8,48000.00,0,0.00,'updated','2026-04-18 14:45:20');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_tags`
--

LOCK TABLES `product_tags` WRITE;
/*!40000 ALTER TABLE `product_tags` DISABLE KEYS */;
INSERT INTO `product_tags` VALUES (1,1,'2026-04-18 14:45:20'),(1,6,'2026-04-18 14:45:20'),(1,7,'2026-04-18 14:45:20'),(1,8,'2026-04-18 14:45:20'),(2,2,'2026-04-18 14:45:20'),(2,8,'2026-04-18 14:45:20'),(3,1,'2026-04-18 14:45:20'),(3,4,'2026-04-18 14:45:20'),(3,6,'2026-04-18 14:45:20'),(4,4,'2026-04-18 14:45:20'),(4,5,'2026-04-18 14:45:20'),(5,7,'2026-04-18 14:45:20'),(5,8,'2026-04-18 14:45:20'),(6,2,'2026-04-18 14:45:20'),(6,10,'2026-04-18 14:45:20'),(7,2,'2026-04-18 14:45:20'),(7,4,'2026-04-18 14:45:20'),(8,5,'2026-04-18 14:45:20'),(8,9,'2026-04-18 14:45:20'),(9,3,'2026-04-18 14:45:20'),(9,4,'2026-04-18 14:45:20'),(9,6,'2026-04-18 14:45:20');
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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Ramo 12 rosas rojas',85000.00,1,19.00,23,'Doce rosas rojas, eucalipto y lazo satinado para aniversarios y detalles románticos.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(2,'Bouquet primavera pastel',72000.00,1,19.00,18,'Mezcla de claveles, margaritas, lirios y follajes suaves en tonos pastel.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(3,'Caja luxe 24 rosas y chocolates',169000.00,1,19.00,9,'Caja premium con 24 rosas rojas, chocolates artesanales y tarjeta personalizada.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(4,'Orquídea blanca en cerámica',92000.00,1,19.00,11,'Orquídea phalaenopsis en base de cerámica blanca para hogar u oficina.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(5,'Centro de mesa girasoles',74000.00,1,19.00,15,'Arreglo alegre con girasoles, solidago y base reutilizable para mesas o recepción.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(6,'Corona serenidad blanca',185000.00,1,19.00,7,'Corona fúnebre con rosas blancas, lirios y follajes verdes de acompañamiento.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(7,'Bouquet novia marfil',145000.00,1,19.00,5,'Bouquet para novia con rosas crema, lisianthus y acabado elegante en marfil.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(8,'Kit suculentas terrazo',48000.00,0,0.00,18,'Set de tres suculentas en materas pequeñas de estilo terrazo para escritorio.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20'),(9,'Tulipanes holandeses deluxe',98000.00,1,19.00,13,'Ramo de tulipanes importados en tonos intensos con empaque premium.',NULL,'2026-04-18 14:45:20','2026-04-18 19:45:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_methods`
--

LOCK TABLES `shipping_methods` WRITE;
/*!40000 ALTER TABLE `shipping_methods` DISABLE KEYS */;
INSERT INTO `shipping_methods` VALUES (1,'Retiro en tienda','retiro-en-tienda','El cliente recoge el pedido en el punto de venta.',0.00,1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,'Domicilio Medellín','domicilio-medellin','Entrega estándar en Medellín y área metropolitana.',12000.00,1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,'Entrega express','entrega-express','Entrega prioritaria el mismo día sujeta a cobertura.',22000.00,1,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,'Envío nacional','envio-nacional','Despacho coordinado fuera del área metropolitana.',28000.00,1,'2026-04-18 14:45:20','2026-04-18 14:45:20');
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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tags_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Rosas','rosas','2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,'Lirios','lirios','2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,'Tulipanes','tulipanes','2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,'Premium','premium','2026-04-18 14:45:20','2026-04-18 14:45:20'),(5,'Plantas','plantas','2026-04-18 14:45:20','2026-04-18 14:45:20'),(6,'Romántico','romantico','2026-04-18 14:45:20','2026-04-18 14:45:20'),(7,'Express','express','2026-04-18 14:45:20','2026-04-18 14:45:20'),(8,'Best seller','best-seller','2026-04-18 14:45:20','2026-04-18 14:45:20'),(9,'Sin IVA','sin-iva','2026-04-18 14:45:20','2026-04-18 14:45:20'),(10,'Condolencias','condolencias','2026-04-18 14:45:20','2026-04-18 14:45:20');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (1,1,'2026-04-18 14:45:20'),(1,2,'2026-04-18 14:45:20'),(1,3,'2026-04-18 14:45:20'),(2,2,'2026-04-18 14:45:20'),(2,3,'2026-04-18 14:45:20'),(3,3,'2026-04-18 14:45:20'),(4,2,'2026-04-18 14:45:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@floreriacolon.local','Amalia','Colón','$2b$10$izH.Ul6hTOkKQ9o99efgR.NBly6Dtq/yuGqxtEiMIahWzJyDyxh8.',1,NULL,NULL,NULL,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(2,'ventas@floreriacolon.local','Lucía','Rosas','$2b$10$0QHPpJTAL9hcerjWUx3SPO2dduF/q2dvV/JbGEqV5h8/5p52GVWpu',1,NULL,NULL,NULL,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(3,'catalogo@floreriacolon.local','Mateo','Jardín','$2b$10$5rpQclXu1f7vIxh4Hiqzhe6aK2.VunC7RmW542rOtTRZB3sq0UJ8e',1,NULL,NULL,NULL,'2026-04-18 14:45:20','2026-04-18 14:45:20'),(4,'operaciones@floreriacolon.local','Sara','Entrega','$2b$10$Sj7SUiRF9b6isZ1mussv.uHZ1Vh.vHWd6dy8vSMFJ7gy43/bhLHrm',1,NULL,NULL,NULL,'2026-04-18 14:45:20','2026-04-18 14:45:20');
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

-- Dump completed on 2026-04-24 17:21:23
