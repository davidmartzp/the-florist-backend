<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Excepción HTTP con código de estado.
 * Equivale a src/utils/http-error.js del proyecto Node.
 * El error handler de Slim la detecta y usa $statusCode como código HTTP.
 */
class HttpError extends \RuntimeException
{
    public function __construct(
        public readonly int $statusCode,
        string $message
    ) {
        parent::__construct($message);
    }
}
