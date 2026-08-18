<?php
declare(strict_types=1);

namespace App\Models;

use App\Utils\Fmt;
use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    protected $table = 'shipping_methods';

    protected $fillable = ['name', 'slug', 'description', 'price', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function toApiArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'price'       => $this->price === null ? null : (float) $this->price,
            'isActive'    => (bool) $this->is_active,
            'createdAt'   => Fmt::ts($this->created_at),
            'updatedAt'   => Fmt::ts($this->updated_at),
        ];
    }
}
