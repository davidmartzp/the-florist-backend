<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Utils\HttpError;
use App\Utils\ListQuery;
use Illuminate\Database\Capsule\Manager as Capsule;

class UserService
{
    private const SORT_COLUMNS = [
        'email'     => 'email',
        'firstName' => 'first_name',
        'lastName'  => 'last_name',
        'isActive'  => 'is_active',
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
    ];

    private readonly AccessControlService $acl;

    public function __construct()
    {
        $this->acl = new AccessControlService();
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    public function listUsers(array $query): array
    {
        $pagination = ListQuery::parse($query, [
            'allowedSortBy'    => array_keys(self::SORT_COLUMNS),
            'defaultSortBy'    => 'createdAt',
            'defaultSortOrder' => 'desc',
        ]);

        $col   = self::SORT_COLUMNS[$pagination['sortBy']];
        $dir   = strtoupper($pagination['sortOrder']);
        $total = User::count();

        $users = User::orderByRaw("{$col} {$dir}, id DESC")
            ->offset($pagination['offset'])
            ->limit($pagination['pageSize'])
            ->get()
            ->map(fn($u) => $this->acl->buildUserAccessProfile($u))
            ->all();

        return ListQuery::buildResponse($users, $total, $pagination);
    }

    public function getUserById(int $userId): array
    {
        return $this->acl->buildUserAccessProfile($this->findOrFail($userId));
    }

    public function getAccessControlCatalog(): array
    {
        return $this->acl->getAccessControlCatalog();
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    public function createUser(array $payload): array
    {
        $email       = $this->validateEmail($payload['email'] ?? null);
        $firstName   = $this->validateName($payload['firstName'] ?? null, 'firstName');
        $lastName    = $this->validateName($payload['lastName'] ?? null, 'lastName');
        $password    = $this->validatePassword($payload['password'] ?? null, required: true);
        $permissions = $this->acl->assertPermissionCodesExist(
            is_array($payload['permissions'] ?? null) ? $payload['permissions'] : []
        );

        if (User::where('email', $email)->exists()) {
            throw new HttpError(409, 'A user with that email already exists');
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $userId = Capsule::transaction(function () use ($email, $firstName, $lastName, $passwordHash, $permissions) {
            $user = User::create([
                'email'         => $email,
                'first_name'    => $firstName,
                'last_name'     => $lastName,
                'password_hash' => $passwordHash,
                'is_active'     => true,
            ]);

            $this->replacePermissions($user->id, $permissions);

            return $user->id;
        });

        return $this->getUserById($userId);
    }

    public function updateUser(int $userId, array $payload): array
    {
        $current     = $this->findOrFail($userId);
        $updates     = [];
        $permissions = null;

        if (array_key_exists('email', $payload)) {
            $email = $this->validateEmail($payload['email']);
            $dup   = User::where('email', $email)->first();
            if ($dup !== null && $dup->id !== $current->id) {
                throw new HttpError(409, 'A user with that email already exists');
            }
            $updates['email'] = $email;
        }

        if (array_key_exists('firstName', $payload)) {
            $updates['first_name'] = $this->validateName($payload['firstName'], 'firstName');
        }

        if (array_key_exists('lastName', $payload)) {
            $updates['last_name'] = $this->validateName($payload['lastName'], 'lastName');
        }

        if (array_key_exists('password', $payload)) {
            $password              = $this->validatePassword($payload['password'], required: true);
            $updates['password_hash'] = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        }

        if (array_key_exists('permissions', $payload)) {
            $permissions = $this->acl->assertPermissionCodesExist(
                is_array($payload['permissions']) ? $payload['permissions'] : []
            );
        }

        if (empty($updates) && $permissions === null) {
            throw new HttpError(400, 'No valid fields were provided for update');
        }

        Capsule::transaction(function () use ($userId, $updates, $permissions) {
            if (!empty($updates)) {
                User::where('id', $userId)->update($updates);
            }

            if ($permissions !== null) {
                $this->replacePermissions($userId, $permissions);
            }
        });

        return $this->getUserById($userId);
    }

    public function toggleUserActive(int $actorId, int $targetId): array
    {
        $user = $this->findOrFail($targetId);

        if ($actorId === $targetId) {
            throw new HttpError(400, 'You cannot change your own account status');
        }

        $now = \Carbon\Carbon::now();

        if ($user->is_active) {
            User::where('id', $targetId)->update([
                'is_active'                 => false,
                'deactivated_at'            => $now,
                'reset_password_token_hash' => null,
                'reset_password_expires_at' => null,
            ]);
        } else {
            User::where('id', $targetId)->update([
                'is_active'      => true,
                'deactivated_at' => null,
            ]);
        }

        return $this->getUserById($targetId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findOrFail(int $id): User
    {
        $user = User::find($id);
        if ($user === null) {
            throw new HttpError(404, 'User not found');
        }
        return $user;
    }

    private function validateEmail(mixed $email): string
    {
        $normalized = strtolower(trim((string) ($email ?? '')));
        if ($normalized === '') {
            throw new HttpError(400, 'email is required');
        }
        return $normalized;
    }

    private function validateName(mixed $value, string $field): string
    {
        $trimmed = trim((string) ($value ?? ''));
        if ($trimmed === '') {
            throw new HttpError(400, "{$field} is required");
        }
        return $trimmed;
    }

    private function validatePassword(mixed $password, bool $required): string
    {
        if ($password === null || $password === '') {
            if ($required) {
                throw new HttpError(400, 'password is required');
            }
            return '';
        }

        $str = (string) $password;
        if (strlen($str) < 8) {
            throw new HttpError(400, 'password must contain at least 8 characters');
        }

        return $str;
    }

    /** DELETE + INSERT de permisos dentro de una transacción ya abierta */
    private function replacePermissions(int $userId, array $codes): void
    {
        Capsule::table('user_permissions')->where('user_id', $userId)->delete();

        if (empty($codes)) {
            return;
        }

        // INSERT ... SELECT para resolver códigos a IDs
        $placeholders = implode(',', array_fill(0, count($codes), '?'));
        Capsule::statement(
            "INSERT INTO user_permissions (user_id, permission_id)
             SELECT ?, id FROM permissions WHERE code IN ({$placeholders})",
            array_merge([$userId], $codes)
        );
    }
}
