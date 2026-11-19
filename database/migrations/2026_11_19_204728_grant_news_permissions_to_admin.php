<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Registra los permisos de noticias y se los otorga al administrador.
     */
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $permissionNames = ['news.view', 'news.manage'];
        $now = now();

        foreach ($permissionNames as $permissionName) {
            DB::table($tableNames['permissions'])->insertOrIgnore([
                'name' => $permissionName,
                'guard_name' => 'web',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $adminRoleId = DB::table($tableNames['roles'])
            ->where('name', 'admin')
            ->where('guard_name', 'web')
            ->value('id');

        if ($adminRoleId !== null) {
            foreach ($permissionNames as $permissionName) {
                $permissionId = DB::table($tableNames['permissions'])
                    ->where('guard_name', 'web')
                    ->where('name', $permissionName)
                    ->value('id');

                if ($permissionId !== null) {
                    DB::table($tableNames['role_has_permissions'])->insertOrIgnore([
                        'permission_id' => $permissionId,
                        'role_id' => $adminRoleId,
                    ]);
                }
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $permissionNames = ['news.view', 'news.manage'];

        foreach ($permissionNames as $permissionName) {
            $permissionId = DB::table($tableNames['permissions'])
                ->where('guard_name', 'web')
                ->where('name', $permissionName)
                ->value('id');

            if ($permissionId !== null) {
                DB::table($tableNames['role_has_permissions'])
                    ->where('permission_id', $permissionId)
                    ->delete();

                DB::table($tableNames['permissions'])
                    ->where('id', $permissionId)
                    ->delete();
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
