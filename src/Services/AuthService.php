<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Utils\HttpError;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private readonly string $jwtSecret;
    private readonly int    $resetTtlMinutes;

    public function __construct()
    {
        $this->jwtSecret       = $_ENV['JWT_SECRET'] ?? 'secret';
        $this->resetTtlMinutes = (int) ($_ENV['PASSWORD_RESET_TOKEN_TTL_MINUTES'] ?? 30);
    }

    // ── Endpoints públicos ───────────────────────────────────────────────────

    /**
     * Autentica un usuario y retorna token JWT + perfil.
     *
     * @return array{token:string,user:array<string,mixed>}
     */
    public function login(string $email, string $password): array
    {
        if ($email === '' || $password === '') {
            throw new HttpError(400, 'Email and password are required');
        }

        $user = User::where('email', $this->normalizeEmail($email))->first();

        if (!$user) {
            throw new HttpError(401, 'Invalid email or password');
        }

        if (!$user->is_active) {
            throw new HttpError(403, 'User account is inactive');
        }

        if (!password_verify($password, $user->password_hash)) {
            throw new HttpError(401, 'Invalid email or password');
        }

        $profile = (new AccessControlService())->buildUserAccessProfile($user);

        $token = JWT::encode(
            ['id' => $user->id, 'exp' => time() + 7 * 86400],
            $this->jwtSecret,
            'HS256'
        );

        return [
            'token' => $token,
            'user'  => [
                'id'          => $profile['id'],
                'email'       => $profile['email'],
                'firstName'   => $profile['firstName'],
                'lastName'    => $profile['lastName'],
                'isActive'    => $profile['isActive'],
                'permissions' => $profile['permissions'],
            ],
        ];
    }

    /**
     * Genera un token de restablecimiento y lo persiste (hashed).
     * Siempre retorna el mismo mensaje independientemente de si el usuario existe.
     *
     * @return array<string,mixed>
     */
    public function requestPasswordReset(string $email): array
    {
        $message = 'If the account exists, a password reset token has been generated';

        if ($email === '') {
            throw new HttpError(400, 'Email is required');
        }

        $user = User::where('email', $this->normalizeEmail($email))->first();

        if (!$user || !$user->is_active) {
            return ['message' => $message];
        }

        // Equivale a: crypto.randomBytes(32).toString('hex')
        $resetToken = bin2hex(random_bytes(32));
        $tokenHash  = hash('sha256', $resetToken);
        $expiresAt  = date('Y-m-d H:i:s', time() + $this->resetTtlMinutes * 60);
        $appUrl     = rtrim($_ENV['APP_URL'] ?? 'http://localhost', '/');

        $user->reset_password_token_hash = $tokenHash;
        $user->reset_password_expires_at = $expiresAt;
        $user->save();

        return [
            'message'    => $message,
            'resetToken' => $resetToken,
            'expiresAt'  => (new \DateTime($expiresAt))->format(\DateTime::ATOM),
            'resetUrl'   => "{$appUrl}/reset-password?token={$resetToken}",
        ];
    }

    /**
     * Valida el token y actualiza la contraseña.
     *
     * @return array{message:string}
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        if ($token === '' || $newPassword === '') {
            throw new HttpError(400, 'Token and newPassword are required');
        }

        if (strlen($newPassword) < 8) {
            throw new HttpError(400, 'newPassword must contain at least 8 characters');
        }

        $tokenHash = hash('sha256', $token);

        $user = User::where('reset_password_token_hash', $tokenHash)
            ->where('reset_password_expires_at', '>', date('Y-m-d H:i:s'))
            ->first();

        if (!$user) {
            throw new HttpError(400, 'Reset token is invalid or has expired');
        }

        $user->password_hash              = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
        $user->reset_password_token_hash  = null;
        $user->reset_password_expires_at  = null;
        $user->save();

        return ['message' => 'Password updated successfully'];
    }

    // ── Usado por el middleware en cada request autenticado ──────────────────

    /**
     * Carga el usuario activo desde la BD y construye su perfil de acceso.
     * Equivale a getAuthenticatedUserContext() del proyecto Node.
     *
     * @return array<string,mixed>
     */
    public function getAuthenticatedUserContext(int $userId): array
    {
        $user = User::find($userId);

        if (!$user || !$user->is_active) {
            throw new HttpError(403, 'User account is inactive or no longer exists');
        }

        return (new AccessControlService())->buildUserAccessProfile($user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    public function getJwtSecret(): string
    {
        return $this->jwtSecret;
    }
}
