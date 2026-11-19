<?php

namespace Database\Seeders\Concerns;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Centraliza la sincronización de roles, permisos y usuarios en los seeders.
 *
 * @mixin Seeder
 */
trait SyncsRolePermissions
{
    /**
     * Guard usado por los roles y permisos del sistema.
     */
    protected const SYNC_GUARD = 'web';

    /**
     * Invalida la caché de permisos de Spatie.
     */
    protected function forgetPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Crea los permisos declarados en el enum que aún no existan.
     */
    protected function syncPermissions(): void
    {
        foreach (PermissionEnum::cases() as $permission) {
            Permission::findOrCreate($permission->value, self::SYNC_GUARD);
        }

        $this->forgetPermissionCache();
    }

    /**
     * Crea el rol del enum si no existe y lo devuelve.
     */
    protected function syncRole(RoleEnum $role): Role
    {
        return Role::findOrCreate($role->value, self::SYNC_GUARD);
    }

    /**
     * Crea el rol y sincroniza los permisos que le corresponden.
     */
    protected function syncRolePermissions(RoleEnum $role): Role
    {
        $roleModel = $this->syncRole($role);

        $roleModel->syncPermissions($this->permissionsForRole($role));

        return $roleModel;
    }

    /**
     * Sincroniza los permisos de varios roles a la vez.
     *
     * @param  array<int, RoleEnum>  $roles
     */
    protected function syncRolesPermissions(array $roles): void
    {
        foreach ($roles as $role) {
            $this->syncRolePermissions($role);
        }

        $this->forgetPermissionCache();
    }

    /**
     * Indica si el rol ya existe con el guard del sistema.
     */
    protected function ensureRoleExists(RoleEnum $role): bool
    {
        return Role::query()
            ->where('name', $role->value)
            ->where('guard_name', self::SYNC_GUARD)
            ->exists();
    }

    /**
     * Asigna al usuario los roles indicados que ya existen en la base de datos.
     *
     * @param  array<int, RoleEnum>  $roles
     */
    protected function assignExistingRoles(User $user, array $roles): void
    {
        $names = [];

        foreach ($roles as $role) {
            if ($this->ensureRoleExists($role)) {
                $names[] = $role->value;
            }
        }

        if ($names === []) {
            throw new RuntimeException(
                'Ninguno de los roles solicitados existe. Ejecute RolePermissionSeeder antes de sembrar usuarios.',
            );
        }

        $user->syncRoles($names);
    }

    /**
     * Crea o actualiza un usuario y le asigna un único rol.
     */
    protected function createUserWithRole(string $name, string $email, string $password, RoleEnum $role): User
    {
        return $this->createUserWithRoles($name, $email, $password, [$role]);
    }

    /**
     * Crea o actualiza un usuario y le asigna varios roles.
     *
     * @param  array<int, RoleEnum>  $roles
     */
    protected function createUserWithRoles(string $name, string $email, string $password, array $roles): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
            ],
        );

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $this->assignExistingRoles($user, $roles);

        return $user;
    }

    /**
     * Sincroniza los roles con sus permisos y luego crea el usuario.
     *
     * @param  array<int, RoleEnum>  $roles
     */
    protected function createUserWithRolesAndSyncPermissions(
        string $name,
        string $email,
        string $password,
        array $roles,
    ): User {
        $this->syncPermissions();
        $this->syncRolesPermissions($roles);

        return $this->createUserWithRoles($name, $email, $password, $roles);
    }

    /**
     * Permisos que corresponden a cada rol del sistema.
     *
     * @return array<int, string>
     */
    protected function permissionsForRole(RoleEnum $role): array
    {
        return match ($role) {
            RoleEnum::Admin => PermissionEnum::values(PermissionEnum::cases()),
            RoleEnum::Decano => array_values(array_unique(PermissionEnum::values([
                ...PermissionEnum::academic(),
                ...PermissionEnum::finance(),
                PermissionEnum::StudentsView,
                PermissionEnum::StudentsViewPrivate,
                PermissionEnum::AdmissionsView,
                PermissionEnum::AdmissionsReview,
                PermissionEnum::AdmissionsWindow,
                PermissionEnum::RolesManage,
            ]))),
            RoleEnum::CoordinadorAcademico => PermissionEnum::values(PermissionEnum::academic()),
            RoleEnum::PersonalAdministrativo => PermissionEnum::values(PermissionEnum::finance()),
            RoleEnum::Profesor => [PermissionEnum::ProfessorPortal->value],
            RoleEnum::Estudiante => [PermissionEnum::StudentPortal->value],
            RoleEnum::Graduado => [PermissionEnum::GraduatePortal->value],
        };
    }
}
