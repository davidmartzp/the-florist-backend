<?php
declare(strict_types=1);

namespace App\Controllers\Site;

use App\Controllers\BaseController;
use App\Services\SiteCheckoutService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SiteCheckoutController extends BaseController
{
    private readonly SiteCheckoutService $service;

    public function __construct()
    {
        $this->service = new SiteCheckoutService();
    }

    /** POST /api/site/checkout */
    public function createCheckoutPreference(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->createCheckoutPreference($this->body($request->getParsedBody())));
    }

    /** POST /api/site/checkout/confirm */
    public function confirmCheckout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, $this->service->confirmCheckoutPayment($this->body($request->getParsedBody())));
    }

    /** POST /api/site/checkout/webhook */
    public function receiveWebhook(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $response->getBody()->write('OK');
        $response = $response->withStatus(200)->withHeader('Content-Type', 'text/plain');

        // Merge query params + body (matching Node.js: { ...req.query, ...req.body })
        $payload = array_merge(
            $request->getQueryParams(),
            (array) ($request->getParsedBody() ?? [])
        );

        // Flatten PSR-7 headers (arrays) to strings, lowercased
        $flatHeaders = [];
        foreach ($request->getHeaders() as $name => $values) {
            $flatHeaders[strtolower($name)] = implode(',', $values);
        }

        try {
            $this->service->processWebhook($payload, $flatHeaders);
        } catch (\Throwable $e) {
            error_log('[Webhook] error: ' . $e->getMessage());
        }

        return $response;
    }
}
