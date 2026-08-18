<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class UserController extends BaseController
{
    private readonly UserService $service;

    public function __construct()
    {
        $this->service = new UserService();
    }

    /** GET /api/users/access-control */
    public function getAccessControlCatalog(
        ServerRequestInterface $request,
        ResponseInterface      $response
    ): ResponseInterface {
        return $this->json($response, $this->service->getAccessControlCatalog());
    }

    /** GET /api/users */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listUsers($request->getQueryParams()));
    }

    /** GET /api/users/{userId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getUserById((int) $args['userId']));
    }

    /** POST /api/users */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createUser($this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/users/{userId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateUser((int) $args['userId'], $this->body($request->getParsedBody())));
    }

    /** PATCH /api/users/{userId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $actor  = $request->getAttribute('user');
        $result = $this->service->toggleUserActive((int) $actor['id'], (int) $args['userId']);
        return $this->json($response, $result);
    }
}
