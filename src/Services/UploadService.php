<?php
declare(strict_types=1);

namespace App\Services;

use App\Utils\HttpError;
use Psr\Http\Message\UploadedFileInterface;

class UploadService
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    private const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    private const PRODUCTS_SUBDIR = 'uploads/products';

    public function storeProductImage(UploadedFileInterface $file): string
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new HttpError(422, 'Image upload failed');
        }

        if ($file->getSize() !== null && $file->getSize() > self::MAX_FILE_SIZE_BYTES) {
            throw new HttpError(422, 'Image must be 5MB or smaller');
        }

        $tmpPath  = $file->getStream()->getMetadata('uri');
        $mimeType = is_string($tmpPath) && $tmpPath !== '' ? (string) mime_content_type($tmpPath) : '';

        if (!isset(self::ALLOWED_MIME_TYPES[$mimeType])) {
            throw new HttpError(422, 'Image must be a JPEG, PNG, or WEBP file');
        }

        $extension = self::ALLOWED_MIME_TYPES[$mimeType];
        $filename  = bin2hex(random_bytes(16)) . '.' . $extension;
        $dir       = $this->productsDir();

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new HttpError(500, 'Could not create upload directory');
        }

        $file->moveTo($dir . '/' . $filename);

        return $this->appUrl() . '/' . self::PRODUCTS_SUBDIR . '/' . $filename;
    }

    public function deleteProductImageIfLocal(?string $imageUrl): void
    {
        if ($imageUrl === null || $imageUrl === '') {
            return;
        }

        $prefix = $this->appUrl() . '/' . self::PRODUCTS_SUBDIR . '/';
        if (!str_starts_with($imageUrl, $prefix)) {
            return;
        }

        $filename = basename($imageUrl);
        if ($filename === '' || str_contains($filename, '/') || str_contains($filename, '..')) {
            return;
        }

        $path = $this->productsDir() . '/' . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private function productsDir(): string
    {
        return __DIR__ . '/../../public/' . self::PRODUCTS_SUBDIR;
    }

    private function appUrl(): string
    {
        return rtrim((string) ($_ENV['APP_URL'] ?? 'http://localhost'), '/');
    }
}
