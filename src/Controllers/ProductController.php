<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\ProductService;
use App\Utils\HttpError;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class ProductController extends BaseController
{
    private readonly ProductService $service;

    public function __construct()
    {
        $this->service = new ProductService();
    }

    /** GET /api/products */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listProductsWithFilters($request->getQueryParams()));
    }

    /** GET /api/products/{productId}/price-history */
    public function priceHistory(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->listProductPriceHistory((int) $args['productId']));
    }

    /** GET /api/products/{productId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getProductById((int) $args['productId']));
    }

    /** POST /api/products */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createProduct($this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/products/{productId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateProduct((int) $args['productId'], $this->body($request->getParsedBody())));
    }

    /** POST /api/products/{productId}/image */
    public function uploadImage(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $file = $request->getUploadedFiles()['image'] ?? null;
        if (!$file instanceof UploadedFileInterface) {
            throw new HttpError(422, 'image file is required');
        }

        return $this->json($response, $this->service->uploadProductImage((int) $args['productId'], $file));
    }

    /** PATCH /api/products/{productId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->toggleProductActive((int) $args['productId']));
    }

    // ── Site ─────────────────────────────────────────────────────────────────

    /** GET /api/site/products */
    public function listSite(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $query    = array_merge($request->getQueryParams(), ['type' => 'GENERAL', 'isActive' => 'true', 'inStock' => 'true']);
        $result   = $this->service->listProductsWithFilters($query);
        $mapped   = array_map([$this, 'toSiteProduct'], $result['items']);
        return $this->json($response, array_merge($result, ['items' => $mapped, 'total' => count($mapped)]));
    }

    /** GET /api/site/products/slug/{productSlug} */
    public function getSiteBySlug(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $product = $this->service->getProductBySlug($args['productSlug']);
        return $this->json($response, $this->toSiteProduct($product));
    }

    /** GET /api/site/products/{productId} */
    public function getSite(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $product = $this->service->getProductById((int) $args['productId']);

        if (!$product['isActive'] || $product['stock'] <= 0 || $product['type'] === 'COMPLEMENT') {
            return $this->json($response, ['error' => 'Product not found'], 404);
        }

        return $this->json($response, $this->toSiteProduct($product));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function toSiteProduct(array $product): array
    {
        $categories  = $product['categories'] ?? [];
        $first       = $categories[0] ?? null;
        $type        = strtoupper((string) ($product['type'] ?? 'GENERAL'));

        return [
            'id'           => $product['id'],
            'slug'         => $this->service->slugifyName($product['name']),
            'name'         => $product['name'],
            'type'         => $type,
            'categories'   => array_map(fn($c) => [
                'id'          => $c['id'],
                'name'        => $c['name'],
                'slug'        => $c['slug'],
                'description' => $c['description'],
            ], $categories),
            'category'     => $first ? $first['name'] : null,
            'categorySlug' => $first ? $first['slug'] : null,
            'price'        => $product['price'],
            'badge'        => null,
            'stemCount'    => null,
            'deliveryNote' => null,
            'description'  => $product['description'],
            'image'        => $product['image'],
            'highlights'   => [],
        ];
    }
}
