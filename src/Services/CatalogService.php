<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Catalog;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use App\Utils\Slugify;

class CatalogService
{
    private const SORT_COLUMNS = [
        'name'      => 'name',
        'slug'      => 'slug',
        'isActive'  => 'is_active',
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
    ];

    public function listCatalogs(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'name',
            'defaultSortOrder' => 'asc',
        ]);

        $col   = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir   = strtoupper($pagination['sortOrder']);
        $total = Catalog::count();

        $items = Catalog::orderByRaw("{$col} {$dir}, id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get()
            ->map(fn($c) => $c->toApiArray())
            ->all();

        return ListQuery::buildResponse($items, $total, $pagination);
    }

    public function getCatalogById(int $catalogId): array
    {
        return $this->findOrFail($catalogId)->toApiArray();
    }

    public function createCatalog(array $payload): array
    {
        $name        = $this->validateName($payload['name'] ?? null);
        $slug        = $this->resolveSlug($name, $payload['slug'] ?? null);
        $description = $this->normalizeDescription($payload['description'] ?? null);
        $isActive    = isset($payload['isActive']) ? (bool) $payload['isActive'] : true;

        $this->ensureSlugAvailable($slug);

        $catalog = Catalog::create([
            'name'        => $name,
            'slug'        => $slug,
            'description' => $description,
            'is_active'   => $isActive,
        ]);

        return $catalog->fresh()->toApiArray();
    }

    public function updateCatalog(int $catalogId, array $payload): array
    {
        $current = $this->findOrFail($catalogId);
        $updates = [];

        if (array_key_exists('name', $payload)) {
            $updates['name'] = $this->validateName($payload['name']);
        }

        if (array_key_exists('description', $payload)) {
            $updates['description'] = $this->normalizeDescription($payload['description']);
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

    public function toggleCatalogActive(int $catalogId): array
    {
        $catalog = $this->findOrFail($catalogId);
        $next    = !$catalog->is_active;
        $catalog->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Catalog activated successfully' : 'Catalog deactivated successfully',
            'isActive' => $next,
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findOrFail(int $id): Catalog
    {
        $catalog = Catalog::find($id);
        if ($catalog === null) {
            throw new HttpError(404, 'Catalog not found');
        }
        return $catalog;
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

    private function ensureSlugAvailable(string $slug, ?int $excludedId = null): void
    {
        // Catalogs: findBySlug no filtra por is_active — chequea todos
        $existing = Catalog::where('slug', $slug)->first();
        if ($existing !== null && $existing->id !== $excludedId) {
            throw new HttpError(409, 'A catalog with that slug already exists');
        }
    }
}
