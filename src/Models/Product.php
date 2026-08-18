<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'name', 'price', 'has_vat', 'vat_rate', 'stock',
        'description', 'image', 'type', 'is_active',
    ];

    protected $casts = [
        'has_vat'   => 'boolean',
        'is_active' => 'boolean',
    ];
}
