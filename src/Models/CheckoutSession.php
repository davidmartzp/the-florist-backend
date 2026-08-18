<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CheckoutSession extends Model
{
    protected $table = 'checkout_sessions';

    protected $fillable = [
        'preference_id', 'external_reference', 'payload',
        'status', 'payment_reference', 'order_id', 'order_code',
    ];
}
