<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\CategoryService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CategoryController extends BaseController
{
    private readonly CategoryService $service;

    public function __construct()
    {
        $this->service = new CategoryService();
    }

    /** GET /api/categories */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $result = $this->service->listCategories($request->getQueryParams());
        return $this->json($response, $result);
    }

    /** GET /api/categories/{categoryId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $result = $this->service->getCategoryById((int) $args['categoryId']);
        return $this->json($response, $result);
    }

    /** POST /api/categories */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $result = $this->service->createCategory($this->body($request->getParsedBody()));
        return $this->json($response, $result, 201);
    }

    /** PATCH /api/categories/{categoryId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $result = $this->service->updateCategory((int) $args['categoryId'], $this->body($request->getParsedBody()));
        return $this->json($response, $result);
    }

    /** PATCH /api/categories/{categoryId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $result = $this->service->toggleCategoryActive((int) $args['categoryId']);
        return $this->json($response, $result);
    }

    /** GET /api/site/categories */
    public function listSite(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $result = $this->service->listWithStock();
        return $this->json($response, $result);
    }
}
