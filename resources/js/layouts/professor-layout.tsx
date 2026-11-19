import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    LayoutDashboard,
    Menu,
    UserRound,
    Users,
} from 'lucide-react';
import { FlashMessages } from '@/components/flash-messages';
import {
    PortalSidebar,
    type PortalNavSection,
} from '@/components/portal/portal-sidebar';
import { useInitials } from '@/hooks/use-initials';
import { dashboard, landing } from '@/routes';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';
import profile from '@/routes/professor/profile';
import type { Auth } from '@/types';

type NavItem = {
    label: string;
    icon: typeof LayoutDashboard;
    href: string;
    matches: (url: string) => boolean;
};

const catedraMenuItems: NavItem[] = [
    {
        label: 'Resumen',
        icon: LayoutDashboard,
        href: dashboard.url(),
        matches: (url) => url === '/dashboard' || url.startsWith('/dashboard?'),
    },
    {
        label: 'Estudiantes',
        icon: Users,
        href: professorRoutes.students.url(),
        matches: (url) => url.startsWith('/dashboard/profesor/estudiantes'),
    },
    {
        label: 'Cargar notas',
        icon: ClipboardList,
        href: professorRoutes.grades.index.url(),
        matches: (url) => url.startsWith('/dashboard/profesor/cargar-notas'),
    },
    {
        label: 'Mis carreras',
        icon: BookOpen,
        href: professorRoutes.careers.url(),
        matches: (url) => url.startsWith('/dashboard/profesor/mis-carreras'),
    },
    {
        label: 'Mi horario',
        icon: CalendarDays,
        href: professorRoutes.schedule.url(),
        matches: (url) => url.startsWith('/dashboard/profesor/horario'),
    },
    {
        label: 'Planes de evaluación',
        icon: ClipboardCheck,
        href: plans.index.url(),
        matches: (url) =>
            url.startsWith('/dashboard/profesor/planes-evaluacion'),
    },
];

const accountMenuItems: NavItem[] = [
    {
        label: 'Mi perfil',
        icon: UserRound,
        href: profile.edit.url(),
        matches: (url) => url.startsWith('/dashboard/profesor/perfil'),
    },
];

/** Título de la cabecera según la página abierta. */
const pageTitle = (url: string): string => {
    const item = [...catedraMenuItems, ...accountMenuItems].find((menuItem) =>
        menuItem.matches(url),
    );

    return item?.label === 'Resumen'
        ? 'Mi cátedra'
        : (item?.label ?? 'Mi cátedra');
};

/**
 * Estructura visual del portal docente: misma barra lateral que el resto de los
 * portales, con los enlaces propios del rol. Cada elemento abre su propia página.
 */
export default function ProfessorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = auth.user;
    const activeItem = [...catedraMenuItems, ...accountMenuItems].find((item) =>
        item.matches(page.url),
    );

    const toSection = (label: string, items: NavItem[]): PortalNavSection => ({
        label,
        items: items.map((item) => ({
            key: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
        })),
    });

    const sections: PortalNavSection[] = [
        toSection('Mi cátedra', catedraMenuItems),
        toSection('Cuenta', accountMenuItems),
    ];

    return (
        <div className="min-h-screen bg-upel-cloud dark:bg-background print:bg-white">
            <FlashMessages />

            <PortalSidebar
                portalLabel="Portal Docente"
                sections={sections}
                activeKey={activeItem?.href ?? null}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
                footerExtra={
                    <Link
                        href={landing.url()}
                        onClick={() => setMobileOpen(false)}
                        className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span>Portal web</span>
                    </Link>
                }
            />

            <div className="mx-auto lg:pl-[268px] print:pl-0">
                <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-4 border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:bg-card/90 print:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-upel-navy hover:bg-upel-cloud lg:hidden dark:text-foreground dark:hover:bg-muted"
                            aria-label="Abrir menú"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <span className="text-[0.62rem] font-bold tracking-[0.14em] text-upel-blue uppercase">
                                Portal Docente
                            </span>
                            <h2 className="font-display text-lg font-bold text-upel-navy sm:text-xl dark:text-foreground">
                                {pageTitle(page.url)}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                {user?.name ?? 'Profesor UPEL'}
                            </p>
                            <p className="text-[0.65rem] font-semibold text-muted-foreground">
                                {user?.portal_role_label ?? 'Profesor'}
                            </p>
                        </div>
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={`Fotografía de ${user.name}`}
                                className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-border"
                            />
                        ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                                {getInitials(user?.name ?? 'UP')}
                            </span>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
