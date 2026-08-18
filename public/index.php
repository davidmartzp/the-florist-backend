<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno (.env opcional; en producción pueden venir del servidor)
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// Inicializar Eloquent ORM
require __DIR__ . '/../src/Bootstrap/database.php';

// Crear y correr la aplicación Slim
$app = require __DIR__ . '/../src/Bootstrap/app.php';
$app->run();
