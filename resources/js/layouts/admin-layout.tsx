import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { ModuleIcon } from '@/components/admin/module-icon';
import { ReviewNotifications } from '@/components/admin/review-notifications';
import { FlashMessages } from '@/components/flash-messages';
import {
    PortalSidebar,
    type PortalNavSection,
} from '@/components/portal/portal-sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { toUrl } from '@/lib/utils';
import { landing } from '@/routes';
import {
    dashboard as adminDashboard,
    module as adminModule,
} from '@/routes/admin';
import { index as admissionsIndex } from '@/routes/admin/admissions';
import { index as bannersIndex } from '@/routes/admin/banners';
import { index as newsIndex } from '@/routes/admin/news';
import { index as inscripcionesIndex } from '@/routes/admin/inscripciones';
import { index as preinscripcionesIndex } from '@/routes/admin/preinscripciones';
import { index as classroomsIndex } from '@/routes/admin/classrooms';
import {
    create as careersCreate,
    index as careersIndex,
} from '@/routes/admin/careers';
import {
    create as schedulesCreate,
    index as schedulesIndex,
} from '@/routes/admin/schedules';
import { index as pensumsIndex } from '@/routes/admin/pensums';
import {
    create as subjectsCreate,
    index as subjectsIndex,
} from '@/routes/admin/subjects';
import type { AdminReviewRequestsData, Auth, NavItem } from '@/types';

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
            {
                title: 'Gestionar pensums',
                href: pensumsIndex(),
                permission: 'subjects.view',
                iconName: 'layers',
            },
        ],
    },
    {
        label: 'Horarios',
        items: [
            {
                title: 'Listar horarios',
                href: schedulesIndex(),
                permission: 'schedules.view',
                iconName: 'calendar-days',
            },
            {
                title: 'Publicar horario',
                href: schedulesCreate(),
                permission: 'schedules.manage',
                iconName: 'plus-circle',
            },
            {
                title: 'Aulas',
                href: classroomsIndex(),
                permission: 'schedules.view',
                iconName: 'library',
            },
        ],
    },
    {
        label: 'Publicaciones',
        items: [
            {
                title: 'Publicaciones de banner',
                href: bannersIndex(),
                permission: 'banners.view',
                iconName: 'images',
            },
            {
                title: 'Noticias y novedades',
                href: newsIndex(),
                permission: 'news.view',
                iconName: 'newspaper',
            },
        ],
    },
    {
        label: 'Inscripciones',
        items: [
            {
                title: 'Habilitar Inscripciones',
                href: inscripcionesIndex(),
                permission: 'admissions.window',
                iconName: 'calendar-days',
            },
            {
                title: 'Habilitar Preinscripciones',
                href: preinscripcionesIndex(),
                permission: 'admissions.window',
                iconName: 'calendar-days',
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
    const { auth, adminReviewRequests } = usePage<{
        auth: Auth;
        adminReviewRequests: AdminReviewRequestsData;
    }>().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const getInitials = useInitials();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const permissions = auth.user?.permissions ?? [];
    const pendingStudents = adminReviewRequests?.pending_students ?? 0;
    const visibleGroups = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                permissions.includes(item.permission),
            ),
        }))
        .filter((group) => group.items.length > 0);

    // Enlace que corresponde exactamente a la página actual. Cuando varias
    // rutas comparten prefijo ("/admin/careers" y "/admin/careers/create")
    // gana la más específica, así que sólo se resalta un elemento del menú.
    const activeHref = visibleGroups
        .flatMap((group) => group.items)
        .map((item) => toUrl(item.href))
        .filter((href) => isCurrentOrParentUrl(href))
        .reduce<string | null>(
            (longest, href) =>
                longest === null || href.length > longest.length
                    ? href
                    : longest,
            null,
        );

    const sections: PortalNavSection[] = visibleGroups.map((group) => {
        const hasPending = group.items.some(
            (item) => item.permission === 'students.view',
        );
        const pendingLabel = `${pendingStudents} estudiantes con solicitudes pendientes`;

        return {
            label: group.label,
            // Todos los grupos del portal son menús principales: se resaltan
            // para diferenciarlos de los enlaces (submenú) que contienen.
            featured: true,
            collapsible: true,
            badge:
                hasPending && pendingStudents > 0 ? (
                    <span
                        className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[0.55rem] font-extrabold text-white normal-case"
                        aria-label={pendingLabel}
                    >
                        {pendingStudents > 99 ? '99+' : pendingStudents}
                    </span>
                ) : undefined,
            items: group.items.map((item) => {
                const href = toUrl(item.href);
                const showPending =
                    item.permission === 'students.view' && pendingStudents > 0;

                return {
                    key: href,
                    label: item.title,
                    href,
                    icon: ({ className }) => (
                        <ModuleIcon
                            name={item.iconName}
                            className={className}
                        />
                    ),
                    badge: showPending ? (
                        <span
                            className="ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[0.62rem] font-extrabold text-white"
                            aria-label={pendingLabel}
                        >
                            {pendingStudents > 99 ? '99+' : pendingStudents}
                        </span>
                    ) : undefined,
                };
            }),
        };
    });

    return (
        <div className="min-h-screen bg-upel-cloud text-foreground dark:bg-background print:bg-white">
            <FlashMessages />

            <PortalSidebar
                portalLabel="Portal administrativo"
                sections={sections}
                activeKey={activeHref}
                mobileOpen={sidebarOpen}
                onCloseMobile={() => setSidebarOpen(false)}
                footerExtra={
                    <Link
                        href={landing.url()}
                        onClick={() => setSidebarOpen(false)}
                        className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ModuleIcon
                            name="library"
                            className="h-4 w-4 shrink-0"
                        />
                        <span>Volver al portal web</span>
                    </Link>
                }
            />

            <div className="lg:pl-[268px] print:pl-0">
                <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-4 border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:bg-card/90 print:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Abrir menú"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-upel-navy hover:bg-upel-cloud lg:hidden dark:text-foreground dark:hover:bg-muted"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <span className="text-[0.62rem] font-bold tracking-[0.14em] text-upel-blue uppercase">
                                Portal administrativo
                            </span>
                            <h2 className="font-display text-lg font-bold text-upel-navy sm:text-xl dark:text-foreground">
                                Gestión institucional
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ReviewNotifications requests={adminReviewRequests} />
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                {auth.user?.name}
                            </p>
                            <p className="text-[0.65rem] font-semibold text-muted-foreground">
                                {auth.user?.portal_role_label}
                            </p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                            {getInitials(auth.user?.name ?? 'UP')}
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
