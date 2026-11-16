import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, GraduationCap, Users } from 'lucide-react';
import type { ProfessorCareer } from '@/components/professor/workspace-types';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { StatCard } from '@/components/portal/stat-card';
import { ToneBadge } from '@/components/portal/tone-badge';
import type { GradingLimits } from '@/lib/evaluation-plan';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';

type Props = {
    careers: ProfessorCareer[];
    summary: {
        careers_count: number;
        subjects_count: number;
        students_count: number;
        pending_count: number;
        graded_count: number;
    };
    active_period?: string | null;
    limits: GradingLimits;
};

/**
 * Página "Mis carreras": carreras y materias asignadas por los horarios, con
 * acceso a la planilla de notas y al plan de evaluación de cada materia.
 */
export default function ProfessorCareersPage({
    careers,
    summary,
    active_period,
    limits,
}: Props) {
    return (
        <>
            <Head title="Mis carreras" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Carga académica"
                    title="Mis carreras"
                    description={`Carreras y materias que te asignó el decano en los horarios publicados${active_period ? ` para el período ${active_period}` : ''}.`}
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                {careers.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Pendiente por asignación"
                        description="El decano todavía no te asignó materias ni carreras en un horario. Cuando lo haga, aparecerán en esta página."
                    />
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {careers.map((career) => (
                            <section
                                key={career.id}
                                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                            >
                                <div className="border-b border-border bg-upel-cloud/60 px-5 py-4 dark:bg-muted/30">
                                    <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                        {career.name}
                                    </p>
                                    <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                        {career.code ?? 'Sin código'} ·{' '}
                                        {career.students_count} estudiantes ·{' '}
                                        {career.subjects.length} materias
                                    </p>
                                </div>

                                <div className="divide-y divide-border/70">
                                    {career.subjects.map((subject) => (
                                        <div
                                            key={`${subject.id}-${subject.schedule_id}`}
                                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                                    {subject.name}
                                                </p>
                                                <p className="mt-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                                                    {subject.code} · Semestre{' '}
                                                    {subject.semester}
                                                    {subject.cohort
                                                        ? ` · Cohorte ${subject.cohort}`
                                                        : ''}
                                                    {subject.schedule_label
                                                        ? ` · ${subject.schedule_label}`
                                                        : ''}{' '}
                                                    · {subject.students.length}{' '}
                                                    estudiantes
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {subject.plan ? (
                                                    <ToneBadge
                                                        tone={
                                                            subject.plan
                                                                .is_complete
                                                                ? 'green'
                                                                : 'amber'
                                                        }
                                                    >
                                                        {subject.plan
                                                            .is_complete
                                                            ? 'Plan 100 %'
                                                            : `Faltan ${subject.plan.remaining_weight} %`}
                                                    </ToneBadge>
                                                ) : (
                                                    <ToneBadge tone="slate">
                                                        Sin plan
                                                    </ToneBadge>
                                                )}

                                                <Link
                                                    href={professorRoutes.grades.index.url(
                                                        {
                                                            query: {
                                                                materia:
                                                                    subject.id,
                                                            },
                                                        },
                                                    )}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-1.5 text-[0.62rem] font-bold text-white transition-colors hover:bg-upel-navy-800"
                                                >
                                                    <ClipboardList className="h-3 w-3" />
                                                    Cargar notas
                                                </Link>

                                                <Link
                                                    href={
                                                        subject.plan
                                                            ? plans.show.url({
                                                                  plan: subject
                                                                      .plan.id,
                                                              })
                                                            : plans.create.url({
                                                                  query: {
                                                                      subject_id:
                                                                          subject.id,
                                                                      schedule_id:
                                                                          subject.schedule_id,
                                                                  },
                                                              })
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.62rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                >
                                                    {subject.plan
                                                        ? 'Ver plan'
                                                        : 'Crear plan'}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-auto border-t border-border/70 px-5 py-3 text-[0.62rem] font-semibold text-muted-foreground">
                                    Evaluaciones calificadas de 1 a{' '}
                                    {limits.max_item_score} y definitiva sobre{' '}
                                    {limits.final_scale}.
                                </p>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
