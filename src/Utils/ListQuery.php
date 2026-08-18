<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Parsea y construye parámetros de listado paginado.
 * Equivale a src/utils/list-query.js del proyecto Node.
 */
class ListQuery
{
    /**
     * Parsea los query params y retorna un array de paginación validado.
     *
     * @param array<string,mixed> $query   Query params del request ($_GET).
     * @param array<string,mixed> $options Claves: allowedSortBy[], defaultSortBy,
     *                                     defaultSortOrder, defaultPageSize, maxPageSize.
     * @return array{page:int,pageSize:int,sortBy:string,sortOrder:string,offset:int}
     */
    public static function parse(array $query, array $options): array
    {
        $page        = self::positiveInt($query['page']     ?? null, 'page', 1);
        $rawPageSize = self::positiveInt($query['pageSize'] ?? null, 'pageSize', $options['defaultPageSize'] ?? 20);
        $pageSize    = min($rawPageSize, $options['maxPageSize'] ?? 100);

        $sortBy = isset($query['sortBy']) ? trim((string) $query['sortBy']) : ($options['defaultSortBy'] ?? 'createdAt');

        if (!in_array($sortBy, $options['allowedSortBy'], true)) {
            throw new HttpError(400, 'sortBy must be one of: ' . implode(', ', $options['allowedSortBy']));
        }

        $sortOrder = self::sortOrder($query['sortOrder'] ?? null, $options['defaultSortOrder'] ?? 'desc');

        return [
            'page'      => $page,
            'pageSize'  => $pageSize,
            'sortBy'    => $sortBy,
            'sortOrder' => $sortOrder,
            'offset'    => ($page - 1) * $pageSize,
        ];
    }

    /**
     * Construye la respuesta paginada estándar.
     *
     * @param array<mixed> $items
     * @param array{page:int,pageSize:int,sortBy:string,sortOrder:string} $pagination
     * @return array{items:array<mixed>,pagination:array<string,mixed>}
     */
    public static function buildResponse(array $items, int $total, array $pagination): array
    {
        return [
            'items'      => $items,
            'pagination' => [
                'page'       => $pagination['page'],
                'pageSize'   => $pagination['pageSize'],
                'totalItems' => $total,
                'totalPages' => $total === 0 ? 0 : (int) ceil($total / $pagination['pageSize']),
                'sortBy'     => $pagination['sortBy'],
                'sortOrder'  => $pagination['sortOrder'],
            ],
        ];
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private static function positiveInt(mixed $value, string $field, int $fallback): int
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        $int = filter_var($value, FILTER_VALIDATE_INT);

        if ($int === false || $int <= 0) {
            throw new HttpError(400, "{$field} must be a positive integer");
        }

        return $int;
    }

    private static function sortOrder(mixed $value, string $fallback): string
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        $normalized = strtolower(trim((string) $value));

        if (!in_array($normalized, ['asc', 'desc'], true)) {
            throw new HttpError(400, 'sortOrder must be asc or desc');
        }

        return $normalized;
    }
}
