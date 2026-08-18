<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use App\Utils\Slugify;
use Illuminate\Database\Capsule\Manager as Capsule;

class CategoryService
{
    private const SORT_COLUMNS = [
        'name'      => 'name',
        'slug'      => 'slug',
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
    ];

    // ── CMS ──────────────────────────────────────────────────────────────────

    public function listCategories(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'   => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'   => 'name',
            'defaultSortOrder'=> 'asc',
        ]);

        $col   = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir   = strtoupper($pagination['sortOrder']);

        $base  = Category::query();
        $total = $base->count();

        $items = Category::orderByRaw("{$col} {$dir}, id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get()
            ->map(fn($c) => $c->toApiArray())
            ->all();

        return ListQuery::buildResponse($items, $total, $pagination);
    }

    public function getCategoryById(int $categoryId): array
    {
        return $this->findOrFail($categoryId)->toApiArray();
    }

    public function createCategory(array $payload): array
    {
        $name        = $this->validateName($payload['name'] ?? null);
        $slug        = $this->resolveSlug($name, $payload['slug'] ?? null);
        $description = $this->normalizeDescription($payload['description'] ?? null, false);

        $this->ensureSlugAvailable($slug);

        $category = Category::create([
            'name'        => $name,
            'slug'        => $slug,
            'description' => $description,
            'is_active'   => true,
        ]);

        return $category->fresh()->toApiArray();
    }

    public function updateCategory(int $categoryId, array $payload): array
    {
        $current = $this->findOrFail($categoryId);
        $updates = [];

        if (array_key_exists('name', $payload)) {
            $updates['name'] = $this->validateName($payload['name']);
        }

        if (array_key_exists('description', $payload)) {
            $updates['description'] = $this->normalizeDescription($payload['description'], true);
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

    public function toggleCategoryActive(int $categoryId): array
    {
        $category = $this->findOrFail($categoryId);
        $next     = !$category->is_active;
        $category->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Category activated successfully' : 'Category deactivated successfully',
            'isActive' => $next,
        ];
    }

    // ── Site ─────────────────────────────────────────────────────────────────

    public function listWithStock(): array
    {
        $rows = Capsule::table('categories as c')
            ->select('c.id', 'c.name', 'c.slug', 'c.description', 'c.is_active', 'c.created_at', 'c.updated_at')
            ->join('product_categories as pc', 'pc.category_id', '=', 'c.id')
            ->join('products as p', 'p.id', '=', 'pc.product_id')
            ->where('p.stock', '>', 0)
            ->where('c.is_active', true)
            ->where('p.is_active', true)
            ->distinct()
            ->orderBy('c.name')
            ->get();

        return $rows->map(fn($row) => [
            'id'          => $row->id,
            'name'        => $row->name,
            'slug'        => $row->slug,
            'description' => $row->description,
            'isActive'    => (bool) $row->is_active,
            'createdAt'   => $row->created_at,
            'updatedAt'   => $row->updated_at,
        ])->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findOrFail(int $id): Category
    {
        $category = Category::find($id);
        if ($category === null) {
            throw new HttpError(404, 'Category not found');
        }
        return $category;
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

    /** @param bool $alreadyPresent true cuando viene de update (distingue null explícito de ausente) */
    private function normalizeDescription(mixed $value, bool $alreadyPresent): ?string
    {
        if (!$alreadyPresent && $value === null) {
            return null;
        }
        $trimmed = trim((string) ($value ?? ''));
        return $trimmed !== '' ? $trimmed : null;
    }

    private function ensureSlugAvailable(string $slug, ?int $excludedId = null): void
    {
        $existing = Category::where('slug', $slug)->where('is_active', true)->first();
        if ($existing !== null && $existing->id !== $excludedId) {
            throw new HttpError(409, 'A category with that slug already exists');
        }
    }
}
