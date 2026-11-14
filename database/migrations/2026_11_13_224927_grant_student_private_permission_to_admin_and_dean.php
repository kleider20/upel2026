<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $permissionName = 'students.private.view';
        $roleNames = ['admin', 'decano'];
        $now = now();

        DB::table($tableNames['permissions'])->insertOrIgnore([
            'name' => $permissionName,
            'guard_name' => 'web',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $permissionId = DB::table($tableNames['permissions'])
            ->where('guard_name', 'web')
            ->where('name', $permissionName)
            ->value('id');

        if ($permissionId !== null) {
            $roleIds = DB::table($tableNames['roles'])
                ->where('guard_name', 'web')
                ->whereIn('name', $roleNames)
                ->pluck('id');

            foreach ($roleIds as $roleId) {
                DB::table($tableNames['role_has_permissions'])->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
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
            ->where('name', 'students.private.view')
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
