<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Services\AuthService;
use App\Utils\HttpError;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Verifica el JWT del header Authorization, carga el usuario desde la BD
 * y lo adjunta al request como atributo 'user'.
 * Equivale a src/middlewares/auth.js del proyecto Node.
 */
class AuthMiddleware
{
    private readonly AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    public function __invoke(
        ServerRequestInterface  $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        $authorization = $request->getHeaderLine('Authorization');

        if ($authorization === '') {
            throw new HttpError(401, 'Unauthorized');
        }

        $token = str_starts_with($authorization, 'Bearer ')
            ? substr($authorization, 7)
            : $authorization;

        try {
            $decoded = JWT::decode($token, new Key($this->authService->getJwtSecret(), 'HS256'));
            $userId  = (int) $decoded->id;
            $user    = $this->authService->getAuthenticatedUserContext($userId);
        } catch (HttpError $e) {
            // HttpError proveniente de getAuthenticatedUserContext (ej. usuario inactivo)
            throw $e;
        } catch (\Throwable) {
            // Cualquier error de decodificación JWT (firma inválida, expirado, malformado)
            throw new HttpError(403, 'Invalid or expired token');
        }

        return $handler->handle($request->withAttribute('user', $user));
    }
}
