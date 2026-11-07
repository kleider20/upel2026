import { Head, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    TrendingUp,
    UserRound,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { RoleBadge } from '@/components/portal/role-badge';
import { StatCard } from '@/components/portal/stat-card';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import type { Auth } from '@/types';

type Profile = {
    student_code: string;
    career: string | null;
    career_code: string | null;
    current_semester: number;
    status: string;
    status_label: string;
    status_tone: string;
    admission_year: number | null;
    graduation_year: number | null;
};

type Enrollment = {
    id: number;
    subject: string | null;
    code: string | null;
    semester: number | null;
    credits: number | null;
    career: string | null;
    period: string | null;
    professor: string | null;
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
};

type Props = {
    profile: Profile | null;
    summary: {
        average: number | null;
        subjects_count: number;
        approved_count: number;
        pending_count: number;
        credits_total: number;
        credits_approved: number;
        progress: number;
    };
    enrollments: Enrollment[];
    active_period?: string | null;
};

function formatGrade(grade: number | null): string {
    return grade === null
        ? 'Pendiente'
        : `${grade.toFixed(1).replace('.', ',')} / 10`;
}

/**
 * Panel académico del estudiante.
 */
export default function StudentDashboard({
    profile,
    summary,
    enrollments,
    active_period,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = auth.user?.name.split(' ')[0] ?? 'estudiante';

    return (
        <>
            <Head title="Mi campus" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Campus virtual"
                    title={`Hola, ${firstName}`}
                    description="Consulta tus materias, calificaciones y el avance de tu formación académica."
                    actions={
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <RoleBadge
                                role={auth.user?.portal_role}
                                label={auth.user?.portal_role_label}
                            />
                            {active_period ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-cloud px-3 py-1 text-[0.68rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Período {active_period}
                                </span>
                            ) : null}
                        </div>
                    }
                />

                <section
                    aria-label="Resumen académico"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Promedio general"
                        value={
                            summary.average !== null
                                ? `${summary.average.toFixed(1).replace('.', ',')} / 10`
                                : '—'
                        }
                        hint="Calculado sobre las notas registradas"
                        icon={TrendingUp}
                        tone="gold"
                    />
                    <StatCard
                        label="Materias aprobadas"
                        value={summary.approved_count}
                        hint={`${summary.subjects_count} materias en tu historial`}
                        icon={CheckCircle2}
                        tone="green"
                    />
                    <StatCard
                        label="En curso"
                        value={summary.pending_count}
                        hint="Materias del período actual"
                        icon={Clock3}
                        tone="amber"
                    />
                    <StatCard
                        label="Créditos aprobados"
                        value={summary.credits_approved}
                        hint={`de ${summary.credits_total} créditos registrados`}
                        icon={BookOpen}
                        tone="blue"
                    />
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <section
                        id="notas"
                        className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                            <div>
                                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                    Historial académico
                                </p>
                                <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                                    Mis materias y notas
                                </h2>
                            </div>
                            <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                                Escala 0 – 10
                            </span>
                        </div>

                        {enrollments.length === 0 ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={BookOpen}
                                    title="Aún no tienes materias"
                                    description="Cuando se registren tus inscripciones, aparecerán aquí con sus respectivas notas."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                            {[
                                                'Materia',
                                                'Semestre',
                                                'Período',
                                                'Profesor',
                                                'Nota',
                                                'Estado',
                                            ].map((label) => (
                                                <th
                                                    key={label}
                                                    scope="col"
                                                    className="px-5 py-3 text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
                                                >
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {enrollments.map((enrollment) => (
                                            <tr
                                                key={enrollment.id}
                                                className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                                        {enrollment.subject ??
                                                            'Materia'}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                                        {enrollment.code} ·{' '}
                                                        {enrollment.credits ??
                                                            0}{' '}
                                                        créditos
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.semester ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.period ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.professor ??
                                                        '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                                        {formatGrade(
                                                            enrollment.grade,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ToneBadge
                                                        tone={
                                                            enrollment.status_tone as Tone
                                                        }
                                                    >
                                                        {
                                                            enrollment.status_label
                                                        }
                                                    </ToneBadge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-blue/10 text-upel-blue">
                                    <UserRound className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                        Mi perfil
                                    </p>
                                    <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                        {auth.user?.name}
                                    </p>
                                </div>
                            </div>

                            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Carrera
                                    </dt>
                                    <dd className="max-w-[170px] text-right font-bold text-upel-navy dark:text-foreground">
                                        {profile?.career ?? 'Por asignar'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Código
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {profile?.student_code ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Semestre
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {profile?.current_semester ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Estado
                                    </dt>
                                    <dd>
                                        {profile ? (
                                            <ToneBadge
                                                tone={
                                                    profile.status_tone as Tone
                                                }
                                            >
                                                {profile.status_label}
                                            </ToneBadge>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div
                            id="record"
                            className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card"
                        >
                            <div className="flex items-center gap-2 text-upel-green">
                                <BadgeCheck className="h-4 w-4" />
                                <p className="text-xs font-bold tracking-wide uppercase">
                                    Avance del pensum
                                </p>
                            </div>
                            <p className="mt-3 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                                {summary.progress}%
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-upel-mist dark:bg-muted">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#12876f,#1e5fa8)] transition-all duration-700"
                                    style={{
                                        width: `${Math.min(summary.progress, 100)}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-3 text-[0.68rem] leading-relaxed text-muted-foreground">
                                Has aprobado {summary.credits_approved} de{' '}
                                {summary.credits_total} créditos registrados en
                                tu historial.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-upel-gold/25 bg-upel-gold/5 p-5">
                            <div className="flex items-center gap-2 text-[#8a6c0d]">
                                <GraduationCap className="h-4 w-4" />
                                <p className="text-xs font-bold tracking-wide uppercase">
                                    Escala de calificación
                                </p>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                La UPEL evalúa con una escala de 0 a 10. Se
                                considera aprobada una materia con nota igual o
                                superior a 5.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
