<?php

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('deans can manage ordinary roles and users without changing protected access', function () {
    $dean = User::factory()->create();
    $dean->assignRole(RoleEnum::Decano->value);

    $administrator = User::factory()->create();
    $administrator->assignRole(RoleEnum::Admin->value);

    $target = User::factory()->create();
    $target->assignRole(RoleEnum::Estudiante->value);

    $academicRole = Role::query()->where('name', RoleEnum::CoordinadorAcademico->value)->firstOrFail();
    $adminRole = Role::query()->where('name', RoleEnum::Admin->value)->firstOrFail();
    $deanRole = Role::query()->where('name', RoleEnum::Decano->value)->firstOrFail();
    $studentRole = Role::query()->where('name', RoleEnum::Estudiante->value)->firstOrFail();
    $studentsView = Permission::findByName(PermissionEnum::StudentsView->value, 'web');
    $admissionsView = Permission::findByName(PermissionEnum::AdmissionsView->value, 'web');
    $rolesManage = Permission::findByName(PermissionEnum::RolesManage->value, 'web');

    $this->actingAs($dean)
        ->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/roles/index')
            ->where('is_admin', false)
            ->has('roles', 7)
            ->has('permissions')
            ->has('users')
        );

    $this->actingAs($dean)
        ->put(route('admin.roles.update', $academicRole), [
            'permissions' => [$studentsView->id],
        ])
        ->assertSessionHasNoErrors();

    expect($academicRole->fresh()->hasPermissionTo(PermissionEnum::StudentsView->value))->toBeTrue();

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [$studentRole->id],
            'permissions' => [$admissionsView->id],
        ])
        ->assertSessionHasNoErrors();

    expect($target->fresh()->hasDirectPermission(PermissionEnum::AdmissionsView->value))->toBeTrue();

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $dean), [
            'roles' => [$deanRole->id],
            'permissions' => [],
        ])
        ->assertForbidden();

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $administrator), [
            'roles' => [$adminRole->id],
            'permissions' => [],
        ])
        ->assertForbidden();

    $this->actingAs($dean)
        ->put(route('admin.roles.update', $adminRole), [
            'permissions' => [],
        ])
        ->assertForbidden();

    $this->actingAs($dean)
        ->put(route('admin.roles.update', $deanRole), [
            'permissions' => [],
        ])
        ->assertForbidden();
});

test('deans cannot grant administrator roles or system permissions', function () {
    $dean = User::factory()->create();
    $dean->assignRole(RoleEnum::Decano->value);

    $target = User::factory()->create();
    $target->assignRole(RoleEnum::Estudiante->value);

    $adminRole = Role::query()->where('name', RoleEnum::Admin->value)->firstOrFail();
    $deanRole = Role::query()->where('name', RoleEnum::Decano->value)->firstOrFail();
    $usersManage = Permission::findByName(PermissionEnum::UsersManage->value, 'web');

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [$adminRole->id],
            'permissions' => [],
        ])
        ->assertSessionHasErrors('roles');

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [$deanRole->id],
            'permissions' => [],
        ])
        ->assertSessionHasErrors('roles');

    $this->actingAs($dean)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [Role::query()->where('name', RoleEnum::Estudiante->value)->value('id')],
            'permissions' => [$usersManage->id],
        ])
        ->assertSessionHasErrors('permissions');

    expect($target->fresh()->hasRole(RoleEnum::Estudiante->value))->toBeTrue()
        ->and($target->fresh()->hasRole(RoleEnum::Admin->value))->toBeFalse()
        ->and($target->fresh()->hasRole(RoleEnum::Decano->value))->toBeFalse()
        ->and($target->fresh()->hasDirectPermission(PermissionEnum::UsersManage->value))->toBeFalse();
});

test('administrators can create and edit roles permissions and user access', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::Admin->value);
    $adminRole = Role::findByName(RoleEnum::Admin->value, 'web');

    $target = User::factory()->create();
    $target->assignRole(RoleEnum::Estudiante->value);

    $this->actingAs($admin)
        ->put(route('admin.roles.update', $adminRole), [
            'permissions' => [],
        ])
        ->assertSessionHasNoErrors();

    expect($adminRole->fresh()->permissions->pluck('name')->all())
        ->toEqualCanonicalizing(PermissionEnum::values(PermissionEnum::cases()));

    $this->actingAs($admin)
        ->put(route('admin.roles.users.update', $admin), [
            'roles' => [],
            'permissions' => [],
        ])
        ->assertSessionHasErrors('roles');

    expect($admin->fresh()->hasRole(RoleEnum::Admin->value))->toBeTrue();

    $studentsView = Permission::findByName(PermissionEnum::StudentsView->value, 'web');
    $rolesManage = Permission::findByName(PermissionEnum::RolesManage->value, 'web');
    $usersManage = Permission::findByName(PermissionEnum::UsersManage->value, 'web');

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => 'auditoria',
            'permissions' => [$studentsView->id],
        ])
        ->assertSessionHasNoErrors();

    $role = Role::query()->where('name', 'auditoria')->firstOrFail();

    $this->actingAs($admin)
        ->put(route('admin.roles.update', $role), [
            'name' => 'auditoria_academica',
            'permissions' => [$rolesManage->id],
        ])
        ->assertSessionHasNoErrors();

    $role->refresh();

    expect($role->name)->toBe('auditoria_academica')
        ->and($role->hasPermissionTo(PermissionEnum::RolesManage->value))->toBeTrue();

    $this->actingAs($admin)
        ->post(route('admin.permissions.store'), [
            'name' => 'reportes.exportar',
        ])
        ->assertSessionHasNoErrors();

    $customPermission = Permission::query()->where('name', 'reportes.exportar')->firstOrFail();

    $this->actingAs($admin)
        ->put(route('admin.permissions.update', $customPermission), [
            'name' => 'reportes.generar',
        ])
        ->assertSessionHasNoErrors();

    $customPermission->refresh();

    $this->actingAs($admin)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [$role->id],
            'permissions' => [$customPermission->id, $usersManage->id],
        ])
        ->assertSessionHasNoErrors();

    expect($target->fresh()->hasRole('auditoria_academica'))->toBeTrue()
        ->and($target->fresh()->hasDirectPermission('reportes.generar'))->toBeTrue()
        ->and($target->fresh()->hasDirectPermission(PermissionEnum::UsersManage->value))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('admin.roles.users.update', $target), [
            'roles' => [],
            'permissions' => [],
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->delete(route('admin.roles.destroy', $role))
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->delete(route('admin.permissions.destroy', $customPermission))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    $this->assertDatabaseMissing('permissions', ['id' => $customPermission->id]);

    expect(Role::findByName(RoleEnum::Admin->value, 'web')
        ->hasPermissionTo(PermissionEnum::SettingsManage->value))->toBeTrue();
});
