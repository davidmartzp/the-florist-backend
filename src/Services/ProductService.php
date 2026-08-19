<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Utils\Fmt;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\UploadedFileInterface;

class ProductService
{
    private const SORT_COLUMNS = [
        'name'      => 'p.name',
        'price'     => 'p.price',
        'vatRate'   => 'p.vat_rate',
        'stock'     => 'p.stock',
        'createdAt' => 'p.created_at',
        'updatedAt' => 'p.updated_at',
    ];

    // ── CMS ──────────────────────────────────────────────────────────────────

    public function listProductsWithFilters(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'createdAt',
            'defaultSortOrder' => 'desc',
        ]);

        $filters = $this->parseFilters($query);
        $qb      = $this->buildFilterQuery($filters);

        $total   = (clone $qb)->count();
        $col     = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir     = strtoupper($pagination['sortOrder']);

        $rows = (clone $qb)
            ->select('p.id','p.name','p.price','p.has_vat','p.vat_rate',
                     'p.stock','p.description','p.image','p.type','p.is_active',
                     'p.created_at','p.updated_at')
            ->orderByRaw("{$col} {$dir}, p.id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get();

        $products = $rows->map(fn($r) => $this->mapRow($r))->all();
        $hydrated = $this->hydrateProducts($products);

        return ListQuery::buildResponse($hydrated, $total, $pagination);
    }

    public function getProductById(int $id): array
    {
        $product = Product::find($id);
        if ($product === null) {
            throw new HttpError(404, 'Product not found');
        }
        [$hydrated] = $this->hydrateProducts([$this->mapModel($product)]);
        return $hydrated;
    }

    public function getProductBySlug(string $slug): array
    {
        $product = $this->findBySlug($slug);
        if ($product === null) {
            throw new HttpError(404, 'Product not found');
        }
        [$hydrated] = $this->hydrateProducts([$product]);
        return $hydrated;
    }

    public function listProductPriceHistory(int $productId): array
    {
        if (Product::find($productId) === null) {
            throw new HttpError(404, 'Product not found');
        }

        return ProductPriceHistory::where('product_id', $productId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'productId'  => $r->product_id,
                'price'      => (float) $r->price,
                'hasVat'     => (bool) $r->has_vat,
                'vatRate'    => (float) $r->vat_rate,
                'changeType' => $r->change_type,
                'createdAt'  => Fmt::ts($r->created_at),
            ])
            ->all();
    }

    public function createProduct(array $payload): array
    {
        $name        = $this->validateName($payload['name'] ?? null);
        $price       = $this->validatePrice($payload['price'] ?? null);
        $hasVat      = isset($payload['hasVat']) ? $this->validateHasVat($payload['hasVat']) : true;
        $vatRate     = isset($payload['vatRate']) ? $this->validateVatRate($payload['vatRate']) : 19.0;
        $stock       = $this->validateStock($payload['stock'] ?? null);
        $type        = $this->validateType($payload['type'] ?? null);
        $description = $this->normalizeText($payload['description'] ?? null);
        $image       = $this->normalizeText($payload['image'] ?? null);
        $categoryIds = $this->normalizeIdArray($payload['categoryIds'] ?? [], 'categoryIds');
        $tagIds      = $this->normalizeIdArray($payload['tagIds'] ?? [], 'tagIds');
        $catalogIds  = $this->normalizeIdArray($payload['catalogIds'] ?? [], 'catalogIds');

        $this->assertIdsExist($categoryIds, 'categories', 'category');
        $this->assertIdsExist($tagIds, 'tags', 'tag');
        $this->assertIdsExist($catalogIds, 'catalogs', 'catalog');

        $productId = Capsule::transaction(function () use (
            $name, $price, $hasVat, $vatRate, $stock, $type, $description, $image,
            $categoryIds, $tagIds, $catalogIds
        ) {
            $product = Product::create([
                'name'        => $name,
                'price'       => $price,
                'has_vat'     => $hasVat,
                'vat_rate'    => $vatRate,
                'stock'       => $stock,
                'type'        => $type,
                'description' => $description,
                'image'       => $image,
                'is_active'   => true,
            ]);

            ProductPriceHistory::create([
                'product_id'  => $product->id,
                'price'       => $price,
                'has_vat'     => $hasVat,
                'vat_rate'    => $vatRate,
                'change_type' => 'created',
            ]);

            $this->replaceRelation('product_categories', 'category_id', $product->id, $categoryIds);
            $this->replaceRelation('product_tags', 'tag_id', $product->id, $tagIds);
            $this->replaceRelation('product_catalogs', 'catalog_id', $product->id, $catalogIds);

            return $product->id;
        });

        return $this->getProductById($productId);
    }

    public function updateProduct(int $productId, array $payload): array
    {
        $current = Product::find($productId);
        if ($current === null) {
            throw new HttpError(404, 'Product not found');
        }

        $updates    = [];
        $categoryIds = array_key_exists('categoryIds', $payload)
            ? $this->normalizeIdArray($payload['categoryIds'], 'categoryIds') : null;
        $tagIds      = array_key_exists('tagIds', $payload)
            ? $this->normalizeIdArray($payload['tagIds'], 'tagIds') : null;
        $catalogIds  = array_key_exists('catalogIds', $payload)
            ? $this->normalizeIdArray($payload['catalogIds'], 'catalogIds') : null;

        if (array_key_exists('name', $payload)) {
            $updates['name'] = $this->validateName($payload['name']);
        }
        if (array_key_exists('price', $payload)) {
            $updates['price'] = $this->validatePrice($payload['price']);
        }
        if (array_key_exists('hasVat', $payload)) {
            $updates['has_vat'] = $this->validateHasVat($payload['hasVat']);
        }
        if (array_key_exists('vatRate', $payload)) {
            $updates['vat_rate'] = $this->validateVatRate($payload['vatRate']);
        }
        if (array_key_exists('stock', $payload)) {
            $updates['stock'] = $this->validateStock($payload['stock']);
        }
        if (array_key_exists('description', $payload)) {
            $updates['description'] = $this->normalizeText($payload['description']);
        }
        if (array_key_exists('image', $payload)) {
            $updates['image'] = $this->normalizeText($payload['image']);
        }
        if (array_key_exists('type', $payload)) {
            $updates['type'] = $this->validateType($payload['type']);
        }

        if ($categoryIds !== null) {
            $this->assertIdsExist($categoryIds, 'categories', 'category');
        }
        if ($tagIds !== null) {
            $this->assertIdsExist($tagIds, 'tags', 'tag');
        }
        if ($catalogIds !== null) {
            $this->assertIdsExist($catalogIds, 'catalogs', 'catalog');
        }

        if (empty($updates) && $categoryIds === null && $tagIds === null && $catalogIds === null) {
            throw new HttpError(400, 'No valid fields were provided for update');
        }

        $needsSnapshot = $this->hasPricingChanges($current, $updates);

        Capsule::transaction(function () use ($current, $productId, $updates, $categoryIds, $tagIds, $catalogIds, $needsSnapshot) {
            if (!empty($updates)) {
                $current->update($updates);
            }

            if ($needsSnapshot) {
                $fresh = $current->fresh();
                ProductPriceHistory::create([
                    'product_id'  => $productId,
                    'price'       => $fresh->price,
                    'has_vat'     => $fresh->has_vat,
                    'vat_rate'    => $fresh->vat_rate,
                    'change_type' => 'updated',
                ]);
            }

            if ($categoryIds !== null) {
                $this->replaceRelation('product_categories', 'category_id', $productId, $categoryIds);
            }
            if ($tagIds !== null) {
                $this->replaceRelation('product_tags', 'tag_id', $productId, $tagIds);
            }
            if ($catalogIds !== null) {
                $this->replaceRelation('product_catalogs', 'catalog_id', $productId, $catalogIds);
            }
        });

        return $this->getProductById($productId);
    }

    public function uploadProductImage(int $productId, UploadedFileInterface $file): array
    {
        $current = Product::find($productId);
        if ($current === null) {
            throw new HttpError(404, 'Product not found');
        }

        $uploadService = new UploadService();
        $url            = $uploadService->storeProductImage($file);
        $previousImage  = $current->image;

        $current->update(['image' => $url]);
        $uploadService->deleteProductImageIfLocal($previousImage);

        return $this->getProductById($productId);
    }

    public function toggleProductActive(int $productId): array
    {
        $product = Product::find($productId);
        if ($product === null) {
            throw new HttpError(404, 'Product not found');
        }
        $next = !$product->is_active;
        $product->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Product activated successfully' : 'Product deactivated successfully',
            'isActive' => $next,
        ];
    }

    // ── Helpers: query / mapping ──────────────────────────────────────────────

    private function buildFilterQuery(array $filters): \Illuminate\Database\Query\Builder
    {
        $qb = Capsule::table('products as p');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $qb->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(p.name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(COALESCE(p.description,"")) LIKE ?', ["%{$s}%"]);
            });
        }
        if (isset($filters['minPrice'])) {
            $qb->where('p.price', '>=', $filters['minPrice']);
        }
        if (isset($filters['maxPrice'])) {
            $qb->where('p.price', '<=', $filters['maxPrice']);
        }
        if ($filters['inStock'] === true) {
            $qb->where('p.stock', '>', 0);
        } elseif ($filters['inStock'] === false) {
            $qb->where('p.stock', '=', 0);
        }
        if (isset($filters['type'])) {
            $qb->where('p.type', $filters['type']);
        }
        if (isset($filters['isActive'])) {
            $qb->where('p.is_active', $filters['isActive'] ? 1 : 0);
        }
        if (!empty($filters['categoryIds'])) {
            $ids = $filters['categoryIds'];
            $qb->whereRaw(
                'EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (' . implode(',', array_fill(0, count($ids), '?')) . '))',
                $ids
            );
        }
        if (!empty($filters['tagIds'])) {
            $ids = $filters['tagIds'];
            $qb->whereRaw(
                'EXISTS (SELECT 1 FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (' . implode(',', array_fill(0, count($ids), '?')) . '))',
                $ids
            );
        }
        if (!empty($filters['catalogIds'])) {
            $ids = $filters['catalogIds'];
            $qb->whereRaw(
                'EXISTS (SELECT 1 FROM product_catalogs pco WHERE pco.product_id = p.id AND pco.catalog_id IN (' . implode(',', array_fill(0, count($ids), '?')) . '))',
                $ids
            );
        }

        return $qb;
    }

    private function hydrateProducts(array $products): array
    {
        if (empty($products)) {
            return [];
        }

        $ids          = array_column($products, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $categories = Capsule::select(
            "SELECT pc.product_id, c.id, c.name, c.slug, c.description, c.created_at, c.updated_at
             FROM product_categories pc
             JOIN categories c ON c.id = pc.category_id
             WHERE pc.product_id IN ({$placeholders})
             ORDER BY c.name ASC",
            $ids
        );

        $tags = Capsule::select(
            "SELECT pt.product_id, t.id, t.name, t.slug, t.created_at, t.updated_at
             FROM product_tags pt
             JOIN tags t ON t.id = pt.tag_id
             WHERE pt.product_id IN ({$placeholders})
             ORDER BY t.name ASC",
            $ids
        );

        $catalogs = Capsule::select(
            "SELECT pc.product_id, c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at
             FROM product_catalogs pc
             JOIN catalogs c ON c.id = pc.catalog_id
             WHERE pc.product_id IN ({$placeholders})
             ORDER BY c.name ASC",
            $ids
        );

        $catMap     = [];
        $tagMap     = [];
        $catalogMap = [];

        foreach ($categories as $r) {
            $catMap[$r->product_id][] = [
                'id' => $r->id, 'name' => $r->name, 'slug' => $r->slug,
                'description' => $r->description,
                'createdAt' => Fmt::ts($r->created_at), 'updatedAt' => Fmt::ts($r->updated_at),
            ];
        }
        foreach ($tags as $r) {
            $tagMap[$r->product_id][] = [
                'id' => $r->id, 'name' => $r->name, 'slug' => $r->slug,
                'createdAt' => Fmt::ts($r->created_at), 'updatedAt' => Fmt::ts($r->updated_at),
            ];
        }
        foreach ($catalogs as $r) {
            $catalogMap[$r->product_id][] = [
                'id' => $r->id, 'name' => $r->name, 'slug' => $r->slug,
                'description' => $r->description, 'isActive' => (bool) $r->is_active,
                'createdAt' => Fmt::ts($r->created_at), 'updatedAt' => Fmt::ts($r->updated_at),
            ];
        }

        return array_map(fn($p) => array_merge($p, [
            'categories' => $catMap[$p['id']] ?? [],
            'tags'       => $tagMap[$p['id']] ?? [],
            'catalogs'   => $catalogMap[$p['id']] ?? [],
        ]), $products);
    }

    private function findBySlug(string $slug): ?array
    {
        if ($slug === '') {
            return null;
        }

        $parts   = explode('-', $slug);
        $pattern = '%' . implode('%', $parts) . '%';

        $rows = Capsule::table('products')
            ->whereRaw('LOWER(name) LIKE ?', [$pattern])
            ->where('is_active', true)
            ->limit(20)
            ->get(['id','name','price','has_vat','vat_rate','stock','description','image','type','is_active','created_at','updated_at']);

        foreach ($rows as $row) {
            $mapped = $this->mapRow($row);
            if ($this->slugifyName($mapped['name']) === $slug) {
                return $mapped;
            }
        }
        return null;
    }

    private function mapRow(object $row): array
    {
        return [
            'id'          => $row->id,
            'name'        => $row->name,
            'price'       => (float) $row->price,
            'hasVat'      => (bool) $row->has_vat,
            'vatRate'     => (float) $row->vat_rate,
            'stock'       => (int) $row->stock,
            'description' => $row->description,
            'image'       => $row->image,
            'type'        => $row->type ?? 'GENERAL',
            'isActive'    => (bool) $row->is_active,
            'createdAt'   => Fmt::ts($row->created_at),
            'updatedAt'   => Fmt::ts($row->updated_at),
        ];
    }

    private function mapModel(Product $p): array
    {
        return [
            'id'          => $p->id,
            'name'        => $p->name,
            'price'       => (float) $p->price,
            'hasVat'      => (bool) $p->has_vat,
            'vatRate'     => (float) $p->vat_rate,
            'stock'       => (int) $p->stock,
            'description' => $p->description,
            'image'       => $p->image,
            'type'        => $p->type ?? 'GENERAL',
            'isActive'    => (bool) $p->is_active,
            'createdAt'   => Fmt::ts($p->created_at),
            'updatedAt'   => Fmt::ts($p->updated_at),
        ];
    }

    public function slugifyName(string $name): string
    {
        return preg_replace(['/[^a-z0-9]+/', '/^-|-$/'], ['-', ''], strtolower($name));
    }

    // ── Helpers: validation ───────────────────────────────────────────────────

    private function parseFilters(array $query): array
    {
        $isActive = null;
        if (isset($query['isActive'])) {
            $v = $query['isActive'];
            $isActive = ($v !== 'false' && $v !== false && $v !== 0 && $v !== '0');
        }

        $minPrice = isset($query['minPrice']) ? $this->normalizeFilterNumber($query['minPrice'], 'minPrice') : null;
        $maxPrice = isset($query['maxPrice']) ? $this->normalizeFilterNumber($query['maxPrice'], 'maxPrice') : null;

        if ($minPrice !== null && $maxPrice !== null && $minPrice > $maxPrice) {
            throw new HttpError(400, 'minPrice cannot be greater than maxPrice');
        }

        $inStock = null;
        if (isset($query['inStock'])) {
            $v = $query['inStock'];
            if ($v === true || $v === 'true' || $v === '1' || $v === 1) {
                $inStock = true;
            } elseif ($v === false || $v === 'false' || $v === '0' || $v === 0) {
                $inStock = false;
            } else {
                throw new HttpError(400, 'inStock must be true, false, 1, or 0');
            }
        }

        $type = null;
        if (isset($query['type'])) {
            $type = $this->validateType($query['type']);
        }

        return [
            'search'      => isset($query['q']) ? (strtolower(trim($query['q'])) ?: null) : null,
            'minPrice'    => $minPrice,
            'maxPrice'    => $maxPrice,
            'inStock'     => $inStock,
            'isActive'    => $isActive,
            'type'        => $type,
            'categoryIds' => isset($query['categoryIds']) ? $this->normalizeFilterIdList($query['categoryIds'], 'categoryIds') : [],
            'tagIds'      => isset($query['tagIds'])      ? $this->normalizeFilterIdList($query['tagIds'], 'tagIds')           : [],
            'catalogIds'  => isset($query['catalogIds'])  ? $this->normalizeFilterIdList($query['catalogIds'], 'catalogIds')   : [],
        ];
    }

    private function validateName(mixed $value): string
    {
        $v = trim((string) ($value ?? ''));
        if ($v === '') throw new HttpError(400, 'name is required');
        return $v;
    }

    private function validatePrice(mixed $value): float
    {
        $n = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($n === false || !is_finite($n) || $n <= 0) {
            throw new HttpError(400, 'price must be a number greater than 0');
        }
        return $n;
    }

    private function validateStock(mixed $value): int
    {
        $n = filter_var($value, FILTER_VALIDATE_INT);
        if ($n === false || $n < 0) {
            throw new HttpError(400, 'stock must be an integer greater than or equal to 0');
        }
        return $n;
    }

    private function validateHasVat(mixed $value): bool
    {
        if (is_bool($value)) return $value;
        if (in_array($value, [1, '1', 'true'], true))  return true;
        if (in_array($value, [0, '0', 'false'], true)) return false;
        throw new HttpError(400, 'hasVat must be true or false');
    }

    private function validateVatRate(mixed $value): float
    {
        $n = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($n === false || !is_finite($n) || $n < 0 || $n > 100) {
            throw new HttpError(400, 'vatRate must be a number between 0 and 100');
        }
        return round($n, 2);
    }

    private function validateType(mixed $value): string
    {
        if ($value === null || $value === '') return 'GENERAL';
        $v = strtoupper(trim((string) $value));
        if (!in_array($v, ['GENERAL', 'COMPLEMENT', 'MEMBERSHIP'], true)) {
            throw new HttpError(400, 'type must be GENERAL, COMPLEMENT, or MEMBERSHIP');
        }
        return $v;
    }

    private function normalizeText(mixed $value): ?string
    {
        if ($value === null) return null;
        $v = trim((string) $value);
        return $v !== '' ? $v : null;
    }

    private function normalizeIdArray(mixed $value, string $field): array
    {
        if (!is_array($value)) {
            throw new HttpError(400, "{$field} must be an array");
        }
        $ids = array_map('intval', $value);
        $invalid = array_filter($ids, fn($id) => $id <= 0);
        if (!empty($invalid)) {
            throw new HttpError(400, "{$field} must contain only positive integer ids");
        }
        return array_values(array_unique($ids));
    }

    private function normalizeFilterIdList(mixed $value, string $field): array
    {
        $raw  = is_array($value) ? $value : explode(',', (string) $value);
        $ids  = array_map(fn($v) => (int) trim((string) $v), $raw);
        $invalid = array_filter($ids, fn($id) => $id <= 0);
        if (!empty($invalid)) {
            throw new HttpError(400, "{$field} must contain only positive integer ids");
        }
        return array_values(array_unique($ids));
    }

    private function normalizeFilterNumber(mixed $value, string $field): float
    {
        $n = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($n === false || !is_finite($n) || $n < 0) {
            throw new HttpError(400, "{$field} must be a number greater than or equal to 0");
        }
        return $n;
    }

    private function assertIdsExist(array $ids, string $table, string $entity): void
    {
        if (empty($ids)) return;
        $found   = Capsule::table($table)->whereIn('id', $ids)->pluck('id')->all();
        $missing = array_diff($ids, $found);
        if (!empty($missing)) {
            throw new HttpError(400, "Unknown {$entity} ids: " . implode(', ', $missing));
        }
    }

    private function hasPricingChanges(Product $current, array $updates): bool
    {
        $priceChanged   = isset($updates['price'])    && (float) $updates['price']    !== (float) $current->price;
        $hasVatChanged  = isset($updates['has_vat'])  && (bool)  $updates['has_vat']  !== (bool)  $current->has_vat;
        $vatRateChanged = isset($updates['vat_rate']) && (float) $updates['vat_rate'] !== (float) $current->vat_rate;
        return $priceChanged || $hasVatChanged || $vatRateChanged;
    }

    private function replaceRelation(string $table, string $fkColumn, int $productId, array $relatedIds): void
    {
        Capsule::table($table)->where('product_id', $productId)->delete();
        if (empty($relatedIds)) return;
        $rows = array_map(fn($id) => ['product_id' => $productId, $fkColumn => $id], $relatedIds);
        Capsule::table($table)->insert($rows);
    }
}
