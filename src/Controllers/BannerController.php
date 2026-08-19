<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\BannerService;
use App\Utils\HttpError;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class BannerController extends BaseController
{
    private readonly BannerService $service;

    public function __construct()
    {
        $this->service = new BannerService();
    }

    /** GET /api/banners */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listBanners($request->getQueryParams()));
    }

    /** GET /api/banners/{bannerId} */
    public function get(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->getBannerById((int) $args['bannerId']));
    }

    /** POST /api/banners */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createBanner($this->body($request->getParsedBody())), 201);
    }

    /** PATCH /api/banners/{bannerId} */
    public function update(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->updateBanner((int) $args['bannerId'], $this->body($request->getParsedBody())));
    }

    /** PATCH /api/banners/{bannerId}/toggle-active */
    public function toggleActive(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->toggleBannerActive((int) $args['bannerId']));
    }

    /** POST /api/banners/{bannerId}/desktop-image */
    public function uploadDesktopImage(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->uploadBannerDesktopImage((int) $args['bannerId'], $this->requireImageFile($request)));
    }

    /** POST /api/banners/{bannerId}/mobile-image */
    public function uploadMobileImage(
        ServerRequestInterface $request,
        ResponseInterface      $response,
        array                  $args
    ): ResponseInterface {
        return $this->json($response, $this->service->uploadBannerMobileImage((int) $args['bannerId'], $this->requireImageFile($request)));
    }

    // ── Site ─────────────────────────────────────────────────────────────────

    /** GET /api/site/banners */
    public function listSite(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->listActiveBannersForSite());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function requireImageFile(ServerRequestInterface $request): UploadedFileInterface
    {
        $file = $request->getUploadedFiles()['image'] ?? null;
        if (!$file instanceof UploadedFileInterface) {
            throw new HttpError(422, 'image file is required');
        }
        return $file;
    }
}
