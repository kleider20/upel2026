import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { ModuleIcon } from '@/components/admin/module-icon';
import { FlashMessages } from '@/components/flash-messages';
import { RoleBadge } from '@/components/portal/role-badge';
import { UpelLogo } from '@/components/landing/brand';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { landing, logout } from '@/routes';
import { index as admissionsIndex } from '@/routes/admin/admissions';
import {
    create as careersCreate,
    index as careersIndex,
} from '@/routes/admin/careers';
import {
    create as subjectsCreate,
    index as subjectsIndex,
} from '@/routes/admin/subjects';
import {
    dashboard as adminDashboard,
    module as adminModule,
} from '@/routes/admin';
import type { Auth, NavItem } from '@/types';

type AdminNavItem = NavItem & {
    permission: string;
    iconName: string;
};

type AdminNavGroup = {
    label: string;
    items: AdminNavItem[];
};

const navigation: AdminNavGroup[] = [
    {
        label: 'General',
        items: [
            {
                title: 'Resumen',
                href: adminDashboard(),
                permission: 'dashboard.view',
                iconName: 'dashboard',
            },
        ],
    },
    {
        label: 'Académico',
        items: [
            {
                title: 'Admisiones',
                href: admissionsIndex(),
                permission: 'admissions.view',
                iconName: 'inbox',
            },
            {
                title: 'Estudiantes',
                href: adminModule('students'),
                permission: 'students.view',
                iconName: 'users',
            },
            {
                title: 'Profesores',
                href: adminModule('professors'),
                permission: 'professors.view',
                iconName: 'graduation-cap',
            },
            {
                title: 'Notas',
                href: adminModule('grades'),
                permission: 'grades.view',
                iconName: 'clipboard-list',
            },
            {
                title: 'Postgrados y cursos',
                href: adminModule('programs'),
                permission: 'programs.view',
                iconName: 'award',
            },
        ],
    },
    {
        label: 'Carreras',
        items: [
            {
                title: 'Listar carreras',
                href: careersIndex(),
                permission: 'careers.view',
                iconName: 'library',
            },
            {
                title: 'Agregar carrera',
                href: careersCreate(),
                permission: 'careers.manage',
                iconName: 'plus-circle',
            },
        ],
    },
    {
        label: 'Materias',
        items: [
            {
                title: 'Listar materias',
                href: subjectsIndex(),
                permission: 'subjects.view',
                iconName: 'book-open',
            },
            {
                title: 'Agregar materia',
                href: subjectsCreate(),
                permission: 'subjects.manage',
                iconName: 'plus-circle',
            },
        ],
    },
    {
        label: 'Administración',
        items: [
            {
                title: 'Finanzas',
                href: adminModule('finance'),
                permission: 'finance.view',
                iconName: 'wallet',
            },
        ],
    },
    {
        label: 'Sistema',
        items: [
            {
                title: 'Usuarios',
                href: adminModule('users'),
                permission: 'users.view',
                iconName: 'user-cog',
            },
            {
                title: 'Roles y permisos',
                href: adminModule('roles'),
                permission: 'roles.manage',
                iconName: 'shield-check',
            },
        ],
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const getInitials = useInitials();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const permissions = auth.user?.permissions ?? [];
    const visibleGroups = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                permissions.includes(item.permission),
            ),
        }))
        .filter((group) => group.items.length > 0);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-upel-cloud text-foreground dark:bg-background">
            {sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="fixed inset-0 z-40 bg-upel-navy/50 backdrop-blur-sm lg:hidden"
                    onClick={closeSidebar}
                />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-upel-navy text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
                    <Link
                        href={adminDashboard()}
                        onClick={closeSidebar}
                        className="flex items-center gap-3"
                    >
                        <span className="flex h-11 items-center rounded-xl bg-white px-3 shadow-sm">
                            <UpelLogo className="h-8" />
                        </span>
                    </Link>

                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                        onClick={closeSidebar}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-[0.62rem] font-bold tracking-[0.2em] text-upel-gold-light uppercase">
                        Portal administrativo
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/90">
                        {auth.user?.name}
                    </p>
                    <RoleBadge
                        role={auth.user?.portal_role}
                        label={auth.user?.portal_role_label}
                        className="mt-2 bg-white/10 text-white ring-white/20"
                    />
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                    {visibleGroups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 text-[0.6rem] font-bold tracking-[0.18em] text-white/40 uppercase">
                                {group.label}
                            </p>
                            <div className="mt-2 space-y-1">
                                {group.items.map((item) => {
                                    const active = isCurrentOrParentUrl(
                                        item.href,
                                    );

                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={closeSidebar}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                                                active
                                                    ? 'bg-white text-upel-navy shadow-sm'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                                            )}
                                        >
                                            <ModuleIcon
                                                name={item.iconName}
                                                className="h-4 w-4 shrink-0"
                                            />
                                            <span>{item.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <Link
                        href={landing.url()}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al portal web
                    </Link>
                    <button
                        type="button"
                        onClick={() => router.post(logout.url())}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-red-500/15 hover:text-red-200"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <div className="lg:pl-72">
                <FlashMessages />
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:bg-background/85">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Abrir menú"
                            className="rounded-lg border border-border p-2 text-upel-navy transition-colors hover:bg-upel-cloud lg:hidden dark:text-foreground"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-[0.62rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                                Universidad Pedagógica Experimental Libertador
                            </p>
                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                Gestión institucional
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                {auth.user?.name}
                            </p>
                            <p className="text-[0.65rem] font-semibold text-muted-foreground">
                                {auth.user?.portal_role_label}
                            </p>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-upel-navy text-xs font-bold text-white">
                            {getInitials(auth.user?.name ?? 'UP')}
                        </span>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
