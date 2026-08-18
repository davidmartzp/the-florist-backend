<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\OrderService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class OrderController extends BaseController
{
    private readonly OrderService $service;

    public function __construct()
    {
        $this->service = new OrderService();
    }

    /** GET /api/orders */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listOrders($request->getQueryParams()));
    }

    /** GET /api/orders/export */
    public function export(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->exportOrders($request->getQueryParams()));
    }

    /** GET /api/orders/{orderId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getOrderById((int) $args['orderId']));
    }

    /** POST /api/orders */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');
        return $this->json($response, $this->service->createOrder((int) $user['id'], $this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/orders/{orderId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateOrder((int) $args['orderId'], $this->body($request->getParsedBody())));
    }

    /** PATCH /api/orders/{orderId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->toggleOrderActive((int) $args['orderId']));
    }
}
