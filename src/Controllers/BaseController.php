<?php
declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface;

/**
 * Helpers de respuesta JSON compartidos por todos los controllers.
 */
abstract class BaseController
{
    protected function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    /**
     * Extrae el body JSON ya parseado por Slim (addBodyParsingMiddleware).
     *
     * @return array<string,mixed>
     */
    protected function body(mixed $parsedBody): array
    {
        if (is_array($parsedBody)) {
            return $parsedBody;
        }

        return [];
    }
}
