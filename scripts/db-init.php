#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Inicializa / migra el esquema de la base de datos.
 * Equivale a scripts/db-init.js del proyecto Node.
 * Uso: php scripts/db-init.php
 */

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$host   = $_ENV['DB_HOST']     ?? '127.0.0.1';
$port   = $_ENV['DB_PORT']     ?? '3306';
$user   = $_ENV['DB_USER']     ?? 'root';
$pass   = $_ENV['DB_PASSWORD'] ?? '';
$dbName = $_ENV['DB_NAME']     ?? 'the_florist';

try {
    // Conectar sin base de datos para poder crearla si no existe
    $pdo = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Base de datos '{$dbName}' lista.\n";

    $pdo->exec("USE `{$dbName}`");

    $schema = file_get_contents(__DIR__ . '/../db/schema.sql');

    if ($schema === false) {
        echo "Error: no se encontró db/schema.sql\n";
        exit(1);
    }

    // Ejecutar sentencias separadas por ';' respetando bloques PREPARE/EXECUTE
    $pdo->exec($schema);

    echo "Esquema aplicado correctamente.\n";
} catch (PDOException $e) {
    echo "Error de base de datos: " . $e->getMessage() . "\n";
    exit(1);
}
