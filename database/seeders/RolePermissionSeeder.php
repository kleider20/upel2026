<?php

namespace Database\Seeders;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Crea los roles y permisos base del sistema.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $permission) {
            Permission::findOrCreate($permission->value, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPermissions = PermissionEnum::values(PermissionEnum::cases());
        $academicPermissions = PermissionEnum::values(PermissionEnum::academic());
        $financePermissions = PermissionEnum::values(PermissionEnum::finance());

        $roles = [
            RoleEnum::Estudiante->value => [
                PermissionEnum::StudentPortal->value,
            ],
            RoleEnum::Profesor->value => [
                PermissionEnum::ProfessorPortal->value,
            ],
            RoleEnum::Graduado->value => [
                PermissionEnum::GraduatePortal->value,
            ],
            RoleEnum::Admin->value => $allPermissions,
            RoleEnum::Decano->value => array_values(array_unique([
                ...$academicPermissions,
                ...$financePermissions,
                PermissionEnum::StudentsView->value,
                PermissionEnum::StudentsViewPrivate->value,
                PermissionEnum::AdmissionsView->value,
                PermissionEnum::AdmissionsReview->value,
                PermissionEnum::RolesManage->value,
            ])),
            RoleEnum::CoordinadorAcademico->value => $academicPermissions,
            RoleEnum::PersonalAdministrativo->value => $financePermissions,
        ];

        foreach ($roles as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
