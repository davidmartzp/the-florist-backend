<?php
declare(strict_types=1);

namespace App\Services;

use App\Utils\HttpError;
use Illuminate\Database\Capsule\Manager as Capsule;

class CartService
{
    private readonly ProductService $products;

    public function __construct()
    {
        $this->products = new ProductService();
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    public function listComplements(bool $hasGeneral, int $limit = 5): array
    {
        if (!$hasGeneral) {
            return [];
        }

        $rows = Capsule::table('products')
            ->where('type', 'COMPLEMENT')
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->orderBy('name')
            ->limit($limit)
            ->get(['id','name','price','has_vat','vat_rate','stock','description','image','type','is_active','created_at','updated_at']);

        return $rows->map(fn($r) => $this->toComplementProduct((object) [
            'id'          => $r->id,
            'name'        => $r->name,
            'price'       => (float) $r->price,
            'type'        => $r->type ?? 'COMPLEMENT',
            'description' => $r->description,
            'image'       => $r->image,
        ]))->all();
    }

    public function validateCartItemAddition(string $productSlug, array $cartItemSlugs): array
    {
        if ($productSlug === '') {
            throw new HttpError(400, 'productSlug is required');
        }

        $product = $this->findProductBySlugExact($productSlug);

        if ($product === null) {
            throw new HttpError(404, 'Product not found');
        }

        // Producto no es complemento → se puede agregar directamente
        if ($product['type'] !== 'COMPLEMENT') {
            return $this->toComplementProduct((object) $product);
        }

        if ($product['stock'] <= 0) {
            throw new HttpError(400, 'Cannot add a complement product without available stock');
        }

        if (empty($cartItemSlugs)) {
            throw new HttpError(400, 'Cannot add a complement product without a GENERAL product in the cart');
        }

        // Verificar que al menos uno de los slugs del carrito corresponde a un GENERAL
        $hasGeneral = $this->cartHasGeneralProduct($cartItemSlugs);

        if (!$hasGeneral) {
            throw new HttpError(400, 'At least one GENERAL product must be present before adding a complement');
        }

        return $this->toComplementProduct((object) $product);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Carga todos los productos (hasta 1000) y encuentra el que tiene
     * el slug computado igual al pedido. Comportamiento idéntico al Node.
     */
    private function findProductBySlugExact(string $slug): ?array
    {
        $rows = Capsule::table('products')
            ->limit(1000)
            ->get(['id','name','price','stock','description','image','type','is_active']);

        foreach ($rows as $row) {
            if ($this->products->slugifyName($row->name) === $slug) {
                return [
                    'id'          => $row->id,
                    'name'        => $row->name,
                    'price'       => (float) $row->price,
                    'stock'       => (int) $row->stock,
                    'type'        => $row->type ?? 'GENERAL',
                    'description' => $row->description,
                    'image'       => $row->image,
                    'isActive'    => (bool) $row->is_active,
                ];
            }
        }
        return null;
    }

    private function cartHasGeneralProduct(array $cartItemSlugs): bool
    {
        $rows = Capsule::table('products')
            ->limit(1000)
            ->get(['name', 'type']);

        foreach ($rows as $row) {
            $slug = $this->products->slugifyName($row->name);
            if (in_array($slug, $cartItemSlugs, true) && $row->type === 'GENERAL') {
                return true;
            }
        }
        return false;
    }

    private function toComplementProduct(object $p): array
    {
        return [
            'id'            => $p->id,
            'slug'          => $this->products->slugifyName($p->name),
            'type'          => strtoupper((string) ($p->type ?? 'GENERAL')),
            'name'          => $p->name,
            'category'      => 'Complementos',
            'categorySlug'  => 'complementos',
            'categoryIds'   => [],
            'categorySlugs' => [],
            'price'         => $p->price,
            'badge'         => '',
            'stemCount'     => '',
            'deliveryNote'  => '',
            'description'   => $p->description ?? '',
            'image'         => $p->image ?? '/assets/default.png',
            'highlights'    => [],
        ];
    }
}
