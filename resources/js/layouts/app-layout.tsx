import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    Menu,
    ShieldCheck,
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
import { dashboard as adminDashboard } from '@/routes/admin';
import graduateRoutes from '@/routes/graduate';
import professorRoutes from '@/routes/professor';
import professorProfile from '@/routes/professor/profile';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth } from '@/types';

/**
 * Portales sin un layout propio (graduados y páginas de cuenta) usan la misma
 * barra lateral que estudiantes, docentes y administración, con los enlaces
 * correspondientes a su rol.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = auth.user?.portal_role;
    const isGraduate = role === 'graduado';
    const isAdmin = role === 'admin';
    const isProfessor = role === 'profesor';
    const portalLabel = isGraduate
        ? 'Portal de Graduados'
        : isAdmin
          ? 'Portal administrativo'
          : isProfessor
            ? 'Portal Docente'
            : 'Portal UPEL';

    const accountItems = (profileHref: string): PortalNavSection => ({
        label: 'Cuenta y Servicios',
        items: [
            {
                key: profileHref,
                label: 'Mi perfil',
                href: profileHref,
                icon: UserRound,
            },
            {
                key: editSecurity.url(),
                label: 'Seguridad',
                href: editSecurity.url(),
                icon: ShieldCheck,
            },
        ],
    });

    const sections: PortalNavSection[] = (() => {
        if (isAdmin) {
            return [
                {
                    label: 'Gestión institucional',
                    items: [
                        {
                            key: adminDashboard.url(),
                            label: 'Resumen',
                            href: adminDashboard.url(),
                            icon: LayoutDashboard,
                        },
                    ],
                },
                accountItems(editProfile.url()),
            ];
        }

        if (isProfessor) {
            return [
                {
                    label: 'Mi cátedra',
                    items: [
                        {
                            key: dashboard.url(),
                            label: 'Resumen',
                            href: dashboard.url(),
                            icon: LayoutDashboard,
                        },
                        {
                            key: professorRoutes.students.url(),
                            label: 'Estudiantes',
                            href: professorRoutes.students.url(),
                            icon: Users,
                        },
                        {
                            key: professorRoutes.grades.index.url(),
                            label: 'Cargar notas',
                            href: professorRoutes.grades.index.url(),
                            icon: ClipboardList,
                        },
                        {
                            key: professorRoutes.careers.url(),
                            label: 'Mis carreras',
                            href: professorRoutes.careers.url(),
                            icon: BookOpen,
                        },
                    ],
                },
                accountItems(professorProfile.edit.url()),
            ];
        }

        if (isGraduate) {
            return [
                {
                    label: 'Mi comunidad',
                    items: [
                        {
                            key: dashboard.url(),
                            label: 'Resumen',
                            href: dashboard.url(),
                            icon: LayoutDashboard,
                        },
                        {
                            key: graduateRoutes.record.url(),
                            label: 'Récord académico',
                            href: graduateRoutes.record.url(),
                            icon: GraduationCap,
                        },
                        {
                            key: graduateRoutes.programs.url(),
                            label: 'Postgrados y cursos',
                            href: graduateRoutes.programs.url(),
                            icon: Award,
                        },
                    ],
                },
                accountItems(editProfile.url()),
            ];
        }

        return [
            {
                label: 'Mi campus',
                items: [
                    {
                        key: dashboard.url(),
                        label: 'Resumen',
                        href: dashboard.url(),
                        icon: LayoutDashboard,
                    },
                ],
            },
            accountItems(editProfile.url()),
        ];
    })();

    const currentUrl = page.url.split('#')[0];
    const activeItem = sections
        .flatMap((section) => section.items)
        .find((item) => item.key.split('#')[0] === currentUrl);
    const activeKey = activeItem?.key ?? null;
    const summaryTitle = isProfessor
        ? 'Mi cátedra'
        : isGraduate
          ? 'Mi comunidad'
          : 'Mi campus';
    const portalTitle = isAdmin
        ? 'Gestión institucional'
        : activeKey === dashboard.url()
          ? summaryTitle
          : (activeItem?.label ?? summaryTitle);

    return (
        <div className="min-h-screen bg-upel-cloud dark:bg-background print:bg-white">
            <FlashMessages />

            <PortalSidebar
                portalLabel={portalLabel}
                sections={sections}
                activeKey={activeKey}
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

            <div className="lg:pl-[268px] print:pl-0">
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
                                {portalLabel}
                            </span>
                            <h2 className="font-display text-lg font-bold text-upel-navy sm:text-xl dark:text-foreground">
                                {portalTitle}
                            </h2>
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
                        {auth.user?.avatar_url ? (
                            <img
                                src={auth.user.avatar_url}
                                alt={`Fotografía de ${auth.user.name}`}
                                className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-border"
                            />
                        ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                                {getInitials(auth.user?.name ?? 'UP')}
                            </span>
                        )}
                    </div>
                </header>

                <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
