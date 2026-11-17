import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    ClipboardCheck,
    ClipboardList,
    FileSearch,
    FileText,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import studentRoutes from '@/routes/student';
import type { StudentEnrollmentNotice } from '@/types/student';

export type StudentTab =
    | 'inicio'
    | 'inscripciones'
    | 'solicitud'
    | 'materias'
    | 'calificaciones'
    | 'profesores'
    | 'pensum'
    | 'horario'
    | 'perfil'
    | 'tramites';

/**
 * URL de cada módulo del portal. Cada elemento de la barra lateral es una
 * página independiente, no una pestaña dentro del mismo componente.
 */
export const studentTabHrefs: Record<StudentTab, string> = {
    inicio: studentRoutes.dashboard.url(),
    inscripciones: studentRoutes.enrollment.index.url(),
    solicitud: studentRoutes.solicitud.url(),
    materias: studentRoutes.materias.url(),
    calificaciones: studentRoutes.calificaciones.url(),
    profesores: studentRoutes.profesores.url(),
    pensum: studentRoutes.pensum.url(),
    horario: studentRoutes.horario.url(),
    perfil: studentRoutes.perfil.url(),
    tramites: studentRoutes.tramites.url(),
};

type SidebarProps = {
    activeTab: StudentTab;
    mobileOpen: boolean;
    onCloseMobile: () => void;
};

const mainMenuItems: { id: StudentTab; label: string; icon: LucideIcon }[] = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    {
        id: 'inscripciones',
        label: 'Inscripción de Materias',
        icon: ClipboardCheck,
    },
    { id: 'solicitud', label: 'Mi Solicitud', icon: FileSearch },
    { id: 'materias', label: 'Mis Materias', icon: BookOpen },
    { id: 'calificaciones', label: 'Mis Calificaciones', icon: ClipboardList },
    { id: 'profesores', label: 'Mis Profesores', icon: Users },
    { id: 'pensum', label: 'Mi Carrera y Pénsum', icon: GraduationCap },
    { id: 'horario', label: 'Mi Horario', icon: Calendar },
];

const accountMenuItems: { id: StudentTab; label: string; icon: LucideIcon }[] =
    [
        { id: 'perfil', label: 'Mi Perfil', icon: User },
        { id: 'tramites', label: 'Mis Trámites', icon: FileText },
    ];

export function Sidebar({
    activeTab,
    mobileOpen,
    onCloseMobile,
}: SidebarProps) {
    const { studentEnrollment } = usePage<{
        studentEnrollment: StudentEnrollmentNotice;
    }>().props;
    const enrollmentVisible =
        studentEnrollment.is_open || studentEnrollment.submitted;

    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-upel-navy/60 backdrop-blur-sm lg:hidden print:hidden"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-border bg-upel-navy text-white transition-transform duration-300 lg:translate-x-0 print:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Header */}
                <div className="flex h-[74px] items-center gap-3 border-b border-white/10 px-6">
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
                            Portal Estudiantil
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="space-y-1">
                        <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-white/45 uppercase">
                            Mi vida académica
                        </p>
                        {mainMenuItems.map((item) => {
                            if (
                                item.id === 'inscripciones' &&
                                !enrollmentVisible
                            ) {
                                return null;
                            }

                            const isActive = activeTab === item.id;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={studentTabHrefs[item.id]}
                                    onClick={onCloseMobile}
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
                                    {item.id === 'inscripciones' &&
                                    studentEnrollment.is_open ? (
                                        <span
                                            className="ml-auto h-1.5 w-1.5 rounded-full bg-upel-gold"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-8 space-y-1">
                        <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-white/45 uppercase">
                            Cuenta y Servicios
                        </p>
                        {accountMenuItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={studentTabHrefs[item.id]}
                                    onClick={onCloseMobile}
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
                                    {item.id === 'inscripciones' &&
                                    studentEnrollment.is_open ? (
                                        <span
                                            className="ml-auto h-1.5 w-1.5 rounded-full bg-upel-gold"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                        <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        <span>Cerrar sesión</span>
                    </button>
                    <div className="mt-3 border-t border-white/10 px-3 pt-3 text-[0.62rem] leading-relaxed text-white/45">
                        <p className="font-semibold">
                            Universidad Pedagógica Experimental Libertador
                        </p>
                        <p className="mt-0.5 text-upel-gold-light">
                            2026-II · v2.7
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
