<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Utils\HttpError;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Verifica que el usuario (ya cargado por AuthMiddleware) tenga
 * los permisos requeridos. Equivale a src/middlewares/require-permissions.js.
 */
class RequirePermissionsMiddleware
{
    /** @var string[] */
    private array $required;

    public function __construct(string ...$permissions)
    {
        $this->required = $permissions;
    }

    public function __invoke(
        ServerRequestInterface  $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        /** @var array{permissions: string[]}|null $user */
        $user            = $request->getAttribute('user');
        $userPermissions = is_array($user) ? ($user['permissions'] ?? []) : [];

        $missing = array_values(
            array_filter($this->required, fn($p) => !in_array($p, $userPermissions, true))
        );

        if (!empty($missing)) {
            throw new HttpError(403, 'Missing required permissions: ' . implode(', ', $missing));
        }

        return $handler->handle($request);
    }
}
