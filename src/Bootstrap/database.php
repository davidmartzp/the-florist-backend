<?php
declare(strict_types=1);

use Illuminate\Database\Capsule\Manager as Capsule;

$capsule = new Capsule();

$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => $_ENV['DB_HOST']     ?? '127.0.0.1',
    'port'      => $_ENV['DB_PORT']     ?? '3306',
    'database'  => $_ENV['DB_NAME']     ?? 'the_florist',
    'username'  => $_ENV['DB_USER']     ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
    'strict'    => true,
    'engine'    => null,
    'options'   => [
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
    ],
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();
