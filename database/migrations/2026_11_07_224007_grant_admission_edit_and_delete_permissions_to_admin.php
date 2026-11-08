<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $permissionNames = ['admissions.edit', 'admissions.delete'];
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
            $permissionIds = DB::table($tableNames['permissions'])
                ->where('guard_name', 'web')
                ->whereIn('name', $permissionNames)
                ->pluck('id')
                ->map(static fn ($id): array => [
                    'permission_id' => $id,
                    'role_id' => $adminRoleId,
                ])
                ->all();

            DB::table($tableNames['role_has_permissions'])->insertOrIgnore($permissionIds);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $adminRoleId = DB::table($tableNames['roles'])
            ->where('name', 'admin')
            ->where('guard_name', 'web')
            ->value('id');
        $permissionIds = DB::table($tableNames['permissions'])
            ->where('guard_name', 'web')
            ->whereIn('name', ['admissions.edit', 'admissions.delete'])
            ->pluck('id');

        if ($adminRoleId !== null) {
            DB::table($tableNames['role_has_permissions'])
                ->where('role_id', $adminRoleId)
                ->whereIn('permission_id', $permissionIds)
                ->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
