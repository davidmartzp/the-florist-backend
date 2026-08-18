<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = ['email', 'first_name', 'last_name', 'password_hash', 'is_active'];

    protected $hidden = [
        'password_hash',
        'reset_password_token_hash',
        'reset_password_expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsToMany */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }
}
