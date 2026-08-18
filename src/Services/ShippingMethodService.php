<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\ShippingMethod;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use App\Utils\Slugify;

class ShippingMethodService
{
    private const SORT_COLUMNS = [
        'name'      => 'name',
        'slug'      => 'slug',
        'price'     => 'price',
        'isActive'  => 'is_active',
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
    ];

    // ── CMS ──────────────────────────────────────────────────────────────────

    public function listShippingMethods(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'name',
            'defaultSortOrder' => 'asc',
        ]);

        $col   = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir   = strtoupper($pagination['sortOrder']);
        $total = ShippingMethod::count();

        $items = ShippingMethod::orderByRaw("{$col} {$dir}, id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get()
            ->map(fn($m) => $m->toApiArray())
            ->all();

        return ListQuery::buildResponse($items, $total, $pagination);
    }

    public function getShippingMethodById(int $id): array
    {
        return $this->findOrFail($id)->toApiArray();
    }

    public function createShippingMethod(array $payload): array
    {
        $name        = $this->validateName($payload['name'] ?? null);
        $slug        = $this->resolveSlug($name, $payload['slug'] ?? null);
        $description = $this->normalizeDescription($payload['description'] ?? null);
        $price       = $this->normalizePrice($payload['price'] ?? null, present: array_key_exists('price', $payload));
        $isActive    = isset($payload['isActive']) ? (bool) $payload['isActive'] : true;

        $this->ensureSlugAvailable($slug);

        $method = ShippingMethod::create([
            'name'        => $name,
            'slug'        => $slug,
            'description' => $description,
            'price'       => $price,
            'is_active'   => $isActive,
        ]);

        return $method->fresh()->toApiArray();
    }

    public function updateShippingMethod(int $id, array $payload): array
    {
        $current = $this->findOrFail($id);
        $updates = [];

        if (array_key_exists('name', $payload)) {
            $updates['name'] = $this->validateName($payload['name']);
        }

        if (array_key_exists('description', $payload)) {
            $updates['description'] = $this->normalizeDescription($payload['description']);
        }

        if (array_key_exists('price', $payload)) {
            $updates['price'] = $this->normalizePrice($payload['price'], present: true);
        }

        if (array_key_exists('isActive', $payload)) {
            $updates['is_active'] = (bool) $payload['isActive'];
        }

        if (array_key_exists('slug', $payload) || isset($updates['name'])) {
            $slugBase        = $updates['name'] ?? $current->name;
            $updates['slug'] = $this->resolveSlug($slugBase, $payload['slug'] ?? null);
            $this->ensureSlugAvailable($updates['slug'], $current->id);
        }

        if (empty($updates)) {
            throw new HttpError(400, 'No valid fields were provided for update');
        }

        $current->update($updates);

        return $current->fresh()->toApiArray();
    }

    public function toggleShippingMethodActive(int $id): array
    {
        $method = $this->findOrFail($id);
        $next   = !$method->is_active;
        $method->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Shipping method activated successfully' : 'Shipping method deactivated successfully',
            'isActive' => $next,
        ];
    }

    // ── Site ─────────────────────────────────────────────────────────────────

    public function listActive(): array
    {
        return ShippingMethod::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($m) => $m->toApiArray())
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findOrFail(int $id): ShippingMethod
    {
        $method = ShippingMethod::find($id);
        if ($method === null) {
            throw new HttpError(404, 'Shipping method not found');
        }
        return $method;
    }

    private function validateName(mixed $name): string
    {
        $normalized = trim((string) ($name ?? ''));
        if ($normalized === '') {
            throw new HttpError(400, 'name is required');
        }
        return $normalized;
    }

    private function resolveSlug(string $name, mixed $customSlug): string
    {
        $source = ($customSlug !== null && $customSlug !== '') ? (string) $customSlug : $name;
        $slug   = Slugify::make($source);
        if ($slug === '') {
            throw new HttpError(400, 'A valid slug could not be generated');
        }
        return $slug;
    }

    private function normalizeDescription(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim((string) $value);
        return $trimmed !== '' ? $trimmed : null;
    }

    private function normalizePrice(mixed $value, bool $present): ?float
    {
        if (!$present || $value === null || $value === '') {
            return null;
        }

        $num = filter_var($value, FILTER_VALIDATE_FLOAT);

        if ($num === false || !is_finite($num) || $num < 0) {
            throw new HttpError(400, 'price must be a number greater than or equal to 0');
        }

        return round($num, 2);
    }

    private function ensureSlugAvailable(string $slug, ?int $excludedId = null): void
    {
        // Igual que Catalog: chequea todos, no solo activos
        $existing = ShippingMethod::where('slug', $slug)->first();
        if ($existing !== null && $existing->id !== $excludedId) {
            throw new HttpError(409, 'A shipping method with that slug already exists');
        }
    }
}
