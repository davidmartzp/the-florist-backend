<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Banner;
use App\Utils\HttpError;
use App\Utils\ImageUrl;
use App\Utils\ListQuery;
use Psr\Http\Message\UploadedFileInterface;

class BannerService
{
    private const BANNERS_SUBDIR = 'uploads/banners';

    private const SORT_COLUMNS = [
        'title'     => 'title',
        'sortOrder' => 'sort_order',
        'isActive'  => 'is_active',
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
    ];

    public function listBanners(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'sortOrder',
            'defaultSortOrder' => 'asc',
        ]);

        $col   = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir   = strtoupper($pagination['sortOrder']);
        $total = Banner::count();

        $items = Banner::orderByRaw("{$col} {$dir}, id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get()
            ->map(fn($b) => $this->present($b))
            ->all();

        return ListQuery::buildResponse($items, $total, $pagination);
    }

    public function getBannerById(int $bannerId): array
    {
        return $this->present($this->findOrFail($bannerId));
    }

    public function createBanner(array $payload): array
    {
        $title     = $this->validateTitle($payload['title'] ?? null);
        $sortOrder = $this->validateSortOrder($payload['sortOrder'] ?? 0);

        $banner = Banner::create([
            'title'      => $title,
            'sort_order' => $sortOrder,
            'is_active'  => false,
        ]);

        return $this->present($banner->fresh());
    }

    public function updateBanner(int $bannerId, array $payload): array
    {
        $current = $this->findOrFail($bannerId);
        $updates = [];

        if (array_key_exists('title', $payload)) {
            $updates['title'] = $this->validateTitle($payload['title']);
        }

        if (array_key_exists('sortOrder', $payload)) {
            $updates['sort_order'] = $this->validateSortOrder($payload['sortOrder']);
        }

        if (empty($updates)) {
            throw new HttpError(400, 'No valid fields were provided for update');
        }

        $current->update($updates);

        return $this->present($current->fresh());
    }

    public function toggleBannerActive(int $bannerId): array
    {
        $banner = $this->findOrFail($bannerId);
        $next   = !$banner->is_active;
        $banner->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Banner activated successfully' : 'Banner deactivated successfully',
            'isActive' => $next,
        ];
    }

    public function uploadBannerDesktopImage(int $bannerId, UploadedFileInterface $file): array
    {
        return $this->uploadImage($bannerId, $file, 'desktop_image');
    }

    public function uploadBannerMobileImage(int $bannerId, UploadedFileInterface $file): array
    {
        return $this->uploadImage($bannerId, $file, 'mobile_image');
    }

    public function listActiveBannersForSite(): array
    {
        return Banner::where('is_active', true)
            ->orderByRaw('sort_order ASC, id ASC')
            ->get()
            ->map(fn(Banner $b) => [
                'id'           => $b->id,
                'title'        => $b->title,
                'desktopImage' => ImageUrl::resolve($b->desktop_image),
                'mobileImage'  => ImageUrl::resolve($b->mobile_image),
            ])
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function present(Banner $banner): array
    {
        $api                 = $banner->toApiArray();
        $api['desktopImage'] = ImageUrl::resolve($api['desktopImage']);
        $api['mobileImage']  = ImageUrl::resolve($api['mobileImage']);
        return $api;
    }

    private function uploadImage(int $bannerId, UploadedFileInterface $file, string $column): array
    {
        $current       = $this->findOrFail($bannerId);
        $uploadService = new UploadService();
        $url           = $uploadService->store($file, self::BANNERS_SUBDIR);
        $previousImage = $current->{$column};

        $current->update([$column => $url]);
        $uploadService->deleteIfLocal($previousImage, self::BANNERS_SUBDIR);

        return $this->present($current->fresh());
    }

    private function findOrFail(int $id): Banner
    {
        $banner = Banner::find($id);
        if ($banner === null) {
            throw new HttpError(404, 'Banner not found');
        }
        return $banner;
    }

    private function validateTitle(mixed $value): string
    {
        $normalized = trim((string) ($value ?? ''));
        if ($normalized === '') {
            throw new HttpError(400, 'title is required');
        }
        return $normalized;
    }

    private function validateSortOrder(mixed $value): int
    {
        $n = filter_var($value, FILTER_VALIDATE_INT);
        if ($n === false) {
            throw new HttpError(400, 'sortOrder must be an integer');
        }
        return $n;
    }
}
