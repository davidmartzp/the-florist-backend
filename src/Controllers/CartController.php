<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\CartService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CartController extends BaseController
{
    private readonly CartService $service;

    public function __construct()
    {
        $this->service = new CartService();
    }

    /** GET /api/site/cart/complements?hasGeneral=1 */
    public function listComplements(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params     = $request->getQueryParams();
        $hasGeneral = ($params['hasGeneral'] ?? '') === '1' || ($params['hasGeneral'] ?? '') === 'true';

        return $this->json($response, $this->service->listComplements($hasGeneral, 5));
    }

    /** POST /api/site/cart/items */
    public function validateCartItem(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body          = $this->body($request->getParsedBody());
        $productSlug   = trim((string) ($body['productSlug'] ?? ''));
        $cartItemSlugs = is_array($body['cartItemSlugs'] ?? null) ? $body['cartItemSlugs'] : [];

        return $this->json($response, $this->service->validateCartItemAddition($productSlug, $cartItemSlugs));
    }
}
