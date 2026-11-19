import { usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    ClipboardCheck,
    ClipboardList,
    FileSearch,
    FileText,
    GraduationCap,
    LayoutDashboard,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import {
    PortalSidebar,
    type PortalNavSection,
} from '@/components/portal/portal-sidebar';
import { dashboard } from '@/routes';
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
    inicio: dashboard.url(),
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

type StudentMenuItem = {
    id: StudentTab;
    label: string;
    icon: LucideIcon;
};

const mainMenuItems: StudentMenuItem[] = [
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

const accountMenuItems: StudentMenuItem[] = [
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

    const sections: PortalNavSection[] = [
        {
            label: 'Mi vida académica',
            items: mainMenuItems
                .filter(
                    (item) => item.id !== 'inscripciones' || enrollmentVisible,
                )
                .map((item) => ({
                    key: item.id,
                    label: item.label,
                    href: studentTabHrefs[item.id],
                    icon: item.icon,
                    trailing:
                        item.id === 'inscripciones' &&
                        studentEnrollment.is_open ? (
                            <span
                                className="ml-auto h-1.5 w-1.5 rounded-full bg-upel-gold"
                                aria-hidden="true"
                            />
                        ) : undefined,
                })),
        },
        {
            label: 'Cuenta y Servicios',
            items: accountMenuItems.map((item) => ({
                key: item.id,
                label: item.label,
                href: studentTabHrefs[item.id],
                icon: item.icon,
            })),
        },
    ];

    return (
        <PortalSidebar
            portalLabel="Portal Estudiantil"
            sections={sections}
            activeKey={activeTab}
            mobileOpen={mobileOpen}
            onCloseMobile={onCloseMobile}
        />
    );
}
