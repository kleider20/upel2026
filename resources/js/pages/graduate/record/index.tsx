import { Head, usePage } from '@inertiajs/react';
import { BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { StatCard } from '@/components/portal/stat-card';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import type { Auth } from '@/types';
import type {
    GraduateEnrollment,
    GraduateProfile,
    GraduateSummary,
} from '@/types/graduate';

type Props = {
    profile: GraduateProfile | null;
    summary: GraduateSummary;
    enrollments: GraduateEnrollment[];
};

function formatGrade(grade: number | null): string {
    return grade === null ? '—' : `${grade.toFixed(1).replace('.', ',')} / 10`;
}

/** Récord académico del graduado en su propia página. */
export default function GraduateRecordPage({
    profile,
    summary,
    enrollments,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title="Récord académico" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Comunidad de graduados"
                    title="Récord académico"
                    description="Materias culminadas, créditos y calificaciones de tu trayectoria en la UPEL."
                />

                <section
                    aria-label="Resumen del récord"
                    className="grid gap-4 sm:grid-cols-3"
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
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
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

                    <aside className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
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
                                            tone={profile.status_tone as Tone}
                                        >
                                            {profile.status_label}
                                        </ToneBadge>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>
            </div>
        </>
    );
}
