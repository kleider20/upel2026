import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    KeyRound,
    Loader2,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { dashboard as adminDashboard } from '@/routes/admin';

type Permission = {
    id: number;
    name: string;
    label: string;
    is_system: boolean;
    can_assign: boolean;
    can_manage: boolean;
    can_delete: boolean;
    update_url: string;
    delete_url: string;
};

type Role = {
    id: number;
    name: string;
    label: string;
    description: string;
    is_system: boolean;
    permissions: number[];
    users_count: number;
    can_manage: boolean;
    can_assign: boolean;
    can_delete: boolean;
    update_url: string;
    delete_url: string;
};

type User = {
    id: number;
    name: string;
    email: string;
    roles: number[];
    permissions: number[];
    is_current: boolean;
    can_manage: boolean;
    update_url: string;
};

type Props = {
    is_admin: boolean;
    roles: Role[];
    permissions: Permission[];
    users: User[];
    create_role_url: string;
    create_permission_url: string;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';
const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

function PermissionCheckbox({
    permission,
    checked,
    disabled,
    onChange,
}: {
    permission: Permission;
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label
            className={`flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
        >
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 size-3.5 accent-upel-blue"
            />
            <span className="min-w-0">
                <span className="block font-bold text-foreground">
                    {permission.label}
                </span>
                <span className="mt-0.5 block text-[0.62rem] break-all text-muted-foreground">
                    {permission.name}
                </span>
            </span>
        </label>
    );
}

function RoleCard({
    role,
    permissions,
}: {
    role: Role;
    permissions: Permission[];
}) {
    const form = useForm<{ name: string; permissions: number[] }>({
        name: role.name,
        permissions: role.permissions,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(role.update_url, { preserveScroll: true });
    };

    const remove = () => {
        if (
            window.confirm(
                `¿Eliminar el rol "${role.label}"? Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(role.delete_url, { preserveScroll: true });
        }
    };

    return (
        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                        {role.label}
                    </h3>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                        {role.description}
                    </p>
                    <p className="mt-1 text-[0.62rem] font-semibold text-muted-foreground">
                        {role.users_count} usuario
                        {role.users_count === 1 ? '' : 's'} ·{' '}
                        {role.permissions.length} permisos
                    </p>
                </div>
                {role.can_delete ? (
                    <button
                        type="button"
                        onClick={remove}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[0.65rem] font-bold text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="size-3.5" />
                        Eliminar
                    </button>
                ) : null}
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
                {role.can_manage && !role.is_system ? (
                    <div>
                        <label
                            htmlFor={`role-name-${role.id}`}
                            className={labelClass}
                        >
                            Identificador del rol
                        </label>
                        <input
                            id={`role-name-${role.id}`}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className={inputClass}
                        />
                        <InputError
                            message={form.errors.name}
                            className="mt-1"
                        />
                    </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {permissions.map((permission) => {
                        const checked = form.data.permissions.includes(
                            permission.id,
                        );
                        const requiredAdminPermission =
                            role.name === 'admin' && permission.is_system;

                        return (
                            <PermissionCheckbox
                                key={permission.id}
                                permission={permission}
                                checked={checked}
                                disabled={
                                    !role.can_manage ||
                                    requiredAdminPermission ||
                                    (!checked && !permission.can_assign)
                                }
                                onChange={(isChecked) =>
                                    form.setData(
                                        'permissions',
                                        isChecked
                                            ? [
                                                  ...form.data.permissions,
                                                  permission.id,
                                              ]
                                            : form.data.permissions.filter(
                                                  (id) => id !== permission.id,
                                              ),
                                    )
                                }
                            />
                        );
                    })}
                </div>
                <InputError
                    message={form.errors.permissions}
                    className="text-xs"
                />
                {role.can_manage ? (
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                    >
                        {form.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        Guardar permisos
                    </button>
                ) : (
                    <p className="text-[0.65rem] font-semibold text-amber-700">
                        Este rol está protegido; solo puedes consultar sus
                        permisos.
                    </p>
                )}
            </form>
        </section>
    );
}

function UserAccessEditor({
    users,
    roles,
    permissions,
    is_admin,
}: {
    users: User[];
    roles: Role[];
    permissions: Permission[];
    is_admin: boolean;
}) {
    const manageableUser = users.find((user) => user.can_manage);
    const [selectedId, setSelectedId] = useState<number | null>(
        manageableUser?.id ?? users[0]?.id ?? null,
    );
    const selectedUser = users.find((user) => user.id === selectedId) ?? null;
    const form = useForm<{ roles: number[]; permissions: number[] }>({
        roles: selectedUser?.roles ?? [],
        permissions: selectedUser?.permissions ?? [],
    });

    const selectUser = (userId: number) => {
        const nextUser = users.find((user) => user.id === userId);
        setSelectedId(userId);
        form.setData({
            roles: nextUser?.roles ?? [],
            permissions: nextUser?.permissions ?? [],
        });
        form.clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedUser !== null) {
            form.put(selectedUser.update_url, { preserveScroll: true });
        }
    };

    if (selectedUser === null) {
        return (
            <p className="rounded-xl border border-border p-4 text-xs text-muted-foreground">
                No hay usuarios registrados para administrar.
            </p>
        );
    }

    return (
        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div>
                    <label htmlFor="access-user" className={labelClass}>
                        Usuario
                    </label>
                    <select
                        id="access-user"
                        value={selectedUser.id}
                        onChange={(event) =>
                            selectUser(Number(event.target.value))
                        }
                        className={inputClass}
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} · {user.email}
                                {user.can_manage ? '' : ' · protegido'}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-[0.68rem] text-muted-foreground">
                        Asigna roles y permisos directos a este usuario.
                    </p>
                </div>

                {selectedUser.can_manage ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <p className={labelClass}>Roles asignados</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {roles.map((role) => {
                                    const checked = form.data.roles.includes(
                                        role.id,
                                    );
                                    const restrictedRole =
                                        !is_admin &&
                                        !role.can_assign &&
                                        !checked;
                                    const requiredAdminRole =
                                        selectedUser.is_current &&
                                        role.name === 'admin' &&
                                        checked;

                                    return (
                                        <label
                                            key={role.id}
                                            className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={
                                                    restrictedRole ||
                                                    requiredAdminRole
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'roles',
                                                        event.target.checked
                                                            ? [
                                                                  ...form.data
                                                                      .roles,
                                                                  role.id,
                                                              ]
                                                            : form.data.roles.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      role.id,
                                                              ),
                                                    )
                                                }
                                                className="size-3.5 accent-upel-blue"
                                            />
                                            <span className="font-bold text-foreground">
                                                {role.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <InputError
                                message={form.errors.roles}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <p className={labelClass}>Permisos directos</p>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {permissions.map((permission) => {
                                    const checked =
                                        form.data.permissions.includes(
                                            permission.id,
                                        );

                                    return (
                                        <PermissionCheckbox
                                            key={permission.id}
                                            permission={permission}
                                            checked={checked}
                                            disabled={
                                                !permission.can_assign &&
                                                !checked
                                            }
                                            onChange={(isChecked) =>
                                                form.setData(
                                                    'permissions',
                                                    isChecked
                                                        ? [
                                                              ...form.data
                                                                  .permissions,
                                                              permission.id,
                                                          ]
                                                        : form.data.permissions.filter(
                                                              (id) =>
                                                                  id !==
                                                                  permission.id,
                                                          ),
                                                )
                                            }
                                        />
                                    );
                                })}
                            </div>
                            <InputError
                                message={form.errors.permissions}
                                className="mt-1"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                        >
                            {form.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Guardar accesos del usuario
                        </button>
                    </form>
                ) : (
                    <p className="self-center rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
                        No puedes modificar tus propios accesos ni los del
                        administrador.
                    </p>
                )}
            </div>
        </section>
    );
}

export default function AdminRolesIndex({
    is_admin,
    roles,
    permissions,
    users,
    create_role_url,
    create_permission_url,
}: Props) {
    const createRole = useForm<{ name: string; permissions: number[] }>({
        name: '',
        permissions: [],
    });
    const createPermission = useForm<{ name: string }>({ name: '' });

    const submitRole = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createRole.post(create_role_url, {
            preserveScroll: true,
            onSuccess: () => createRole.reset(),
        });
    };

    const submitPermission = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createPermission.post(create_permission_url, {
            preserveScroll: true,
            onSuccess: () => createPermission.reset(),
        });
    };

    return (
        <>
            <Head title="Roles y permisos" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Administración del sistema"
                    title="Roles y permisos"
                    description={
                        is_admin
                            ? 'Crea roles y permisos, y administra los accesos de cualquier usuario.'
                            : 'Administra roles y permisos sin modificar tus propios accesos ni los del administrador.'
                    }
                    actions={
                        <Link
                            href={adminDashboard()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            Volver al panel
                        </Link>
                    }
                />

                <section className="grid gap-4 xl:grid-cols-2">
                    <form
                        onSubmit={submitRole}
                        className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card"
                    >
                        <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                            <ShieldCheck className="size-4 text-upel-blue" />
                            Crear rol
                        </h2>
                        <div className="mt-4">
                            <label
                                htmlFor="new-role-name"
                                className={labelClass}
                            >
                                Identificador (minúsculas, números y guion bajo)
                            </label>
                            <input
                                id="new-role-name"
                                value={createRole.data.name}
                                onChange={(event) =>
                                    createRole.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <InputError
                                message={createRole.errors.name}
                                className="mt-1"
                            />
                        </div>
                        <p className={`${labelClass} mt-4`}>
                            Permisos iniciales
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {permissions.map((permission) => (
                                <PermissionCheckbox
                                    key={permission.id}
                                    permission={permission}
                                    checked={createRole.data.permissions.includes(
                                        permission.id,
                                    )}
                                    disabled={!permission.can_assign}
                                    onChange={(checked) =>
                                        createRole.setData(
                                            'permissions',
                                            checked
                                                ? [
                                                      ...createRole.data
                                                          .permissions,
                                                      permission.id,
                                                  ]
                                                : createRole.data.permissions.filter(
                                                      (id) =>
                                                          id !== permission.id,
                                                  ),
                                        )
                                    }
                                />
                            ))}
                        </div>
                        <InputError
                            message={createRole.errors.permissions}
                            className="mt-1"
                        />
                        <button
                            type="submit"
                            disabled={createRole.processing}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                        >
                            {createRole.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-4" />
                            )}
                            Crear rol
                        </button>
                    </form>

                    <form
                        onSubmit={submitPermission}
                        className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card"
                    >
                        <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                            <KeyRound className="size-4 text-upel-blue" />
                            Crear permiso
                        </h2>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            Los permisos base están vinculados a funciones del
                            sistema y no se renombran.
                        </p>
                        <div className="mt-4">
                            <label
                                htmlFor="new-permission-name"
                                className={labelClass}
                            >
                                Identificador del permiso
                            </label>
                            <input
                                id="new-permission-name"
                                value={createPermission.data.name}
                                onChange={(event) =>
                                    createPermission.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="reportes.exportar"
                            />
                            <InputError
                                message={createPermission.errors.name}
                                className="mt-1"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={createPermission.processing}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                        >
                            {createPermission.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-4" />
                            )}
                            Crear permiso
                        </button>
                    </form>
                </section>

                <section className="space-y-4">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                        <ShieldCheck className="size-4 text-upel-blue" />
                        Roles del sistema
                    </h2>
                    {roles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            permissions={permissions}
                        />
                    ))}
                </section>

                <section className="space-y-4">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                        <KeyRound className="size-4 text-upel-blue" />
                        Permisos disponibles
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {permissions.map((permission) => (
                            <PermissionRow
                                key={permission.id}
                                permission={permission}
                            />
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                        <Users className="size-4 text-upel-blue" />
                        Accesos de usuarios
                    </h2>
                    <UserAccessEditor
                        users={users}
                        roles={roles}
                        permissions={permissions}
                        is_admin={is_admin}
                    />
                </section>
            </div>
        </>
    );
}

function PermissionRow({ permission }: { permission: Permission }) {
    const form = useForm<{ name: string }>({ name: permission.name });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(permission.update_url, { preserveScroll: true });
    };

    const remove = () => {
        if (
            window.confirm(
                `¿Eliminar el permiso "${permission.name}"? Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(permission.delete_url, { preserveScroll: true });
        }
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-xl border border-border/70 bg-white p-4 dark:bg-card"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-bold break-all text-foreground">
                        {permission.name}
                    </p>
                    <p className="mt-1 text-[0.62rem] text-muted-foreground">
                        {permission.is_system
                            ? 'Permiso base del sistema'
                            : 'Permiso personalizado'}
                    </p>
                </div>
                {permission.can_delete ? (
                    <button
                        type="button"
                        onClick={remove}
                        aria-label={`Eliminar ${permission.name}`}
                        className="rounded-lg p-1.5 text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                ) : null}
            </div>
            {permission.can_manage && !permission.is_system ? (
                <div className="mt-3 flex gap-2">
                    <input
                        aria-label={`Nombre de ${permission.name}`}
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        className={`${inputClass} h-9`}
                    />
                    <button
                        type="submit"
                        disabled={form.processing}
                        aria-label={`Guardar ${permission.name}`}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-upel-navy text-white hover:bg-upel-navy-800 disabled:opacity-50"
                    >
                        {form.processing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Check className="size-3.5" />
                        )}
                    </button>
                </div>
            ) : null}
        </form>
    );
}
