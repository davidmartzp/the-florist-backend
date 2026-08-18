#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Restablece la contraseña de un usuario directamente en la BD.
 * Uso: php scripts/reset-password.php email@ejemplo.com nuevaContraseña
 */

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

require __DIR__ . '/../src/Bootstrap/database.php';

use Illuminate\Database\Capsule\Manager as DB;

$email    = $argv[1] ?? null;
$password = $argv[2] ?? null;

if (!$email || !$password) {
    echo "Uso: php scripts/reset-password.php <email> <nueva_contraseña>\n";
    exit(1);
}

if (strlen($password) < 8) {
    echo "Error: la contraseña debe tener al menos 8 caracteres.\n";
    exit(1);
}

$user = DB::table('users')->where('email', strtolower(trim($email)))->first();

if (!$user) {
    echo "Error: no se encontró el usuario '{$email}'.\n";
    exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

DB::table('users')
    ->where('id', $user->id)
    ->update([
        'password_hash'              => $hash,
        'reset_password_token_hash'  => null,
        'reset_password_expires_at'  => null,
        'updated_at'                 => date('Y-m-d H:i:s'),
    ]);

echo "Contraseña actualizada para '{$email}'.\n";
