<?php
declare(strict_types=1);

use App\Utils\HttpError;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Factory\AppFactory;

$app = AppFactory::create();

// ── Middleware (orden de registro = orden inverso de ejecución) ──────────────

// 1) Parser de body JSON / form (capa más interna)
$app->addBodyParsingMiddleware();

// 2) Router
$app->addRoutingMiddleware();

// 3) Error handler — captura todas las excepciones, incluyendo las de rutas
$errorMiddleware = $app->addErrorMiddleware(false, false, false);
$errorMiddleware->setDefaultErrorHandler(
    function (
        ServerRequestInterface $request,
        Throwable              $exception,
        bool                   $displayErrorDetails,
        bool                   $logErrors,
        bool                   $logErrorDetails
    ) use ($app): ResponseInterface {
        $statusCode = $exception instanceof HttpError ? $exception->statusCode : 500;
        $payload    = ['error' => $exception->getMessage() ?: 'Internal server error'];

        $response = $app->getResponseFactory()->createResponse();
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }
);

// 4) CORS — capa más externa; envuelve incluso al error handler para que las
//    respuestas de error también lleven los headers correctos
$app->add(function (ServerRequestInterface $request, $handler): ResponseInterface {
    // Responder preflight OPTIONS directamente sin llegar a las rutas
    if ($request->getMethod() === 'OPTIONS') {
        $response = $handler->handle($request);
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withStatus(200);
    }

    $response = $handler->handle($request);

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
});

// ── Rutas de infraestructura ─────────────────────────────────────────────────

$app->get('/', function (ServerRequestInterface $request, ResponseInterface $response): ResponseInterface {
    $info = [
        'name'        => 'the-florist',
        'version'     => '1.0.0',
        'description' => 'Backend ecommerce La Floreria - Slim 4 + Eloquent ORM',
        'author'      => null,
        'license'     => 'ISC',
    ];
    $response->getBody()->write(json_encode($info));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/health', function (ServerRequestInterface $request, ResponseInterface $response): ResponseInterface {
    $response->getBody()->write(json_encode(['status' => 'ok']));
    return $response->withHeader('Content-Type', 'application/json');
});

// Captura de preflight OPTIONS para cualquier ruta
$app->options('/{routes:.+}', function (ServerRequestInterface $request, ResponseInterface $response): ResponseInterface {
    return $response;
});

// ── Rutas de negocio (se agregan módulo a módulo) ───────────────────────────
require __DIR__ . '/routes.php';

return $app;
