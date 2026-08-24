<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Resuelve una referencia de imagen almacenada (ruta relativa) a una URL
 * absoluta usando la configuración pública actual del backend, en vez de
 * depender de una URL ya congelada al momento de subir el archivo.
 */
class ImageUrl
{
    public static function resolve(?string $stored): ?string
    {
        if ($stored === null || $stored === '') {
            return $stored;
        }

        if (preg_match('#^https?://#i', $stored)) {
            return $stored;
        }

        $backendUrl = $_ENV['BACKEND_PUBLIC_URL'] ?? $_ENV['APP_URL'] ?? 'http://localhost';
        return rtrim((string) $backendUrl, '/') . '/' . ltrim($stored, '/');
    }
}
