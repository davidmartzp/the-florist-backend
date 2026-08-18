<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use App\Utils\Fmt;
use App\Utils\HttpError;

class AccessControlService
{
    /**
     * Serializa un User de Eloquent al array que expone la API.
     * La clave `permissions` contiene los códigos: ['PRODUCTS','ORDERS'].
     *
     * @return array<string,mixed>
     */
    public function buildUserAccessProfile(User $user): array
    {
        $permissions = $user->permissions()->pluck('code')->all();

        return [
            'id'            => $user->id,
            'email'         => $user->email,
            'firstName'     => $user->first_name,
            'lastName'      => $user->last_name,
            'isActive'      => (bool) $user->is_active,
            'deactivatedAt' => Fmt::ts($user->deactivated_at),
            'createdAt'     => Fmt::ts($user->created_at),
            'updatedAt'     => Fmt::ts($user->updated_at),
            'permissions'   => $permissions,
        ];
    }

    /**
     * Verifica que todos los códigos existan en la tabla permissions.
     * Retorna el array de códigos normalizado (trim + unique).
     *
     * @param  array<mixed> $codes
     * @return string[]
     */
    public function assertPermissionCodesExist(array $codes): array
    {
        $normalized = $this->normalizeCodes($codes);

        if (empty($normalized)) {
            return [];
        }

        $found       = Permission::whereIn('code', $normalized)->pluck('code')->all();
        $foundSet    = array_flip($found);
        $unknown     = array_filter($normalized, fn($c) => !isset($foundSet[$c]));

        if (!empty($unknown)) {
            throw new HttpError(400, 'Unknown permissions: ' . implode(', ', $unknown));
        }

        return $normalized;
    }

    /**
     * Catálogo completo de permisos disponibles en el sistema.
     *
     * @return array<string,mixed>
     */
    public function getAccessControlCatalog(): array
    {
        $permissions = Permission::orderBy('code')->get(['code', 'name', 'description']);

        return [
            'permissions' => $permissions->map(fn($p) => [
                'code'        => $p->code,
                'name'        => $p->name,
                'description' => $p->description,
            ])->all(),
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** @param array<mixed> $codes @return string[] */
    private function normalizeCodes(array $codes): array
    {
        if (!is_array($codes)) {
            throw new HttpError(400, 'permissions must be an array');
        }

        return array_values(array_unique(
            array_filter(
                array_map(fn($c) => trim((string) $c), $codes),
                fn($c) => $c !== ''
            )
        ));
    }
}
