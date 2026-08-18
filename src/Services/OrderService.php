<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Order;
use App\Utils\Fmt;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use Illuminate\Database\Capsule\Manager as Capsule;

class OrderService
{
    private const ORDER_STATUSES          = ['pending', 'confirmed', 'completed', 'cancelled'];
    private const BILLING_DOCUMENT_TYPES  = ['CC', 'CE', 'NIT', 'PASAPORTE'];
    private const PAYMENT_PROVIDERS       = ['tienda', 'whatsapp', 'otros', 'mercadopago'];
    private const MONTHS_ES               = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

    private const SORT_COLUMNS = [
        'code'          => 'o.code',
        'createdAt'     => 'o.created_at',
        'updatedAt'     => 'o.updated_at',
        'subtotal'      => 'o.subtotal',
        'taxTotal'      => 'o.tax_total',
        'total'         => 'o.total',
        'shippingPrice' => 'o.shipping_price',
        'status'        => 'o.status',
    ];

    // ── Public API ────────────────────────────────────────────────────────────

    public function listOrders(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'code',
            'defaultSortOrder' => 'desc',
        ]);

        [$items, $total] = $this->queryOrders($query, $pagination);
        $hydrated = $this->hydrateOrders($items);
        return ListQuery::buildResponse($hydrated, $total, $pagination);
    }

    public function getOrderById(int $orderId): array
    {
        $order = $this->findRawById($orderId);
        if ($order === null) {
            throw new HttpError(404, 'Order not found');
        }
        [$hydrated] = $this->hydrateOrders([$order]);
        return $hydrated;
    }

    public function createOrder(int $actorUserId, array $payload): array
    {
        $userId = $this->resolveUserId($payload, $actorUserId);
        $status = $this->normalizeOrderStatus($payload['status'] ?? null, 'pending');
        $isPaid = isset($payload['isPaid']) ? $this->normalizeBoolean($payload['isPaid'], 'isPaid') : false;

        if ($isPaid && $status === 'pending') {
            throw new HttpError(400, 'Una orden pendiente no puede estar marcada como pagada');
        }

        if ($status === 'completed' && !$isPaid) {
            throw new HttpError(400, 'Una orden no pagada no puede crearse con estado completado');
        }

        $orderDate     = isset($payload['orderDate']) ? substr((string) $payload['orderDate'], 0, 10) : null;
        $normalizedItems = $this->normalizeOrderItems($payload['items'] ?? null);
        $this->ensureUniqueProductIds($normalizedItems);

        return Capsule::transaction(function () use ($userId, $payload, $status, $isPaid, $orderDate, $normalizedItems) {
            $user             = $this->assertUserExists($userId);
            $customerSnapshot = $this->resolveCustomerSnapshot($payload, $user);
            $shipping         = $this->resolveShippingConfiguration($payload);

            $productIds  = array_column($normalizedItems, 'productId');
            $productsById = $this->lockProducts($productIds);
            $stockById    = [];

            foreach ($productsById as $pid => $prod) {
                $stockById[$pid] = $prod['stock'];
            }

            foreach ($normalizedItems as $item) {
                $available = $stockById[$item['productId']];
                if ($available < $item['quantity']) {
                    throw new HttpError(409, "Not enough stock for product {$item['productId']}");
                }
                $stockById[$item['productId']] = $available - $item['quantity'];
            }

            $totals  = $this->buildItemsAndTotals($normalizedItems, $productsById, $shipping);
            $code    = $this->generateOrderCode($orderDate);

            $paymentProvider = $this->normalizePaymentProvider(
                $payload['paymentProvider'] ?? null,
                isset($payload['paymentReference']) && $payload['paymentReference'] ? 'mercadopago' : null
            );
            $createdAt = $orderDate ? "{$orderDate} 00:00:00" : null;

            $order = Order::create([
                'code'                   => $code,
                'user_id'                => $userId,
                'shipping_method_id'     => $shipping['shippingMethodId'],
                'shipping_name'          => $shipping['shippingName'],
                'shipping_price'         => $totals['shippingPrice'],
                'includes_shipping_price' => $shipping['includesShippingPrice'],
                'customer_name'          => $customerSnapshot['customerName'],
                'customer_email'         => $customerSnapshot['customerEmail'],
                'customer_phone'         => $customerSnapshot['customerPhone'],
                'billing_document'       => $customerSnapshot['billingDocument'],
                'billing_document_type'  => $customerSnapshot['billingDocumentType'],
                'billing_city'           => $customerSnapshot['billingCity'],
                'billing_address'        => $customerSnapshot['billingAddress'],
                'shipping_address'       => $customerSnapshot['shippingAddress'],
                'includes_card'          => $customerSnapshot['includesCard'],
                'card_message'           => $customerSnapshot['cardMessage'],
                'receiver_name'          => $customerSnapshot['receiverName'],
                'receiver_phone'         => $customerSnapshot['receiverPhone'],
                'card_signature'         => $customerSnapshot['cardSignature'],
                'delivery_date'          => $customerSnapshot['deliveryDate'],
                'subtotal'               => $totals['subtotal'],
                'tax_total'              => $totals['taxTotal'],
                'total'                  => $totals['total'],
                'status'                 => $status,
                'is_paid'                => $isPaid,
                'payment_provider'       => $paymentProvider,
                'payment_reference'      => $payload['paymentReference'] ?? null,
                'created_at'             => $createdAt ?? \Carbon\Carbon::now()->toDateTimeString(),
            ]);

            if ($createdAt !== null) {
                Capsule::table('orders')->where('id', $order->id)->update(['created_at' => $createdAt]);
            }

            $this->replaceItems($order->id, $totals['items']);
            $this->persistStocks($stockById);

            return $this->getOrderById($order->id);
        });
    }

    public function updateOrder(int $orderId, array $payload): array
    {
        return Capsule::transaction(function () use ($orderId, $payload) {
            $existingOrder = $this->getExistingOrderForMutation($orderId);

            // Completed order restrictions
            if ($existingOrder['status'] === 'completed') {
                $hasShipping = ($existingOrder['shipping']['price'] ?? 0) > 0;
                $restricted  = [
                    'userId', 'customerName', 'customerEmail', 'customerPhone',
                    'billingDocument', 'billingDocumentType', 'billingCity', 'billingAddress',
                    'shippingMethodId', 'includeShippingPrice', 'shippingPrice',
                    'items', 'deliveryDate', 'cardMessage', 'cardSignature', 'includesCard',
                    'status', 'isPaid', 'paymentProvider',
                ];
                if (!$hasShipping) {
                    $restricted = array_merge($restricted, ['receiverName', 'receiverPhone', 'shippingAddress']);
                }
                $violations = array_filter($restricted, fn($f) => array_key_exists($f, $payload));
                if (!empty($violations)) {
                    throw new HttpError(400, $hasShipping
                        ? 'Una orden completada solo permite actualizar receptor y dirección de envío'
                        : 'Una orden completada no puede modificarse');
                }
            }

            // MercadoPago restrictions
            if ($existingOrder['paymentProvider'] === 'mercadopago') {
                $restrictedFields = [
                    'userId', 'customerName', 'customerEmail', 'customerPhone',
                    'billingDocument', 'billingCity', 'billingAddress', 'shippingAddress',
                    'shippingMethodId', 'includeShippingPrice', 'shippingPrice', 'items',
                    'receiverName', 'receiverPhone', 'deliveryDate', 'paymentProvider',
                ];
                $violations = array_filter($restrictedFields, fn($f) => array_key_exists($f, $payload));
                if (!empty($violations)) {
                    throw new HttpError(400, 'Las órdenes pagadas con MercadoPago solo permiten actualizar el estado y la tarjeta del pedido');
                }
            }

            $nextUserId = array_key_exists('userId', $payload)
                ? ($payload['userId'] === null ? null : $this->normalizePositiveInt($payload['userId'], 'userId'))
                : $existingOrder['userId'];
            $nextStatus  = isset($payload['status'])
                ? $this->normalizeOrderStatus($payload['status'])
                : $existingOrder['status'];
            $nextIsPaid  = isset($payload['isPaid'])
                ? $this->normalizeBoolean($payload['isPaid'], 'isPaid')
                : $existingOrder['isPaid'];
            $nextPaymentProvider = $this->normalizePaymentProvider(
                $payload['paymentProvider'] ?? null,
                $existingOrder['paymentProvider']
            );

            if ($existingOrder['paymentProvider'] === 'mercadopago' && $nextIsPaid === false) {
                throw new HttpError(400, 'Una orden pagada con MercadoPago no puede marcarse como no pagada');
            }

            if ($existingOrder['status'] !== 'pending' && $nextStatus === 'pending') {
                throw new HttpError(400, 'Una orden confirmada no puede volver a estado pendiente');
            }

            if ($nextIsPaid && $nextStatus === 'pending') {
                throw new HttpError(400, 'Una orden pendiente no puede estar marcada como pagada');
            }

            if ($nextStatus === 'completed' && !$nextIsPaid) {
                throw new HttpError(400, 'Una orden no pagada no puede cambiar a estado completado');
            }

            $nextItems = isset($payload['items'])
                ? $this->normalizeOrderItems($payload['items'])
                : array_map(fn($i) => ['productId' => $i['productId'], 'quantity' => $i['quantity']], $existingOrder['items']);
            $this->ensureUniqueProductIds($nextItems);

            $user             = $this->assertUserExists($nextUserId);
            $customerSnapshot = $this->resolveCustomerSnapshot($payload, $user, $existingOrder);
            $shipping         = $this->resolveShippingConfiguration($payload, $existingOrder);

            $affectedProductIds = array_values(array_unique(array_merge(
                array_column($existingOrder['items'], 'productId'),
                array_column($nextItems, 'productId')
            )));
            $productsById = $affectedProductIds ? $this->lockProducts($affectedProductIds) : [];
            $stockById    = [];

            foreach ($productsById as $pid => $prod) {
                $stockById[$pid] = $prod['stock'];
            }
            // Return old stock
            foreach ($existingOrder['items'] as $item) {
                $stockById[$item['productId']] = ($stockById[$item['productId']] ?? 0) + $item['quantity'];
            }
            // Deduct new stock
            foreach ($nextItems as $item) {
                $available = $stockById[$item['productId']] ?? 0;
                if ($available < $item['quantity']) {
                    throw new HttpError(409, "Not enough stock for product {$item['productId']}");
                }
                $stockById[$item['productId']] = $available - $item['quantity'];
            }

            $totals = $this->buildItemsAndTotals($nextItems, $productsById, $shipping);

            Capsule::table('orders')->where('id', $orderId)->update([
                'user_id'                => $nextUserId,
                'shipping_method_id'     => $shipping['shippingMethodId'],
                'shipping_name'          => $shipping['shippingName'],
                'shipping_price'         => $totals['shippingPrice'],
                'includes_shipping_price' => $shipping['includesShippingPrice'] ? 1 : 0,
                'customer_name'          => $customerSnapshot['customerName'],
                'customer_email'         => $customerSnapshot['customerEmail'],
                'customer_phone'         => $customerSnapshot['customerPhone'],
                'billing_document'       => $customerSnapshot['billingDocument'],
                'billing_document_type'  => $customerSnapshot['billingDocumentType'],
                'billing_city'           => $customerSnapshot['billingCity'],
                'billing_address'        => $customerSnapshot['billingAddress'],
                'shipping_address'       => $customerSnapshot['shippingAddress'],
                'includes_card'          => $customerSnapshot['includesCard'] ? 1 : 0,
                'card_message'           => $customerSnapshot['cardMessage'],
                'receiver_name'          => $customerSnapshot['receiverName'],
                'receiver_phone'         => $customerSnapshot['receiverPhone'],
                'card_signature'         => $customerSnapshot['cardSignature'],
                'delivery_date'          => $customerSnapshot['deliveryDate'],
                'subtotal'               => $totals['subtotal'],
                'tax_total'              => $totals['taxTotal'],
                'total'                  => $totals['total'],
                'status'                 => $nextStatus,
                'is_paid'                => $nextIsPaid ? 1 : 0,
                'payment_provider'       => $nextPaymentProvider,
                'updated_at'             => \Carbon\Carbon::now()->toDateTimeString(),
            ]);

            $this->replaceItems($orderId, $totals['items']);
            $this->persistStocks($stockById);

            return $this->getOrderById($orderId);
        });
    }

    public function exportOrders(array $query): array
    {
        $filters = [
            'pageSize'        => 100000,
            'offset'          => 0,
            'sortBy'          => $query['sortBy'] ?? 'createdAt',
            'sortOrder'       => $query['sortOrder'] ?? 'desc',
            'status'          => isset($query['status']) ? $this->normalizeOrderStatus($query['status']) : null,
            'isPaid'          => isset($query['isPaid']) ? ($query['isPaid'] === 'true' ? true : ($query['isPaid'] === 'false' ? false : null)) : null,
            'deliveryDateFrom' => isset($query['deliveryDateFrom']) ? substr((string) $query['deliveryDateFrom'], 0, 10) : null,
            'deliveryDateTo'   => isset($query['deliveryDateTo'])   ? substr((string) $query['deliveryDateTo'],   0, 10) : null,
            'orderDateFrom'    => isset($query['orderDateFrom'])    ? substr((string) $query['orderDateFrom'],    0, 10) : null,
            'orderDateTo'      => isset($query['orderDateTo'])      ? substr((string) $query['orderDateTo'],      0, 10) : null,
        ];

        [$items] = $this->queryOrders($query, $filters);
        return $this->hydrateOrders($items);
    }

    public function toggleOrderActive(int $orderId): array
    {
        $order = Order::find($orderId);
        if ($order === null) {
            throw new HttpError(404, 'Order not found');
        }
        $next = !$order->is_active;
        $order->is_active = $next;
        $order->save();
        return [
            'message'  => $next ? 'Order activated successfully' : 'Order deactivated successfully',
            'isActive' => $next,
        ];
    }

    // ── Query / Hydration ─────────────────────────────────────────────────────

    private function queryOrders(array $query, array $filters): array
    {
        $sortCol = self::SORT_COLUMNS[$filters['sortBy'] ?? 'createdAt'] ?? 'o.created_at';
        $sortDir = strtoupper($filters['sortOrder'] ?? 'desc') === 'ASC' ? 'ASC' : 'DESC';

        $where  = ['o.is_active = 1'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]  = 'o.status = ?';
            $params[] = $filters['status'];
        }

        if (isset($filters['isPaid']) && $filters['isPaid'] !== null) {
            $where[]  = 'o.is_paid = ?';
            $params[] = $filters['isPaid'] ? 1 : 0;
        }

        if (!empty($filters['userId'])) {
            $where[]  = 'o.user_id = ?';
            $params[] = (int) $filters['userId'];
        } elseif (isset($query['userId'])) {
            $uid = $this->normalizePositiveInt($query['userId'], 'userId');
            $where[]  = 'o.user_id = ?';
            $params[] = $uid;
        }

        if (!empty($filters['shippingMethodId'])) {
            $where[]  = 'o.shipping_method_id = ?';
            $params[] = (int) $filters['shippingMethodId'];
        } elseif (isset($query['shippingMethodId'])) {
            $smid = $this->normalizePositiveInt($query['shippingMethodId'], 'shippingMethodId');
            $where[]  = 'o.shipping_method_id = ?';
            $params[] = $smid;
        }

        if (!empty($filters['deliveryDateFrom'])) {
            $where[]  = 'o.delivery_date >= ?';
            $params[] = $filters['deliveryDateFrom'];
        }

        if (!empty($filters['deliveryDateTo'])) {
            $where[]  = 'o.delivery_date <= ?';
            $params[] = $filters['deliveryDateTo'];
        }

        if (!empty($filters['orderDateFrom'])) {
            $where[]  = 'DATE(o.created_at) >= ?';
            $params[] = $filters['orderDateFrom'];
        }

        if (!empty($filters['orderDateTo'])) {
            $where[]  = 'DATE(o.created_at) <= ?';
            $params[] = $filters['orderDateTo'];
        }

        $whereSql = 'WHERE ' . implode(' AND ', $where);
        $limit    = (int) ($filters['pageSize'] ?? 20);
        $offset   = (int) ($filters['offset']   ?? 0);

        $countRow = Capsule::selectOne(
            "SELECT COUNT(*) AS total FROM orders o {$whereSql}",
            $params
        );
        $total = (int) $countRow->total;

        $rows = Capsule::select(
            "SELECT o.id, o.code, o.user_id, o.shipping_method_id, o.shipping_name, o.shipping_price,
                    o.includes_shipping_price, o.customer_name, o.customer_email, o.customer_phone,
                    o.billing_document, o.billing_document_type, o.billing_city, o.billing_address,
                    o.shipping_address, o.includes_card, o.card_message,
                    o.receiver_name, o.receiver_phone, o.card_signature, o.delivery_date,
                    o.subtotal, o.tax_total, o.total, o.status, o.is_paid, o.is_active,
                    o.payment_provider, o.payment_reference, o.created_at, o.updated_at
             FROM orders o {$whereSql}
             ORDER BY {$sortCol} {$sortDir}, o.id DESC
             LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $items = array_map(fn($r) => $this->mapRow($r), $rows);
        return [$items, $total];
    }

    private function hydrateOrders(array $orders): array
    {
        if (empty($orders)) {
            return [];
        }

        $orderIds = array_column($orders, 'id');
        $userIds  = array_values(array_unique(array_filter(array_column($orders, 'userId'))));

        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemRows = Capsule::select(
            "SELECT id, order_id, product_id, product_name, quantity, unit_price,
                    has_vat, vat_rate, subtotal, tax_total, total, created_at
             FROM order_items
             WHERE order_id IN ({$placeholders})
             ORDER BY order_id ASC, id ASC",
            $orderIds
        );

        $itemsByOrderId = [];
        foreach ($itemRows as $row) {
            $itemsByOrderId[$row->order_id][] = [
                'id'          => $row->id,
                'productId'   => $row->product_id,
                'productName' => $row->product_name,
                'quantity'    => (int) $row->quantity,
                'unitPrice'   => (float) $row->unit_price,
                'hasVat'      => (bool) $row->has_vat,
                'vatRate'     => (float) $row->vat_rate,
                'subtotal'    => (float) $row->subtotal,
                'taxTotal'    => (float) $row->tax_total,
                'total'       => (float) $row->total,
                'createdAt'   => Fmt::ts($row->created_at),
            ];
        }

        $usersById = [];
        if (!empty($userIds)) {
            $uph   = implode(',', array_fill(0, count($userIds), '?'));
            $users = Capsule::select(
                "SELECT id, email, first_name, last_name, is_active FROM users WHERE id IN ({$uph})",
                $userIds
            );
            foreach ($users as $u) {
                $usersById[$u->id] = [
                    'id'        => $u->id,
                    'email'     => $u->email,
                    'firstName' => $u->first_name,
                    'lastName'  => $u->last_name,
                    'isActive'  => (bool) $u->is_active,
                ];
            }
        }

        return array_map(function ($order) use ($itemsByOrderId, $usersById) {
            $hasShipping = $order['shippingMethodId'] !== null || $order['shippingName'] !== null || $order['shippingPrice'] !== null;
            return [
                'id'                  => $order['id'],
                'code'                => $order['code'],
                'userId'              => $order['userId'],
                'user'                => $usersById[$order['userId']] ?? null,
                'customerName'        => $order['customerName'],
                'customerEmail'       => $order['customerEmail'],
                'customerPhone'       => $order['customerPhone'],
                'billingDocument'     => $order['billingDocument'],
                'billingDocumentType' => $order['billingDocumentType'],
                'billingCity'         => $order['billingCity'],
                'billingAddress'      => $order['billingAddress'],
                'shippingAddress'     => $order['shippingAddress'],
                'includesCard'        => $order['includesCard'],
                'cardMessage'         => $order['cardMessage'],
                'receiverName'        => $order['receiverName'],
                'receiverPhone'       => $order['receiverPhone'],
                'cardSignature'       => $order['cardSignature'],
                'deliveryDate'        => $order['deliveryDate'],
                'shipping'            => $hasShipping ? [
                    'shippingMethodId' => $order['shippingMethodId'],
                    'name'             => $order['shippingName'],
                    'price'            => $order['shippingPrice'],
                    'includesPrice'    => $order['includesShippingPrice'],
                    'appliedPrice'     => $order['includesShippingPrice'] ? $order['shippingPrice'] : 0,
                ] : null,
                'subtotal'            => $order['subtotal'],
                'taxTotal'            => $order['taxTotal'],
                'total'               => $order['total'],
                'status'              => $order['status'],
                'isPaid'              => $order['isPaid'],
                'paymentProvider'     => $order['paymentProvider'],
                'paymentReference'    => $order['paymentReference'],
                'createdAt'           => $order['createdAt'],
                'updatedAt'           => $order['updatedAt'],
                'items'               => $itemsByOrderId[$order['id']] ?? [],
            ];
        }, $orders);
    }

    private function findRawById(int $id): ?array
    {
        $row = Capsule::selectOne(
            'SELECT id, code, user_id, shipping_method_id, shipping_name, shipping_price,
                    includes_shipping_price, customer_name, customer_email, customer_phone,
                    billing_document, billing_document_type, billing_city, billing_address,
                    shipping_address, includes_card, card_message,
                    receiver_name, receiver_phone, card_signature, delivery_date,
                    subtotal, tax_total, total, status, is_paid, is_active,
                    payment_provider, payment_reference, created_at, updated_at
             FROM orders WHERE id = ? LIMIT 1',
            [$id]
        );
        return $row ? $this->mapRow($row) : null;
    }

    private function getExistingOrderForMutation(int $orderId): array
    {
        $row = Capsule::selectOne(
            'SELECT id, code, user_id, shipping_method_id, shipping_name, shipping_price,
                    includes_shipping_price, customer_name, customer_email, customer_phone,
                    billing_document, billing_document_type, billing_city, billing_address,
                    shipping_address, includes_card, card_message,
                    receiver_name, receiver_phone, card_signature, delivery_date,
                    subtotal, tax_total, total, status, is_paid, is_active,
                    payment_provider, payment_reference, created_at, updated_at
             FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
            [$orderId]
        );

        if ($row === null) {
            throw new HttpError(404, 'Order not found');
        }

        [$hydrated] = $this->hydrateOrders([$this->mapRow($row)]);
        return $hydrated;
    }

    // ── Order code generation ─────────────────────────────────────────────────

    private function generateOrderCode(?string $orderDate): string
    {
        if ($orderDate) {
            [$y, $m, $d] = explode('-', substr($orderDate, 0, 10));
            $year  = $y;
            $month = self::MONTHS_ES[(int) $m - 1];
            $day   = str_pad($d, 2, '0', STR_PAD_LEFT);
        } else {
            $now   = new \DateTime('now', new \DateTimeZone('America/Bogota'));
            $year  = $now->format('Y');
            $month = self::MONTHS_ES[(int) $now->format('n') - 1];
            $day   = $now->format('d');
        }

        $prefix = "{$month}{$year}{$day}";

        $row = Capsule::selectOne(
            "SELECT COALESCE(MAX(CAST(SUBSTR(code, 10) AS UNSIGNED)), 0) AS max_counter
             FROM orders WHERE code LIKE ? FOR UPDATE",
            ["{$prefix}%"]
        );

        $counter = str_pad((string) ((int) $row->max_counter + 1), 4, '0', STR_PAD_LEFT);
        return "{$prefix}{$counter}";
    }

    // ── Stock helpers ─────────────────────────────────────────────────────────

    /** @return array<int, array{id:int,stock:int,price:float,hasVat:bool,vatRate:float,name:string}> */
    private function lockProducts(array $productIds): array
    {
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $rows = Capsule::select(
            "SELECT id, name, price, has_vat, vat_rate, stock FROM products WHERE id IN ({$placeholders}) FOR UPDATE",
            $productIds
        );

        $byId = [];
        foreach ($rows as $r) {
            $byId[$r->id] = [
                'id'     => $r->id,
                'name'   => $r->name,
                'price'  => (float) $r->price,
                'hasVat' => (bool) $r->has_vat,
                'vatRate' => (float) $r->vat_rate,
                'stock'  => (int) $r->stock,
            ];
        }

        $missing = array_diff($productIds, array_keys($byId));
        if (!empty($missing)) {
            throw new HttpError(400, 'Unknown product ids: ' . implode(', ', $missing));
        }

        return $byId;
    }

    private function persistStocks(array $stockById): void
    {
        foreach ($stockById as $productId => $stock) {
            Capsule::table('products')->where('id', $productId)->update(['stock' => $stock]);
        }
    }

    private function replaceItems(int $orderId, array $items): void
    {
        Capsule::table('order_items')->where('order_id', $orderId)->delete();

        if (empty($items)) {
            return;
        }

        $rows = array_map(fn($item) => [
            'order_id'     => $orderId,
            'product_id'   => $item['productId'],
            'product_name' => $item['productName'],
            'quantity'     => $item['quantity'],
            'unit_price'   => $item['unitPrice'],
            'has_vat'      => $item['hasVat'] ? 1 : 0,
            'vat_rate'     => $item['vatRate'],
            'subtotal'     => $item['subtotal'],
            'tax_total'    => $item['taxTotal'],
            'total'        => $item['total'],
        ], $items);

        Capsule::table('order_items')->insert($rows);
    }

    // ── Totals computation ────────────────────────────────────────────────────

    private function buildItemsAndTotals(array $items, array $productsById, array $shipping): array
    {
        $orderItems = [];
        $subtotal   = 0.0;
        $taxTotal   = 0.0;

        foreach ($items as $item) {
            $product      = $productsById[$item['productId']];
            $lineSub      = $this->round2((float) $product['price'] * $item['quantity']);
            $lineTax      = $product['hasVat'] ? $this->round2($lineSub * ($product['vatRate'] / 100)) : 0.0;
            $lineTotal    = $this->round2($lineSub + $lineTax);
            $subtotal     = $this->round2($subtotal + $lineSub);
            $taxTotal     = $this->round2($taxTotal + $lineTax);
            $orderItems[] = [
                'productId'   => $product['id'],
                'productName' => $product['name'],
                'quantity'    => $item['quantity'],
                'unitPrice'   => $product['price'],
                'hasVat'      => $product['hasVat'],
                'vatRate'     => $product['vatRate'],
                'subtotal'    => $lineSub,
                'taxTotal'    => $lineTax,
                'total'       => $lineTotal,
            ];
        }

        $productsTotal        = $this->round2($subtotal + $taxTotal);
        $shippingPrice        = $this->round2((float) ($shipping['shippingPrice'] ?? 0));
        $includedShippingPrice = $shipping['includesShippingPrice'] ? $shippingPrice : 0.0;

        return [
            'items'         => $orderItems,
            'subtotal'      => $subtotal,
            'taxTotal'      => $taxTotal,
            'shippingPrice' => $shippingPrice,
            'total'         => $this->round2($productsTotal + $includedShippingPrice),
        ];
    }

    private function round2(float $value): float
    {
        return round($value, 2);
    }

    // ── Customer snapshot ─────────────────────────────────────────────────────

    private function resolveCustomerSnapshot(array $payload, ?array $user, ?array $currentOrder = null): array
    {
        $defaultName  = $currentOrder && $currentOrder['customerName']
            ? $currentOrder['customerName']
            : ($user ? trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? '')) : null);
        $defaultEmail = $currentOrder && $currentOrder['customerEmail']
            ? $currentOrder['customerEmail']
            : ($user['email'] ?? null);

        return [
            'customerName'        => $this->normalizeOptionalText($payload['customerName'] ?? null, 'customerName', $defaultName, 150, true),
            'customerEmail'       => $this->normalizeOptionalEmail($payload['customerEmail'] ?? null, 'customerEmail', $defaultEmail, 150),
            'customerPhone'       => $this->normalizeOptionalText($payload['customerPhone'] ?? null, 'customerPhone', $currentOrder['customerPhone'] ?? null, 50, true),
            'billingDocument'     => $this->normalizeOptionalText($payload['billingDocument'] ?? null, 'billingDocument', $currentOrder['billingDocument'] ?? null, 50, true),
            'billingDocumentType' => $this->normalizeBillingDocumentType($payload['billingDocumentType'] ?? null, $currentOrder['billingDocumentType'] ?? null),
            'billingCity'         => $this->normalizeOptionalText($payload['billingCity'] ?? null, 'billingCity', $currentOrder['billingCity'] ?? null, 100, true),
            'billingAddress'      => $this->normalizeOptionalText($payload['billingAddress'] ?? null, 'billingAddress', $currentOrder['billingAddress'] ?? null, 255),
            'shippingAddress'     => $this->normalizeOptionalText($payload['shippingAddress'] ?? null, 'shippingAddress', $currentOrder['shippingAddress'] ?? null, 255),
            'includesCard'        => !array_key_exists('includesCard', $payload)
                ? ($currentOrder['includesCard'] ?? false)
                : $this->normalizeBoolean($payload['includesCard'], 'includesCard'),
            'cardMessage'         => (function () use ($payload, $currentOrder) {
                $inc = !array_key_exists('includesCard', $payload)
                    ? ($currentOrder['includesCard'] ?? false)
                    : $this->normalizeBoolean($payload['includesCard'], 'includesCard');
                return $inc ? $this->normalizeOptionalText($payload['cardMessage'] ?? null, 'cardMessage', $currentOrder['cardMessage'] ?? null, 500) : null;
            })(),
            'receiverName'        => $this->normalizeOptionalText($payload['receiverName'] ?? null, 'receiverName', $currentOrder['receiverName'] ?? null, 150, true),
            'receiverPhone'       => $this->normalizeOptionalText($payload['receiverPhone'] ?? null, 'receiverPhone', $currentOrder['receiverPhone'] ?? null, 50, true),
            'cardSignature'       => $this->normalizeOptionalText($payload['cardSignature'] ?? null, 'cardSignature', $currentOrder['cardSignature'] ?? null, 150),
            'deliveryDate'        => (function () use ($payload, $currentOrder) {
                $raw = array_key_exists('deliveryDate', $payload) ? $payload['deliveryDate'] : ($currentOrder['deliveryDate'] ?? null);
                return $raw ? substr((string) $raw, 0, 10) : null;
            })(),
        ];
    }

    // ── Shipping configuration ────────────────────────────────────────────────

    private function resolveShippingConfiguration(array $payload, ?array $currentOrder = null): array
    {
        $hasMethodField   = array_key_exists('shippingMethodId', $payload);
        $hasIncludeField  = array_key_exists('includeShippingPrice', $payload);
        $hasPriceField    = array_key_exists('shippingPrice', $payload);
        $currentShipping  = $currentOrder['shipping'] ?? null;

        if (!$hasMethodField && !$hasIncludeField && !$hasPriceField) {
            if ($currentOrder) {
                return [
                    'shippingMethodId'    => $currentShipping['shippingMethodId'] ?? null,
                    'shippingName'        => $currentShipping['name'] ?? null,
                    'shippingPrice'       => $currentShipping['price'] ?? 0,
                    'includesShippingPrice' => $currentShipping['includesPrice'] ?? false,
                ];
            }
            return ['shippingMethodId' => null, 'shippingName' => null, 'shippingPrice' => 0, 'includesShippingPrice' => false];
        }

        $shippingMethodId = $hasMethodField
            ? ($payload['shippingMethodId'] === null ? null : $this->normalizePositiveInt($payload['shippingMethodId'], 'shippingMethodId'))
            : ($currentShipping['shippingMethodId'] ?? null);

        $includesShippingPrice = !$hasIncludeField
            ? ($currentShipping ? $currentShipping['includesPrice'] : (bool) $shippingMethodId)
            : $this->normalizeBoolean($payload['includeShippingPrice'], 'includeShippingPrice');

        $explicitPrice = $hasPriceField
            ? $this->normalizeMoney($payload['shippingPrice'], 'shippingPrice', true)
            : null;

        if (!$shippingMethodId) {
            if ($hasIncludeField && $includesShippingPrice) {
                throw new HttpError(400, 'includeShippingPrice requires shippingMethodId');
            }
            if ($hasPriceField && $explicitPrice !== null && $explicitPrice !== 0.0) {
                throw new HttpError(400, 'shippingPrice requires shippingMethodId');
            }
            return ['shippingMethodId' => null, 'shippingName' => null, 'shippingPrice' => 0, 'includesShippingPrice' => false];
        }

        $sm = Capsule::table('shipping_methods')->where('id', $shippingMethodId)->first();
        if ($sm === null) {
            throw new HttpError(400, "Unknown shippingMethodId: {$shippingMethodId}");
        }

        $shippingPrice = $explicitPrice !== null
            ? $explicitPrice
            : ($currentShipping && $currentShipping['shippingMethodId'] === $shippingMethodId
                ? $currentShipping['price']
                : ($sm->price === null ? 0 : (float) $sm->price));

        return [
            'shippingMethodId'    => $sm->id,
            'shippingName'        => $sm->name,
            'shippingPrice'       => $shippingPrice,
            'includesShippingPrice' => $includesShippingPrice,
        ];
    }

    // ── Normalizers ───────────────────────────────────────────────────────────

    private function resolveUserId(array $payload, int $actorUserId): ?int
    {
        if (array_key_exists('userId', $payload)) {
            return $payload['userId'] === null ? null : $this->normalizePositiveInt($payload['userId'], 'userId');
        }
        return $actorUserId;
    }

    private function assertUserExists(?int $userId): ?array
    {
        if ($userId === null) {
            return null;
        }
        $u = Capsule::table('users')->where('id', $userId)->first(['id','email','first_name','last_name','is_active']);
        if ($u === null) {
            throw new HttpError(400, "Unknown user id: {$userId}");
        }
        return ['id' => $u->id, 'email' => $u->email, 'firstName' => $u->first_name, 'lastName' => $u->last_name];
    }

    private function normalizePositiveInt(mixed $value, string $fieldName): int
    {
        $n = (int) $value;
        if ($n <= 0 || (string) $n !== (string) $value && (string) ((float) $value) !== (string) $value) {
            // best-effort: just cast and check positivity
        }
        if (!is_numeric($value) || (int) $value <= 0) {
            throw new HttpError(400, "{$fieldName} must be a positive integer");
        }
        return (int) $value;
    }

    private function normalizeOrderStatus(mixed $value, string $default = null): string
    {
        if ($value === null || $value === '') {
            if ($default !== null) {
                return $default;
            }
            throw new HttpError(400, 'status is required');
        }
        $normalized = strtolower(trim((string) $value));
        if (!in_array($normalized, self::ORDER_STATUSES, true)) {
            throw new HttpError(400, 'status must be one of: ' . implode(', ', self::ORDER_STATUSES));
        }
        return $normalized;
    }

    private function normalizeBoolean(mixed $value, string $fieldName): bool
    {
        if ($value === true || $value === 1 || $value === '1' || $value === 'true') {
            return true;
        }
        if ($value === false || $value === 0 || $value === '0' || $value === 'false') {
            return false;
        }
        throw new HttpError(400, "{$fieldName} must be true or false");
    }

    private function normalizeOrderItems(mixed $items): array
    {
        if (!is_array($items) || empty($items)) {
            throw new HttpError(400, 'items must be a non-empty array');
        }
        return array_map(function ($item, $index) {
            $productId = isset($item['productId']) ? (int) $item['productId'] : 0;
            $quantity  = isset($item['quantity'])  ? (int) $item['quantity']  : 0;
            if ($productId <= 0) {
                throw new HttpError(400, "items[{$index}].productId must be a positive integer");
            }
            if ($quantity <= 0) {
                throw new HttpError(400, "items[{$index}].quantity must be a positive integer");
            }
            return ['productId' => $productId, 'quantity' => $quantity];
        }, $items, array_keys($items));
    }

    private function ensureUniqueProductIds(array $items): void
    {
        $seen = [];
        foreach ($items as $item) {
            if (in_array($item['productId'], $seen, true)) {
                throw new HttpError(400, "Duplicate productId in items: {$item['productId']}");
            }
            $seen[] = $item['productId'];
        }
    }

    private function normalizePaymentProvider(mixed $value, mixed $default): ?string
    {
        if ($value === null || $value === '' || (is_string($value) && trim($value) === '')) {
            return $default;
        }
        $normalized = strtolower(trim((string) $value));
        if (!in_array($normalized, self::PAYMENT_PROVIDERS, true)) {
            throw new HttpError(400, 'paymentProvider must be one of: ' . implode(', ', self::PAYMENT_PROVIDERS));
        }
        return $normalized;
    }

    private function normalizeBillingDocumentType(mixed $value, mixed $default): ?string
    {
        if ($value === null) {
            return $default;
        }
        $str = trim((string) $value);
        if ($str === '') {
            return null;
        }
        $normalized = strtoupper($str);
        if (!in_array($normalized, self::BILLING_DOCUMENT_TYPES, true)) {
            throw new HttpError(400, 'billingDocumentType must be one of: ' . implode(', ', self::BILLING_DOCUMENT_TYPES));
        }
        return $normalized;
    }

    private function normalizeMoney(mixed $value, string $fieldName, bool $allowNull = false): ?float
    {
        if ($value === null) {
            return $allowNull ? null : 0.0;
        }
        $n = (float) $value;
        if (!is_finite($n) || $n < 0) {
            throw new HttpError(400, "{$fieldName} must be a number greater than or equal to 0");
        }
        return $this->round2($n);
    }

    private function normalizeOptionalText(mixed $value, string $fieldName, mixed $default, int $maxLength = 0, bool $required = false): ?string
    {
        if ($value === null) {
            return $default;
        }
        $str = trim((string) $value);
        if ($str === '') {
            if ($required) {
                throw new HttpError(400, "{$fieldName} is required");
            }
            return null;
        }
        if ($maxLength > 0 && strlen($str) > $maxLength) {
            throw new HttpError(400, "{$fieldName} must contain at most {$maxLength} characters");
        }
        return $str;
    }

    private function normalizeOptionalEmail(mixed $value, string $fieldName, mixed $default, int $maxLength = 0): ?string
    {
        $text = $this->normalizeOptionalText($value, $fieldName, $default, $maxLength);
        if ($text === null || $text === $default) {
            return $text;
        }
        $lower = strtolower($text);
        if (!filter_var($lower, FILTER_VALIDATE_EMAIL)) {
            throw new HttpError(400, "{$fieldName} must be a valid email");
        }
        return $lower;
    }

    // ── Row mapper ────────────────────────────────────────────────────────────

    private function mapRow(object $r): array
    {
        $deliveryDate = $r->delivery_date
            ? substr((string) $r->delivery_date, 0, 10)
            : null;

        return [
            'id'                  => $r->id,
            'code'                => $r->code,
            'userId'              => $r->user_id,
            'shippingMethodId'    => $r->shipping_method_id,
            'shippingName'        => $r->shipping_name,
            'shippingPrice'       => $r->shipping_price !== null ? (float) $r->shipping_price : null,
            'includesShippingPrice' => (bool) $r->includes_shipping_price,
            'customerName'        => $r->customer_name,
            'customerEmail'       => $r->customer_email,
            'customerPhone'       => $r->customer_phone,
            'billingDocument'     => $r->billing_document,
            'billingDocumentType' => $r->billing_document_type,
            'billingCity'         => $r->billing_city,
            'billingAddress'      => $r->billing_address,
            'shippingAddress'     => $r->shipping_address,
            'includesCard'        => (bool) $r->includes_card,
            'cardMessage'         => $r->card_message,
            'receiverName'        => $r->receiver_name,
            'receiverPhone'       => $r->receiver_phone,
            'cardSignature'       => $r->card_signature,
            'deliveryDate'        => $deliveryDate,
            'subtotal'            => (float) $r->subtotal,
            'taxTotal'            => (float) $r->tax_total,
            'total'               => (float) $r->total,
            'status'              => $r->status,
            'isPaid'              => (bool) $r->is_paid,
            'isActive'            => (bool) $r->is_active,
            'paymentProvider'     => $r->payment_provider,
            'paymentReference'    => $r->payment_reference,
            'createdAt'           => Fmt::ts($r->created_at),
            'updatedAt'           => Fmt::ts($r->updated_at),
        ];
    }
}
