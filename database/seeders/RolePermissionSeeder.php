<?php

namespace Database\Seeders;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    use SyncsRolePermissions;

    /**
     * Crea los permisos del sistema y sincroniza los roles con sus permisos.
     */
    public function run(): void
    {
        $this->forgetPermissionCache();

        foreach (PermissionEnum::cases() as $permission) {
            Permission::findOrCreate($permission->value, self::SYNC_GUARD);
        }

        $this->forgetPermissionCache();

        $this->syncRolesPermissions(RoleEnum::cases());

        $this->forgetPermissionCache();
    }
}
