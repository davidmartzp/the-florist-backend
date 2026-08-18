<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Formatea timestamps al mismo formato que el backend Node.js:
 * "2026-05-02T00:14:55.000Z"  (ISO 8601, UTC, 3 decimales)
 */
class Fmt
{
    public static function ts(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        // Carbon instance (Eloquent model property)
        if ($value instanceof \Carbon\Carbon || $value instanceof \Carbon\CarbonInterface) {
            return $value->format('Y-m-d\TH:i:s.v\Z');
        }

        $str = trim((string) $value);
        if ($str === '') {
            return null;
        }

        // MySQL format: "2026-05-02 00:14:55" → ISO
        // ISO format with microseconds: "2026-05-02T00:14:55.000000Z" → truncate to ms
        // Replace space separator and strip sub-second part, then add .000Z
        $normalized = str_replace(' ', 'T', $str);
        // Strip any existing sub-second fraction and trailing Z
        $normalized = preg_replace('/\.\d+Z?$/', '', $normalized);
        $normalized = rtrim($normalized, 'Z');

        return $normalized . '.000Z';
    }
}
