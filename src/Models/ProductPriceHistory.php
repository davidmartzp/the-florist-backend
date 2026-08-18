<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPriceHistory extends Model
{
    protected $table = 'product_price_history';

    public $timestamps = false;

    protected $fillable = ['product_id', 'price', 'has_vat', 'vat_rate', 'change_type'];

    protected $casts = ['has_vat' => 'boolean'];
}
