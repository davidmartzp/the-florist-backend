<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\CatalogService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CatalogController extends BaseController
{
    private readonly CatalogService $service;

    public function __construct()
    {
        $this->service = new CatalogService();
    }

    /** GET /api/catalogs */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listCatalogs($request->getQueryParams()));
    }

    /** GET /api/catalogs/{catalogId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getCatalogById((int) $args['catalogId']));
    }

    /** POST /api/catalogs */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createCatalog($this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/catalogs/{catalogId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateCatalog((int) $args['catalogId'], $this->body($request->getParsedBody())));
    }

    /** PATCH /api/catalogs/{catalogId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->toggleCatalogActive((int) $args['catalogId']));
    }
}
