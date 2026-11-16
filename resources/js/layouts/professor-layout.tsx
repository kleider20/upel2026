import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Users,
    X,
} from 'lucide-react';
import { FlashMessages } from '@/components/flash-messages';
import { RoleBadge } from '@/components/portal/role-badge';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard, landing, logout } from '@/routes';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';
import type { Auth } from '@/types';

type NavItem = {
    label: string;
    icon: typeof LayoutDashboard;
    href: string;
    matches: (url: string) => boolean;
};

const mainMenuItems: NavItem[] = [
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
        matches: (url) => url.startsWith('/dashboard/estudiantes'),
    },
    {
        label: 'Cargar notas',
        icon: ClipboardList,
        href: professorRoutes.grades.index.url(),
        matches: (url) => url.startsWith('/dashboard/cargar-notas'),
    },
    {
        label: 'Mis carreras',
        icon: BookOpen,
        href: professorRoutes.careers.url(),
        matches: (url) => url.startsWith('/dashboard/mis-carreras'),
    },
];

/**
 * Título de la cabecera según la página abierta.
 */
const pageTitle = (url: string): string => {
    if (url.startsWith('/dashboard/planes-evaluacion')) {
        return 'Planes de evaluación';
    }

    const item = mainMenuItems.find((menuItem) => menuItem.matches(url));

    return item?.label === 'Resumen'
        ? 'Mi cátedra'
        : (item?.label ?? 'Mi cátedra');
};

/**
 * Estructura visual del portal docente: barra lateral institucional, cabecera
 * fija y área de contenido con el mismo espaciado del resto de los portales.
 * Cada elemento del menú abre su propia página.
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
    const isPlansPage = page.url.startsWith('/dashboard/planes-evaluacion');

    return (
        <div className="min-h-screen bg-upel-cloud dark:bg-background">
            <FlashMessages />

            {mobileOpen ? (
                <div
                    className="fixed inset-0 z-40 bg-upel-navy/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-border bg-upel-navy text-white transition-transform duration-300 lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex h-[74px] items-center justify-between gap-3 border-b border-white/10 px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                            <img
                                src="/images/upel-mark.png"
                                alt="UPEL"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="font-display text-base font-bold tracking-wide text-white">
                                UPEL
                            </h1>
                            <p className="text-[0.65rem] font-semibold text-white/60">
                                Portal Docente
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-[0.62rem] font-bold tracking-[0.2em] text-upel-gold-light uppercase">
                        Docente
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white/90">
                        {user?.name ?? 'Profesor UPEL'}
                    </p>
                    <RoleBadge
                        role={user?.portal_role}
                        label={user?.portal_role_label}
                        className="mt-2 bg-white/10 text-white ring-white/20"
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-white/45 uppercase">
                        Mi cátedra
                    </p>
                    <div className="space-y-1">
                        {mainMenuItems.map((item) => {
                            const isActive = item.matches(page.url);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200',
                                        isActive
                                            ? 'bg-[linear-gradient(135deg,#c9a227_0%,#e8c15a_100%)] text-upel-navy shadow-[0_10px_25px_-10px_rgba(201,162,39,0.7)]'
                                            : 'text-white/80 hover:bg-white/8 hover:text-white',
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-4 w-4 shrink-0',
                                            isActive
                                                ? 'text-upel-navy'
                                                : 'text-white/60 group-hover:text-white',
                                        )}
                                    />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <Link
                            href={plans.index.url()}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200',
                                isPlansPage
                                    ? 'bg-[linear-gradient(135deg,#c9a227_0%,#e8c15a_100%)] text-upel-navy shadow-[0_10px_25px_-10px_rgba(201,162,39,0.7)]'
                                    : 'text-white/80 hover:bg-white/8 hover:text-white',
                            )}
                        >
                            <ClipboardCheck
                                className={cn(
                                    'h-4 w-4 shrink-0',
                                    isPlansPage
                                        ? 'text-upel-navy'
                                        : 'text-white/60 group-hover:text-white',
                                )}
                            />
                            <span>Planes de evaluación</span>
                        </Link>
                    </div>
                </div>

                <div className="border-t border-white/10 p-4">
                    <a
                        href={landing.url()}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span>Portal web</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => router.post(logout.url())}
                        className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                        <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        <span>Cerrar sesión</span>
                    </button>
                    <div className="mt-3 border-t border-white/10 px-3 pt-3 text-[0.62rem] leading-relaxed text-white/45">
                        <p className="font-semibold">
                            Universidad Pedagógica Experimental Libertador
                        </p>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-[268px]">
                <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-4 border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:bg-card/90">
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
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                            {getInitials(user?.name ?? 'UP')}
                        </span>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
