<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\ShippingMethodService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class ShippingMethodController extends BaseController
{
    private readonly ShippingMethodService $service;

    public function __construct()
    {
        $this->service = new ShippingMethodService();
    }

    /** GET /api/shipping-methods */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listShippingMethods($request->getQueryParams()));
    }

    /** GET /api/shipping-methods/{shippingMethodId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getShippingMethodById((int) $args['shippingMethodId']));
    }

    /** POST /api/shipping-methods */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createShippingMethod($this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/shipping-methods/{shippingMethodId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateShippingMethod((int) $args['shippingMethodId'], $this->body($request->getParsedBody())));
    }

    /** PATCH /api/shipping-methods/{shippingMethodId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->toggleShippingMethodActive((int) $args['shippingMethodId']));
    }

    /** GET /api/site/shipping-methods */
    public function listSite(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listActive());
    }
}
