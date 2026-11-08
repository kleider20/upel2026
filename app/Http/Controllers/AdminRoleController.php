<?php

namespace App\Http\Controllers;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Spatie\Permission\Models\Role as SpatieRole;

class AdminRoleController extends Controller
{
    /**
     * Muestra roles, permisos y asignaciones de usuarios.
     */
    public function index(Request $request): Response
    {
        $this->authorizeManage($request);

        $user = $request->user();
        $isAdmin = $user?->hasRole(RoleEnum::Admin->value) ?? false;
        $systemPermissions = PermissionEnum::values(PermissionEnum::system());
        $roles = SpatieRole::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get();
        $permissions = SpatiePermission::query()
            ->where('guard_name', 'web')
            ->with(['roles:id,name', 'users:id,name'])
            ->orderBy('name')
            ->get();
        $users = User::query()
            ->with(['roles:id,name', 'permissions:id,name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/roles/index', [
            'is_admin' => $isAdmin,
            'roles' => $roles->map(fn (SpatieRole $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => RoleEnum::tryFrom($role->name)?->label() ?? $role->name,
                'description' => RoleEnum::tryFrom($role->name)?->description() ?? 'Rol personalizado',
                'is_system' => RoleEnum::tryFrom($role->name) !== null,
                'permissions' => $role->permissions->pluck('id')->map(static fn ($id): int => (int) $id)->values(),
                'users_count' => $role->users_count,
                'can_manage' => $this->canManageRole($user, $role),
                'can_assign' => $isAdmin || (
                    ! in_array($role->name, [RoleEnum::Admin->value, RoleEnum::Decano->value], true)
                    && $role->permissions->pluck('name')->intersect($systemPermissions)->isEmpty()
                ),
                'can_delete' => $this->canManageRole($user, $role)
                    && RoleEnum::tryFrom($role->name) === null
                    && $role->users_count === 0,
                'update_url' => route('admin.roles.update', $role),
                'delete_url' => route('admin.roles.destroy', $role),
            ])->values(),
            'permissions' => $permissions->map(fn (SpatiePermission $permission): array => [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => PermissionEnum::tryFrom($permission->name)?->label() ?? $permission->name,
                'is_system' => PermissionEnum::tryFrom($permission->name) !== null,
                'can_assign' => $isAdmin || ! in_array($permission->name, $systemPermissions, true),
                'can_manage' => $isAdmin || $this->canManagePermission($user, $permission),
                'can_delete' => PermissionEnum::tryFrom($permission->name) === null
                    && ($isAdmin || $this->canManagePermission($user, $permission)),
                'update_url' => route('admin.permissions.update', $permission),
                'delete_url' => route('admin.permissions.destroy', $permission),
            ])->values(),
            'users' => $users->map(fn (User $target): array => [
                'id' => $target->id,
                'name' => $target->name,
                'email' => $target->email,
                'roles' => $target->roles->pluck('id')->map(static fn ($id): int => (int) $id)->values(),
                'permissions' => $target->permissions->pluck('id')->map(static fn ($id): int => (int) $id)->values(),
                'is_current' => $user?->is($target) ?? false,
                'can_manage' => $this->canManageUser($user, $target),
                'update_url' => route('admin.roles.users.update', $target),
            ])->values(),
            'create_role_url' => route('admin.roles.store'),
            'create_permission_url' => route('admin.permissions.store'),
        ]);
    }

    /**
     * Crea un rol con sus permisos iniciales.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/\A[a-z][a-z0-9_]*\z/',
                Rule::unique('roles')->where('guard_name', 'web'),
            ],
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('permissions', 'id')->where('guard_name', 'web'),
            ],
        ]);

        $permissions = SpatiePermission::query()->whereKey($validated['permissions'])->get();

        if ($this->hasForbiddenPermissions($request, $permissions->pluck('name')->all())) {
            return back()->withErrors([
                'permissions' => 'No puedes asignar permisos de administración del sistema.',
            ]);
        }

        DB::transaction(function () use ($validated, $permissions): void {
            $role = SpatieRole::query()->create([
                'name' => $validated['name'],
                'guard_name' => 'web',
            ]);
            $role->syncPermissions($permissions);
        });

        return back()->with('success', 'El rol fue creado correctamente.');
    }

    /**
     * Actualiza el nombre y los permisos de un rol.
     */
    public function update(Request $request, SpatieRole $role): RedirectResponse
    {
        $this->authorizeManage($request);
        abort_unless($this->canManageRole($request->user(), $role), 403, 'No puedes modificar este rol.');

        $rules = [
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('permissions', 'id')->where('guard_name', 'web'),
            ],
        ];

        if (RoleEnum::tryFrom($role->name) === null) {
            $rules['name'] = [
                'required',
                'string',
                'max:100',
                'regex:/\A[a-z][a-z0-9_]*\z/',
                Rule::unique('roles')->where('guard_name', 'web')->ignore($role->id),
            ];
        }

        $validated = $request->validate($rules);
        $permissions = SpatiePermission::query()->whereKey($validated['permissions'])->get();

        if ($this->hasForbiddenPermissions($request, $permissions->pluck('name')->all())) {
            return back()->withErrors([
                'permissions' => 'No puedes asignar permisos de administración del sistema.',
            ]);
        }

        if ($role->name === RoleEnum::Admin->value) {
            $requiredPermissions = SpatiePermission::query()
                ->where('guard_name', 'web')
                ->whereIn('name', PermissionEnum::values(PermissionEnum::cases()))
                ->get();
            $permissions = $permissions
                ->merge($requiredPermissions)
                ->unique('id')
                ->values();
        }

        DB::transaction(function () use ($role, $validated, $permissions): void {
            if (isset($validated['name'])) {
                $role->name = $validated['name'];
                $role->save();
            }

            $role->syncPermissions($permissions);
        });

        return back()->with('success', 'El rol fue actualizado correctamente.');
    }

    /**
     * Elimina un rol personalizado que no esté asignado.
     */
    public function destroy(Request $request, SpatieRole $role): RedirectResponse
    {
        $this->authorizeManage($request);
        abort_unless($this->canManageRole($request->user(), $role), 403, 'No puedes eliminar este rol.');
        abort_if(
            RoleEnum::tryFrom($role->name) !== null,
            403,
            'Los roles base del sistema no se pueden eliminar.',
        );

        if ($role->users()->exists()) {
            return back()->withErrors([
                'role' => 'No se puede eliminar un rol que está asignado a usuarios.',
            ]);
        }

        $role->delete();

        return back()->with('success', 'El rol fue eliminado correctamente.');
    }

    /**
     * Crea un permiso personalizado.
     */
    public function storePermission(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/\A[a-z][a-z0-9_.-]*\z/',
                Rule::unique('permissions')->where('guard_name', 'web'),
            ],
        ]);

        SpatiePermission::query()->create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        return back()->with('success', 'El permiso fue creado correctamente.');
    }

    /**
     * Renombra un permiso personalizado que no afecte cuentas protegidas.
     */
    public function updatePermission(Request $request, SpatiePermission $permission): RedirectResponse
    {
        $this->authorizeManage($request);
        abort_unless($this->canManagePermission($request->user(), $permission), 403, 'No puedes modificar este permiso.');
        abort_if(
            PermissionEnum::tryFrom($permission->name) !== null,
            403,
            'Los permisos base del sistema no se pueden renombrar.',
        );

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/\A[a-z][a-z0-9_.-]*\z/',
                Rule::unique('permissions')->where('guard_name', 'web')->ignore($permission->id),
            ],
        ]);

        $permission->update(['name' => $validated['name']]);

        return back()->with('success', 'El permiso fue actualizado correctamente.');
    }

    /**
     * Elimina un permiso personalizado que no afecte cuentas protegidas.
     */
    public function destroyPermission(Request $request, SpatiePermission $permission): RedirectResponse
    {
        $this->authorizeManage($request);
        abort_unless($this->canManagePermission($request->user(), $permission), 403, 'No puedes eliminar este permiso.');
        abort_if(
            PermissionEnum::tryFrom($permission->name) !== null,
            403,
            'Los permisos base del sistema no se pueden eliminar.',
        );

        $permission->delete();

        return back()->with('success', 'El permiso fue eliminado correctamente.');
    }

    /**
     * Actualiza los roles y permisos directos de un usuario.
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'roles' => ['present', 'array'],
            'roles.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('roles', 'id')->where('guard_name', 'web'),
            ],
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('permissions', 'id')->where('guard_name', 'web'),
            ],
        ]);

        abort_unless($this->canManageUser($request->user(), $user), 403, 'No puedes modificar este usuario.');

        $roles = SpatieRole::query()->whereKey($validated['roles'])->with('permissions')->get();
        $permissions = SpatiePermission::query()->whereKey($validated['permissions'])->get();
        $isAdmin = $request->user()?->hasRole(RoleEnum::Admin->value) ?? false;
        $currentRoleNames = $user->roles->pluck('name');
        $currentPermissionNames = $user->permissions->pluck('name');
        $newRoles = $roles->reject(
            static fn (SpatieRole $role): bool => $currentRoleNames->contains($role->name),
        );
        $newPermissionNames = $permissions->pluck('name')
            ->diff($currentPermissionNames)
            ->merge($newRoles->flatMap(
                static fn (SpatieRole $role) => $role->permissions->pluck('name'),
            ))
            ->unique()
            ->values()
            ->all();

        if (! $isAdmin && $newRoles->contains(
            static fn (SpatieRole $role): bool => in_array($role->name, [
                RoleEnum::Admin->value,
                RoleEnum::Decano->value,
            ], true),
        )) {
            return back()->withErrors([
                'roles' => 'Solo el administrador puede asignar los roles de administrador o decano.',
            ]);
        }

        if ($request->user()?->is($user)
            && $user->hasRole(RoleEnum::Admin->value)
            && ! $roles->contains('name', RoleEnum::Admin->value)) {
            return back()->withErrors([
                'roles' => 'No puedes quitarte tu propio rol de administrador.',
            ]);
        }

        if ($this->hasForbiddenPermissions($request, $newPermissionNames)) {
            return back()->withErrors([
                'permissions' => 'No puedes asignar permisos de administración del sistema.',
            ]);
        }

        DB::transaction(function () use ($user, $roles, $permissions): void {
            $user->syncRoles($roles);
            $user->syncPermissions($permissions);
        });

        return back()->with('success', 'Los accesos del usuario fueron actualizados correctamente.');
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(PermissionEnum::RolesManage->value),
            403,
            'No tienes permiso para gestionar roles y permisos.',
        );
    }

    private function canManageRole(?User $actor, SpatieRole $role): bool
    {
        if ($actor?->hasRole(RoleEnum::Admin->value)) {
            return true;
        }

        if ($actor === null || in_array($role->name, [
            RoleEnum::Admin->value,
            RoleEnum::Decano->value,
        ], true)) {
            return false;
        }

        return ! $role->users()
            ->where(function ($query) use ($actor): void {
                $query->whereKey($actor->getKey())
                    ->orWhereHas('roles', static fn ($query) => $query->whereIn('name', [
                        RoleEnum::Admin->value,
                        RoleEnum::Decano->value,
                    ]));
            })
            ->exists();
    }

    private function canManagePermission(?User $actor, SpatiePermission $permission): bool
    {
        if ($actor?->hasRole(RoleEnum::Admin->value)) {
            return true;
        }

        if ($actor === null) {
            return false;
        }

        $protectedRoleNames = [RoleEnum::Admin->value, RoleEnum::Decano->value];

        return ! $permission->roles()
            ->where(function ($query) use ($actor, $protectedRoleNames): void {
                $query->whereIn('roles.name', $protectedRoleNames)
                    ->orWhereHas('users', function ($query) use ($actor): void {
                        $query->whereKey($actor->getKey())
                            ->orWhereHas('roles', static fn ($query) => $query->whereIn('name', [
                                RoleEnum::Admin->value,
                                RoleEnum::Decano->value,
                            ]));
                    });
            })
            ->exists()
            && ! $permission->users()
                ->where(function ($query) use ($actor): void {
                    $query->whereKey($actor->getKey())
                        ->orWhereHas('roles', static fn ($query) => $query->whereIn('name', [
                            RoleEnum::Admin->value,
                            RoleEnum::Decano->value,
                        ]));
                })
                ->exists();
    }

    private function canManageUser(?User $actor, User $target): bool
    {
        return $actor?->hasRole(RoleEnum::Admin->value)
            || ($actor !== null
                && $actor->isNot($target)
                && ! $target->hasRole(RoleEnum::Admin->value));
    }

    /**
     * @param  array<int, string>  $permissionNames
     */
    private function hasForbiddenPermissions(Request $request, array $permissionNames): bool
    {
        if ($request->user()?->hasRole(RoleEnum::Admin->value)) {
            return false;
        }

        $restricted = PermissionEnum::values(PermissionEnum::system());

        return array_intersect($permissionNames, $restricted) !== [];
    }
}
