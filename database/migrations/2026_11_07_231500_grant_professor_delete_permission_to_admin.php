<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $permissionName = 'professors.delete';
        $now = now();

        DB::table($tableNames['permissions'])->insertOrIgnore([
            'name' => $permissionName,
            'guard_name' => 'web',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $adminRoleId = DB::table($tableNames['roles'])
            ->where('name', 'admin')
            ->where('guard_name', 'web')
            ->value('id');

        if ($adminRoleId !== null) {
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

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $permissionId = DB::table($tableNames['permissions'])
            ->where('guard_name', 'web')
            ->where('name', 'professors.delete')
            ->value('id');

        if ($permissionId !== null) {
            DB::table($tableNames['role_has_permissions'])
                ->where('permission_id', $permissionId)
                ->delete();

            DB::table($tableNames['permissions'])
                ->where('id', $permissionId)
                ->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
