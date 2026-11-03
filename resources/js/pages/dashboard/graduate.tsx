import { Head, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CalendarDays,
    Clock3,
    GraduationCap,
    MapPin,
    Sparkles,
    TrendingUp,
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
    status: string;
    status_label: string;
    status_tone: string;
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
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
};

type ProgramGroup = {
    type: string;
    label: string;
    items: Array<{
        id: number;
        name: string;
        description: string | null;
        duration: string | null;
        modality: string;
    }>;
};

type Props = {
    profile: Profile | null;
    summary: {
        average: number | null;
        subjects_count: number;
        credits_total: number;
        programs_count: number;
    };
    enrollments: Enrollment[];
    programs: ProgramGroup[];
};

function formatGrade(grade: number | null): string {
    return grade === null
        ? '—'
        : `${grade.toFixed(1).replace('.', ',')} / 10`;
}

/**
 * Panel del graduado: récord académico y oferta de formación continua.
 */
export default function GraduateDashboard({
    profile,
    summary,
    enrollments,
    programs,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title="Mi comunidad" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Comunidad de graduados"
                    title={`Bienvenido, ${auth.user?.name.split(' ')[0] ?? 'graduado'}`}
                    description="Tu historia académica y las oportunidades para seguir creciendo profesionalmente con la UPEL."
                    actions={
                        <RoleBadge
                            role={auth.user?.portal_role}
                            label={auth.user?.portal_role_label}
                        />
                    }
                />

                <section
                    aria-label="Resumen del graduado"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Promedio general"
                        value={
                            summary.average !== null
                                ? `${summary.average.toFixed(1).replace('.', ',')} / 10`
                                : '—'
                        }
                        hint="Promedio de tus materias culminadas"
                        icon={TrendingUp}
                        tone="gold"
                    />
                    <StatCard
                        label="Materias culminadas"
                        value={summary.subjects_count}
                        hint="Materias con nota registrada"
                        icon={BookOpen}
                        tone="green"
                    />
                    <StatCard
                        label="Créditos académicos"
                        value={summary.credits_total}
                        hint="Créditos acumulados en tu récord"
                        icon={GraduationCap}
                        tone="blue"
                    />
                    <StatCard
                        label="Programas disponibles"
                        value={summary.programs_count}
                        hint="Especializaciones, maestrías, cursos y talleres"
                        icon={Award}
                        tone="navy"
                    />
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <section
                        id="record"
                        className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                            <div>
                                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                    Récord académico
                                </p>
                                <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                                    Materias culminadas
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
                                    title="Sin materias registradas"
                                    description="Tu récord académico aparecerá aquí cuando tengas calificaciones registradas."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                            {[
                                                'Materia',
                                                'Semestre',
                                                'Período',
                                                'Créditos',
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
                                                        {enrollment.career ??
                                                            '—'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.semester ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.period ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                                    {enrollment.credits ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                                    {formatGrade(
                                                        enrollment.grade,
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ToneBadge
                                                        tone={
                                                            enrollment.status_tone as Tone
                                                        }
                                                    >
                                                        {enrollment.status_label}
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
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-[#8a6c0d]">
                                    <GraduationCap className="h-5 w-5" />
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
                                        {profile?.career ?? '—'}
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
                                        Año de grado
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {profile?.graduation_year ?? '—'}
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

                        <div className="rounded-2xl border border-upel-blue/20 bg-[linear-gradient(145deg,#0a2540,#174a7c)] p-5 text-white">
                            <div className="flex items-center gap-2 text-upel-gold-light">
                                <Sparkles className="h-4 w-4" />
                                <p className="text-xs font-bold tracking-wide uppercase">
                                    Sigue formándote
                                </p>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-white/70">
                                Como graduado UPEL puedes acceder a
                                especializaciones, maestrías, doctorados, cursos
                                y talleres diseñados para tu crecimiento
                                profesional.
                            </p>
                        </div>
                    </aside>
                </div>

                <section id="programas" className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                Formación continua
                            </p>
                            <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                Especialidades, postgrados y cursos
                            </h2>
                        </div>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            {summary.programs_count} programas
                        </span>
                    </div>

                    {programs.length === 0 ? (
                        <EmptyState
                            icon={Award}
                            title="Sin programas disponibles"
                            description="Pronto publicaremos nuevas oportunidades de formación continua."
                        />
                    ) : (
                        <div className="space-y-6">
                            {programs.map((group) => (
                                <div key={group.type}>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-upel-navy/5 text-upel-navy dark:bg-white/5 dark:text-foreground">
                                            <Award className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                            {group.label}
                                        </h3>
                                        <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                            {group.items.length} opciones
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {group.items.map((program) => (
                                            <article
                                                key={program.id}
                                                className="flex flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-card"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded-full bg-upel-gold/15 px-2.5 py-1 text-[0.6rem] font-bold tracking-wide text-[#8a6c0d] uppercase">
                                                        {group.label}
                                                    </span>
                                                    <Award className="h-4 w-4 text-upel-gold" />
                                                </div>
                                                <h4 className="mt-3 text-sm leading-snug font-bold text-upel-navy dark:text-foreground">
                                                    {program.name}
                                                </h4>
                                                {program.description ? (
                                                    <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                                                        {program.description}
                                                    </p>
                                                ) : null}
                                                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[0.65rem] font-semibold text-muted-foreground">
                                                    {program.duration ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock3 className="h-3 w-3" />
                                                            {program.duration}
                                                        </span>
                                                    ) : null}
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {program.modality}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-blue/10 text-upel-blue">
                                <CalendarDays className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    ¿Quieres actualizar tus datos?
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Mantén tu correo y teléfono al día para
                                    recibir información de la comunidad UPEL.
                                </p>
                            </div>
                        </div>
                        <a
                            href="mailto:graduados@upel.edu.ve"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground"
                        >
                            Contactar a la oficina de graduados
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
