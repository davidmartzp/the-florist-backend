<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'code', 'user_id', 'shipping_method_id', 'shipping_name', 'shipping_price',
        'includes_shipping_price', 'customer_name', 'customer_email', 'customer_phone',
        'billing_document', 'billing_document_type', 'billing_city', 'billing_address',
        'shipping_address', 'includes_card', 'card_message', 'receiver_name', 'receiver_phone',
        'card_signature', 'delivery_date', 'subtotal', 'tax_total', 'total',
        'status', 'is_paid', 'is_active', 'payment_provider', 'payment_reference',
    ];

    protected $casts = [
        'includes_shipping_price' => 'boolean',
        'includes_card'           => 'boolean',
        'is_paid'                 => 'boolean',
        'is_active'               => 'boolean',
    ];
}
