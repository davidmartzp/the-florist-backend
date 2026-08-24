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
        return $this->store($file, self::PRODUCTS_SUBDIR);
    }

    public function deleteProductImageIfLocal(?string $imageUrl): void
    {
        $this->deleteIfLocal($imageUrl, self::PRODUCTS_SUBDIR);
    }

    public function store(UploadedFileInterface $file, string $subdir): string
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
        $dir       = $this->dir($subdir);

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new HttpError(500, 'Could not create upload directory');
        }

        $file->moveTo($dir . '/' . $filename);

        return $subdir . '/' . $filename;
    }

    public function deleteIfLocal(?string $imageUrl, string $subdir): void
    {
        if ($imageUrl === null || $imageUrl === '') {
            return;
        }

        $absolutePrefix = $this->appUrl() . '/' . $subdir . '/';
        $relativePrefix = $subdir . '/';

        if (str_starts_with($imageUrl, $absolutePrefix)) {
            $filename = basename($imageUrl);
        } elseif (str_starts_with($imageUrl, $relativePrefix)) {
            $filename = basename($imageUrl);
        } else {
            return;
        }

        if ($filename === '' || str_contains($filename, '/') || str_contains($filename, '..')) {
            return;
        }

        $path = $this->dir($subdir) . '/' . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private function dir(string $subdir): string
    {
        return __DIR__ . '/../../public/' . $subdir;
    }

    private function appUrl(): string
    {
        $backendUrl = $_ENV['BACKEND_PUBLIC_URL'] ?? $_ENV['APP_URL'] ?? 'http://localhost';
        return rtrim((string) $backendUrl, '/');
    }
}
