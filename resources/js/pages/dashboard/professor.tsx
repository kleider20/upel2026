import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    GraduationCap,
    Users,
} from 'lucide-react';
import type { ProfessorCareer } from '@/components/professor/workspace-types';
import { PageHeader } from '@/components/portal/page-header';
import { RoleBadge } from '@/components/portal/role-badge';
import { StatCard } from '@/components/portal/stat-card';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';
import type { Auth } from '@/types';

type Props = {
    profile: {
        employee_code: string;
        department: string | null;
        academic_title: string | null;
    } | null;
    summary: {
        careers_count: number;
        subjects_count: number;
        students_count: number;
        pending_count: number;
        graded_count: number;
        average: number | null;
    };
    careers: ProfessorCareer[];
    active_period?: string | null;
};

/**
 * Resumen del docente: sus cifras, datos profesionales y accesos a las demás
 * páginas del portal (estudiantes, carga de notas y planes de evaluación).
 */
export default function ProfessorDashboard({
    profile,
    summary,
    careers,
    active_period,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const accesses = [
        {
            title: 'Cargar notas',
            description:
                'Planilla por evaluación de cada materia: una columna por evaluación del plan, con su definitiva.',
            href: professorRoutes.grades.index.url(),
            icon: ClipboardList,
            action: 'Abrir planilla',
        },
        {
            title: 'Estudiantes',
            description:
                'Nota final del expediente por estudiante y acceso directo a su planilla de evaluación.',
            href: professorRoutes.students.url(),
            icon: Users,
            action: 'Ver estudiantes',
        },
        {
            title: 'Planes de evaluación',
            description:
                'Materias asignadas por el horario, su ponderación y la vista previa del plan de cada una.',
            href: plans.index.url(),
            icon: ClipboardCheck,
            action: 'Revisar planes',
        },
    ];

    return (
        <>
            <Head title="Mi cátedra" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Resumen de la cátedra"
                    title={`Hola, ${auth.user?.name ?? 'profesor'}`}
                    description="Gestiona tus materias, revisa a tus estudiantes y registra las calificaciones del período."
                    actions={
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <RoleBadge
                                role={auth.user?.portal_role}
                                label={auth.user?.portal_role_label}
                            />
                            {active_period ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-cloud px-3 py-1 text-[0.68rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    Período {active_period}
                                </span>
                            ) : null}
                        </div>
                    }
                />

                <section
                    aria-label="Resumen de cátedra"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Carreras"
                        value={summary.careers_count}
                        hint="Carreras donde impartes clases"
                        icon={GraduationCap}
                        tone="blue"
                    />
                    <StatCard
                        label="Materias"
                        value={summary.subjects_count}
                        hint="Asignaturas a tu cargo"
                        icon={BookOpen}
                        tone="navy"
                    />
                    <StatCard
                        label="Estudiantes"
                        value={summary.students_count}
                        hint="Estudiantes en tus materias"
                        icon={Users}
                        tone="green"
                    />
                    <StatCard
                        label="Notas pendientes"
                        value={summary.pending_count}
                        hint={`${summary.graded_count} notas ya registradas`}
                        icon={ClipboardList}
                        tone="amber"
                    />
                </section>

                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Datos del profesor
                            </p>
                            <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                                {auth.user?.name}
                            </p>
                            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Código
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {profile?.employee_code ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Departamento
                                    </dt>
                                    <dd className="max-w-[150px] text-right font-bold text-upel-navy dark:text-foreground">
                                        {profile?.department ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Título
                                    </dt>
                                    <dd className="max-w-[150px] text-right font-bold text-upel-navy dark:text-foreground">
                                        {profile?.academic_title ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Promedio de notas
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {summary.average !== null
                                            ? `${summary.average.toFixed(1).replace('.', ',')} / 10`
                                            : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Mis carreras
                            </p>
                            {careers.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-dashed border-border bg-upel-cloud/60 px-3 py-4 text-center dark:bg-muted/30">
                                    <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                        Pendiente por asignación
                                    </p>
                                    <p className="mt-1 text-[0.62rem] leading-relaxed text-muted-foreground">
                                        El decano te asignará materias y
                                        carreras al publicar tu horario.
                                    </p>
                                </div>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {careers.map((career) => (
                                        <li
                                            key={career.id}
                                            className="rounded-xl bg-upel-cloud/50 px-3 py-2.5 dark:bg-muted/30"
                                        >
                                            <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                                {career.name}
                                            </p>
                                            <p className="mt-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                                                {career.students_count}{' '}
                                                estudiantes ·{' '}
                                                {career.subjects.length}{' '}
                                                materias
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link
                                href={professorRoutes.careers.url()}
                                className="mt-3 inline-flex items-center gap-1.5 text-[0.66rem] font-bold text-upel-blue transition-colors hover:text-upel-navy dark:hover:text-foreground"
                            >
                                Ver mis carreras
                                <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </aside>

                    <section className="space-y-4">
                        <div>
                            <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                Accesos rápidos
                            </p>
                            <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                ¿Qué necesitas hacer hoy?
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {accesses.map((access) => {
                                const Icon = access.icon;

                                return (
                                    <Link
                                        key={access.title}
                                        href={access.href}
                                        className="group flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-colors hover:border-upel-blue/50 hover:bg-upel-cloud/40 dark:bg-card dark:hover:bg-muted/30"
                                    >
                                        <div>
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy text-upel-gold shadow-sm">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                                                {access.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                {access.description}
                                            </p>
                                        </div>
                                        <span className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-upel-blue transition-colors group-hover:text-upel-navy dark:group-hover:text-foreground">
                                            {access.action}
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="rounded-2xl border border-upel-green/20 bg-upel-green/5 p-5">
                            <div className="flex items-center gap-2 text-upel-green">
                                <CheckCircle2 className="h-4 w-4" />
                                <p className="text-xs font-bold tracking-wide uppercase">
                                    Registro de calificaciones
                                </p>
                            </div>
                            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                                Las notas por evaluación se cargan en{' '}
                                <strong>Cargar notas</strong> y quedan en el
                                plan de evaluación de cada materia. La nota
                                final del expediente se consulta en{' '}
                                <strong>Estudiantes</strong>.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
