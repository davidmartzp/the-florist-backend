<?php
declare(strict_types=1);

namespace App\Models;

use App\Utils\Fmt;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = ['name', 'slug', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function toApiArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'isActive'    => (bool) $this->is_active,
            'createdAt'   => Fmt::ts($this->created_at),
            'updatedAt'   => Fmt::ts($this->updated_at),
        ];
    }
}
