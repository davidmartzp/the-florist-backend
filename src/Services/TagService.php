<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Tag;
use App\Utils\HttpError;
use App\Utils\Slugify;

class TagService
{
    public function createTag(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            throw new HttpError(400, 'name is required');
        }

        $slugSource = isset($payload['slug']) ? $payload['slug'] : $name;
        $slug       = Slugify::make((string) $slugSource);
        if ($slug === '') {
            throw new HttpError(400, 'A valid slug could not be generated');
        }

        // Sólo conflicta con tags activos (igual que Node)
        $existing = Tag::where('slug', $slug)->where('is_active', true)->first();
        if ($existing !== null) {
            throw new HttpError(409, 'A tag with that slug already exists');
        }

        $tag = Tag::create(['name' => $name, 'slug' => $slug, 'is_active' => true]);

        return $tag->fresh()->toApiArray();
    }

    public function toggleTagActive(int $tagId): array
    {
        $tag = Tag::find($tagId);
        if ($tag === null) {
            throw new HttpError(404, 'Tag not found');
        }

        $next = !$tag->is_active;
        $tag->update(['is_active' => $next]);

        return [
            'message'  => $next ? 'Tag activated successfully' : 'Tag deactivated successfully',
            'isActive' => $next,
        ];
    }
}
