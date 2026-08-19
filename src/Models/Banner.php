<?php
declare(strict_types=1);

namespace App\Models;

use App\Utils\Fmt;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $table = 'banners';

    protected $fillable = ['title', 'desktop_image', 'mobile_image', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function toApiArray(): array
    {
        return [
            'id'            => $this->id,
            'title'         => $this->title,
            'desktopImage'  => $this->desktop_image,
            'mobileImage'   => $this->mobile_image,
            'sortOrder'     => (int) $this->sort_order,
            'isActive'      => (bool) $this->is_active,
            'createdAt'     => Fmt::ts($this->created_at),
            'updatedAt'     => Fmt::ts($this->updated_at),
        ];
    }
}
