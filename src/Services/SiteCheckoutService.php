<?php
declare(strict_types=1);

namespace App\Services;

use App\Utils\HttpError;
use Illuminate\Database\Capsule\Manager as Capsule;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class SiteCheckoutService
{
    private const BILLING_DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'PASAPORTE'];

    private readonly OrderService $orderService;

    public function __construct()
    {
        $this->orderService = new OrderService();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public function createCheckoutPreference(array $payload): array
    {
        $cart                = $this->normalizeCartItems($payload['cart'] ?? null);
        $customerName        = $this->requireString($payload['customerName'] ?? null, 'customerName', 150);
        $customerPhone       = $this->requireString($payload['customerPhone'] ?? null, 'customerPhone', 50);
        $customerEmail       = $this->requireEmail($payload['customerEmail'] ?? null, 'customerEmail', 150);
        $billingDocument     = $this->requireString($payload['billingDocument'] ?? null, 'billingDocument', 50);
        $billingDocumentType = $this->normalizeBillingDocumentType($payload['billingDocumentType'] ?? null);
        $billingCity         = $this->requireString($payload['billingCity'] ?? null, 'billingCity', 100);
        $billingAddress      = $this->optionalString($payload['billingAddress'] ?? null, 'billingAddress', 255);
        $shippingAddress     = $this->optionalString($payload['deliveryAddress'] ?? null, 'deliveryAddress', 255);
        $cardMessage         = $this->optionalString($payload['cardMessage'] ?? null, 'cardMessage', 500);
        $receiverName        = $this->requireString($payload['receiverName'] ?? null, 'receiverName', 150);
        $receiverPhone       = $this->requireString($payload['receiverPhone'] ?? null, 'receiverPhone', 50);
        $cardSignature       = $this->optionalString($payload['cardSignature'] ?? null, 'cardSignature', 150);
        $deliveryDate        = $this->requireString($payload['deliveryDate'] ?? null, 'deliveryDate');

        $shippingMethodId = isset($payload['shippingMethodId']) && $payload['shippingMethodId'] !== null && $payload['shippingMethodId'] !== ''
            ? $this->normalizePositiveInt($payload['shippingMethodId'], 'shippingMethodId')
            : null;

        $appUrl    = rtrim((string) ($_ENV['APP_URL'] ?? 'http://localhost:8090'), '/');
        $returnUrl = isset($payload['returnUrl']) && trim((string) $payload['returnUrl']) !== ''
            ? trim((string) $payload['returnUrl'])
            : "{$appUrl}/checkout";

        $shippingItem = null;
        if ($shippingMethodId) {
            $sm = Capsule::table('shipping_methods')->where('id', $shippingMethodId)->first();
            if ($sm === null) {
                throw new HttpError(400, "Unknown shippingMethodId: {$shippingMethodId}");
            }
            if ($sm->price !== null && (float) $sm->price > 0) {
                $shippingItem = [
                    'title'      => "Envío - {$sm->name}",
                    'quantity'   => 1,
                    'unit_price' => (float) $sm->price,
                ];
            }
        }

        $token = $_ENV['MERCADOPAGO_ACCESS_TOKEN'] ?? '';
        if (!$token) {
            throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
        }

        MercadoPagoConfig::setAccessToken($token);
        MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);

        $preferenceItems = array_map(fn($e) => [
            'title'      => $e['name'],
            'quantity'   => $e['quantity'],
            'unit_price' => $e['unitPrice'],
        ], $cart);

        if ($shippingItem) {
            $preferenceItems[] = $shippingItem;
        }

        $callbackUrl   = $returnUrl . (str_contains($returnUrl, '?') ? '&' : '?') . 'paymentSuccess=1';
        $isPublicUrl   = (bool) preg_match('#^https?://(?!localhost|127\.0\.0\.1)#', $callbackUrl);
        $notificationUrl = $appUrl ? "{$appUrl}/api/site/checkout/webhook" : null;
        $externalReference = bin2hex(random_bytes(16));

        $request = [
            'items'              => $preferenceItems,
            'external_reference' => $externalReference,
            'payer'              => [
                'name'  => $customerName,
                'email' => $customerEmail,
                'phone' => ['number' => $customerPhone],
            ],
            'back_urls' => [
                'success' => $callbackUrl,
                'failure' => $callbackUrl,
                'pending' => $callbackUrl,
            ],
        ];

        if ($isPublicUrl) {
            $request['auto_return'] = 'approved';
        }
        if ($notificationUrl) {
            $request['notification_url'] = $notificationUrl;
        }

        try {
            $prefClient = new PreferenceClient();
            $preference = $prefClient->create($request);
        } catch (MPApiException $e) {
            throw new HttpError(502, 'MercadoPago preference creation failed: ' . ($e->getMessage() ?: 'Unknown error'));
        }

        $preferenceId = $preference->id ?? null;
        if (!$preferenceId) {
            throw new HttpError(500, 'Could not create MercadoPago preference');
        }

        Capsule::table('checkout_sessions')->insert([
            'preference_id'      => $preferenceId,
            'external_reference' => $externalReference,
            'payload'            => json_encode([
                'cart'                => $cart,
                'customerName'        => $customerName,
                'customerPhone'       => $customerPhone,
                'customerEmail'       => $customerEmail,
                'billingDocument'     => $billingDocument,
                'billingDocumentType' => $billingDocumentType,
                'billingCity'         => $billingCity,
                'billingAddress'      => $billingAddress,
                'deliveryAddress'     => $shippingAddress,
                'cardMessage'         => $cardMessage,
                'shippingMethodId'    => $shippingMethodId,
                'receiverName'        => $receiverName,
                'receiverPhone'       => $receiverPhone,
                'cardSignature'       => $cardSignature,
                'deliveryDate'        => $deliveryDate,
            ]),
            'status'             => 'created',
        ]);

        $isLocalhost  = (bool) preg_match('#localhost|127\.0\.0\.1#', $returnUrl);
        $checkoutUrl  = ($isLocalhost && $preference->sandbox_init_point)
            ? $preference->sandbox_init_point
            : $preference->init_point;

        return [
            'init_point'         => $checkoutUrl,
            'sandbox_init_point' => $preference->sandbox_init_point,
            'preferenceId'       => $preferenceId,
        ];
    }

    public function confirmCheckoutPayment(array $payload): array
    {
        $preferenceId    = $this->requireString($payload['preferenceId'] ?? null, 'preferenceId');
        $collectionId    = $this->requireString($payload['collectionId'] ?? null, 'collectionId');
        $collectionStatus = $this->requireString($payload['collectionStatus'] ?? $payload['status'] ?? null, 'collectionStatus');

        if (strtolower($collectionStatus) !== 'approved') {
            throw new HttpError(400, 'Payment is not approved');
        }

        $token = $_ENV['MERCADOPAGO_ACCESS_TOKEN'] ?? '';
        if (!$token) {
            throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
        }

        MercadoPagoConfig::setAccessToken($token);
        MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);

        try {
            $paymentClient = new PaymentClient();
            $payment       = $paymentClient->get((int) $collectionId);
        } catch (MPApiException $e) {
            throw new HttpError(502, 'MercadoPago verification failed: ' . ($e->getMessage() ?: 'Unknown error'));
        }

        if (!$payment || $payment->status !== 'approved') {
            throw new HttpError(400, 'Payment verification failed: payment is not approved');
        }

        return Capsule::transaction(function () use ($preferenceId, $collectionId) {
            $session = $this->findSessionByPreferenceIdForUpdate($preferenceId);

            if ($session === null) {
                throw new HttpError(404, 'Checkout session not found');
            }

            if ($session['orderId']) {
                return ['alreadyConfirmed' => true, 'orderId' => $session['orderId']];
            }

            $p     = $session['payload'];
            $order = $this->orderService->createOrder(0, [
                'items'               => $p['cart'],
                'customerName'        => $p['customerName'],
                'customerEmail'       => $p['customerEmail'],
                'customerPhone'       => $p['customerPhone'],
                'billingDocument'     => $p['billingDocument'],
                'billingDocumentType' => $p['billingDocumentType'],
                'billingCity'         => $p['billingCity'],
                'billingAddress'      => $p['billingAddress'],
                'shippingAddress'     => $p['deliveryAddress'],
                'includesCard'        => !empty($p['cardMessage']),
                'cardMessage'         => $p['cardMessage'],
                'receiverName'        => $p['receiverName'],
                'receiverPhone'       => $p['receiverPhone'],
                'cardSignature'       => $p['cardSignature'],
                'deliveryDate'        => $p['deliveryDate'],
                'shippingMethodId'    => $p['shippingMethodId'],
                'paymentReference'    => $collectionId,
                'isPaid'              => true,
                'status'              => 'confirmed',
                'userId'              => null,
            ]);

            Capsule::table('checkout_sessions')
                ->where('id', $session['id'])
                ->update([
                    'status'            => 'confirmed',
                    'payment_reference' => $collectionId,
                    'order_id'          => $order['id'],
                    'order_code'        => $order['code'],
                ]);

            return $order;
        });
    }

    public function processWebhook(array $payload, array $headers): array
    {
        $dataId    = $payload['data']['id'] ?? ($payload['data.id'] ?? null);
        $type      = $payload['type'] ?? '';
        $action    = $payload['action'] ?? '';
        $isPayment = $type === 'payment' || str_starts_with($action, 'payment.');

        if (!$isPayment || !$dataId) {
            return ['processed' => false, 'reason' => 'Not a payment notification'];
        }

        if (!$this->verifyWebhookSignature($headers, (string) $dataId)) {
            return ['processed' => false, 'reason' => 'Invalid signature'];
        }

        $token = $_ENV['MERCADOPAGO_ACCESS_TOKEN'] ?? '';
        if (!$token) {
            throw new HttpError(501, 'MERCADOPAGO_ACCESS_TOKEN not configured on server');
        }

        MercadoPagoConfig::setAccessToken($token);
        MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);

        $paymentClient = new PaymentClient();
        $payment       = null;
        $attempts      = 3;

        while ($attempts--) {
            try {
                $payment = $paymentClient->get((int) $dataId);
                break;
            } catch (MPApiException $e) {
                $status = $e->getApiResponse()?->getStatusCode();
                if ($status === 404) {
                    return ['processed' => false, 'reason' => 'Payment not found'];
                }
                if ($attempts === 0) {
                    throw new HttpError(502, 'MercadoPago verification failed: ' . ($e->getMessage() ?: 'Unknown error'));
                }
                sleep(2);
            }
        }

        if (!$payment || $payment->status !== 'approved') {
            return ['processed' => false, 'reason' => 'Payment not approved', 'status' => $payment?->status, 'id' => $dataId];
        }

        $externalReference = $payment->external_reference ?? null;
        $preferenceId      = $payment->preference_id ?? null;

        if (!$externalReference && !$preferenceId) {
            return ['processed' => false, 'reason' => 'No external_reference nor preference_id found in payment', 'paymentId' => $dataId];
        }

        return Capsule::transaction(function () use ($externalReference, $preferenceId, $dataId) {
            $session = $externalReference
                ? $this->findSessionByExternalReferenceForUpdate($externalReference)
                : $this->findSessionByPreferenceIdForUpdate((string) $preferenceId);

            if ($session === null) {
                return ['processed' => false, 'reason' => 'Checkout session not found', 'preferenceId' => $preferenceId];
            }

            if ($session['orderId']) {
                return ['processed' => true, 'alreadyConfirmed' => true, 'orderId' => $session['orderId']];
            }

            $p     = $session['payload'];
            $order = $this->orderService->createOrder(0, [
                'items'               => $p['cart'],
                'customerName'        => $p['customerName'],
                'customerEmail'       => $p['customerEmail'],
                'customerPhone'       => $p['customerPhone'],
                'billingDocument'     => $p['billingDocument'],
                'billingDocumentType' => $p['billingDocumentType'],
                'billingCity'         => $p['billingCity'],
                'billingAddress'      => $p['billingAddress'],
                'shippingAddress'     => $p['deliveryAddress'],
                'includesCard'        => !empty($p['cardMessage']),
                'cardMessage'         => $p['cardMessage'],
                'receiverName'        => $p['receiverName'],
                'receiverPhone'       => $p['receiverPhone'],
                'cardSignature'       => $p['cardSignature'],
                'deliveryDate'        => $p['deliveryDate'],
                'shippingMethodId'    => $p['shippingMethodId'],
                'paymentReference'    => (string) $dataId,
                'isPaid'              => true,
                'status'              => 'confirmed',
                'userId'              => null,
            ]);

            Capsule::table('checkout_sessions')
                ->where('id', $session['id'])
                ->update([
                    'status'            => 'confirmed',
                    'payment_reference' => (string) $dataId,
                    'order_id'          => $order['id'],
                    'order_code'        => $order['code'],
                ]);

            return ['processed' => true, 'orderId' => $order['id']];
        });
    }

    // ── Session finders ───────────────────────────────────────────────────────

    private function findSessionByPreferenceIdForUpdate(string $preferenceId): ?array
    {
        $row = Capsule::selectOne(
            'SELECT id, preference_id, external_reference, payload, status, payment_reference, order_id, order_code, created_at, updated_at
             FROM checkout_sessions WHERE preference_id = ? LIMIT 1 FOR UPDATE',
            [$preferenceId]
        );
        return $row ? $this->mapSession($row) : null;
    }

    private function findSessionByExternalReferenceForUpdate(string $externalReference): ?array
    {
        $row = Capsule::selectOne(
            'SELECT id, preference_id, external_reference, payload, status, payment_reference, order_id, order_code, created_at, updated_at
             FROM checkout_sessions WHERE external_reference = ? LIMIT 1 FOR UPDATE',
            [$externalReference]
        );
        return $row ? $this->mapSession($row) : null;
    }

    private function mapSession(object $row): array
    {
        return [
            'id'                => $row->id,
            'preferenceId'      => $row->preference_id,
            'externalReference' => $row->external_reference,
            'payload'           => json_decode($row->payload, true) ?? [],
            'status'            => $row->status,
            'paymentReference'  => $row->payment_reference,
            'orderId'           => $row->order_id,
            'orderCode'         => $row->order_code,
        ];
    }

    // ── Webhook signature ─────────────────────────────────────────────────────

    private function verifyWebhookSignature(array $headers, string $dataId): bool
    {
        $secret = $_ENV['MERCADOPAGO_WEBHOOK_SECRET'] ?? '';
        if (!$secret) {
            return true;
        }

        $xSignature = $headers['x-signature'] ?? '';
        $xRequestId = $headers['x-request-id'] ?? '';

        if (!$xSignature) {
            return false;
        }

        $ts = null;
        $v1 = null;
        foreach (explode(',', $xSignature) as $part) {
            $part = trim($part);
            if (str_starts_with($part, 'ts=')) {
                $ts = substr($part, 3);
            } elseif (str_starts_with($part, 'v1=')) {
                $v1 = substr($part, 3);
            }
        }

        if ($ts === null || $v1 === null) {
            return false;
        }

        $manifest = "id:{$dataId};request-id:{$xRequestId};ts:{$ts};";
        $computed  = hash_hmac('sha256', $manifest, $secret);
        return hash_equals($computed, $v1);
    }

    // ── Normalizers ───────────────────────────────────────────────────────────

    private function normalizeCartItems(mixed $cart): array
    {
        if (!is_array($cart) || empty($cart)) {
            throw new HttpError(400, 'cart must be a non-empty array');
        }
        return array_map(function ($item, $index) {
            if (!is_array($item)) {
                throw new HttpError(400, "cart[{$index}] must be an object");
            }
            $productId = (int) ($item['productId'] ?? 0);
            $quantity  = (int) ($item['quantity']  ?? 0);
            $unitPrice = is_numeric($item['unitPrice'] ?? null) ? (float) $item['unitPrice'] : -1;
            $name      = isset($item['name']) ? trim((string) $item['name']) : null;

            if ($productId <= 0) {
                throw new HttpError(400, "cart[{$index}].productId must be a positive integer");
            }
            if ($quantity <= 0) {
                throw new HttpError(400, "cart[{$index}].quantity must be a positive integer");
            }
            if ($unitPrice < 0 || !is_finite($unitPrice)) {
                throw new HttpError(400, "cart[{$index}].unitPrice must be a number greater than or equal to 0");
            }
            return ['productId' => $productId, 'quantity' => $quantity, 'unitPrice' => $unitPrice, 'name' => $name ?: "Product {$productId}"];
        }, $cart, array_keys($cart));
    }

    private function requireString(mixed $value, string $field, int $maxLength = 0): string
    {
        if ($value === null || trim((string) $value) === '') {
            throw new HttpError(400, "{$field} is required");
        }
        $str = trim((string) $value);
        if ($maxLength > 0 && strlen($str) > $maxLength) {
            throw new HttpError(400, "{$field} must contain at most {$maxLength} characters");
        }
        return $str;
    }

    private function optionalString(mixed $value, string $field, int $maxLength = 0): ?string
    {
        if ($value === null) {
            return null;
        }
        $str = trim((string) $value);
        if ($str === '') {
            return null;
        }
        if ($maxLength > 0 && strlen($str) > $maxLength) {
            throw new HttpError(400, "{$field} must contain at most {$maxLength} characters");
        }
        return $str;
    }

    private function requireEmail(mixed $value, string $field, int $maxLength = 0): string
    {
        $str   = $this->requireString($value, $field, $maxLength);
        $lower = strtolower($str);
        if (!filter_var($lower, FILTER_VALIDATE_EMAIL)) {
            throw new HttpError(400, "{$field} must be a valid email");
        }
        return $lower;
    }

    private function normalizePositiveInt(mixed $value, string $field): int
    {
        if (!is_numeric($value) || (int) $value <= 0) {
            throw new HttpError(400, "{$field} must be a positive integer");
        }
        return (int) $value;
    }

    private function normalizeBillingDocumentType(mixed $value): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }
        $normalized = strtoupper(trim((string) $value));
        if (!in_array($normalized, self::BILLING_DOCUMENT_TYPES, true)) {
            throw new HttpError(400, 'billingDocumentType must be one of: ' . implode(', ', self::BILLING_DOCUMENT_TYPES));
        }
        return $normalized;
    }
}
