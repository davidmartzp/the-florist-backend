<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Utils\HttpError;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class AuthController extends BaseController
{
    private readonly AuthService $service;

    public function __construct()
    {
        $this->service = new AuthService();
    }

    /** POST /api/auth/login */
    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body     = $this->body($request->getParsedBody());
        $email    = trim((string) ($body['email']    ?? ''));
        $password = trim((string) ($body['password'] ?? ''));

        $result = $this->service->login($email, $password);

        return $this->json($response, $result);
    }

    /** POST /api/auth/forgot-password */
    public function forgotPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body  = $this->body($request->getParsedBody());
        $email = trim((string) ($body['email'] ?? ''));

        $result = $this->service->requestPasswordReset($email);

        return $this->json($response, $result);
    }

    /** POST /api/auth/reset-password */
    public function resetPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body        = $this->body($request->getParsedBody());
        $token       = trim((string) ($body['token']       ?? ''));
        $newPassword = trim((string) ($body['newPassword'] ?? ''));

        $result = $this->service->resetPassword($token, $newPassword);

        return $this->json($response, $result);
    }
}
