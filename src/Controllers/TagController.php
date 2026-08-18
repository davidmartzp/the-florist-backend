<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\TagService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class TagController extends BaseController
{
    private readonly TagService $service;

    public function __construct()
    {
        $this->service = new TagService();
    }

    /** POST /api/tags */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $tag = $this->service->createTag($this->body($request->getParsedBody()));
        return $this->json($response, $tag, 201);
    }

    /** PATCH /api/tags/{tagId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        $result = $this->service->toggleTagActive((int) $args['tagId']);
        return $this->json($response, $result);
    }
}
