import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, Plus } from 'lucide-react';
import { CareerPicker } from '@/components/professor/career-picker';
import { EvaluationPlanGradesPanel } from '@/components/professor/evaluation-plan-grades-panel';
import type {
    PlanGradeData,
    ProfessorCareer,
    ProfessorSubject,
} from '@/components/professor/workspace-types';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { ToneBadge } from '@/components/portal/tone-badge';
import type { GradingLimits } from '@/lib/evaluation-plan';
import { countLabel } from '@/lib/utils';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';

type GradeSubject = Omit<ProfessorSubject, 'plan'> & {
    plan: PlanGradeData | null;
};

type GradeCareer = Omit<ProfessorCareer, 'subjects'> & {
    subjects: GradeSubject[];
};

type Focus = {
    career_id: number;
    subject_id: number;
    student_id: number | null;
};

type Props = {
    careers: GradeCareer[];
    active_period?: string | null;
    focus: Focus | null;
    limits: GradingLimits;
};

/**
 * Página "Cargar notas": muestra únicamente la planilla de notas por
 * evaluación de cada materia, con una columna por evaluación del plan.
 */
export default function ProfessorGradesPage({
    careers,
    active_period,
    focus,
    limits,
}: Props) {
    const [selectedCareerId, setSelectedCareerId] = useState<number | null>(
        focus?.career_id ?? careers[0]?.id ?? null,
    );

    const selectedCareer =
        careers.find((career) => career.id === selectedCareerId) ??
        careers[0] ??
        null;

    useEffect(() => {
        if (!focus) {
            return;
        }

        const targetId =
            focus.student_id !== null
                ? `estudiante-${focus.student_id}`
                : `materia-${focus.subject_id}`;

        document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focus]);

    return (
        <>
            <Head title="Cargar notas" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Carga de calificaciones"
                    title="Cargar notas"
                    description={`Escala de 1 a ${limits.max_item_score} por evaluación, con hasta dos decimales · definitiva sobre ${limits.final_scale} · mínima aprobatoria ${limits.passing_grade}.${active_period ? ` Período ${active_period}.` : ''}`}
                    actions={
                        <Link
                            href={professorRoutes.students.url()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        >
                            <ClipboardList className="h-4 w-4" />
                            Nota final del expediente
                        </Link>
                    }
                />

                {careers.length > 0 ? (
                    <CareerPicker
                        careers={careers}
                        selectedId={selectedCareer?.id ?? null}
                        onSelect={setSelectedCareerId}
                        variant="compact"
                    />
                ) : null}

                <section className="space-y-5">
                    <div>
                        <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                            Notas por evaluación
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                            {selectedCareer?.name ?? 'Pendiente por asignación'}
                        </h2>
                        <p className="mt-1 text-[0.68rem] font-semibold text-muted-foreground">
                            Tus materias provienen de los horarios publicados
                            por el decano. Cada evaluación del plan tiene su
                            columna y la definitiva se calcula automáticamente.
                        </p>
                    </div>

                    {careers.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="Pendiente por asignación"
                            description="El decano todavía no te asignó materias ni carreras en un horario. Cuando lo haga, aquí podrás cargar las notas de cada evaluación."
                        />
                    ) : !selectedCareer ||
                      selectedCareer.subjects.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="Sin materias asignadas"
                            description="Cuando tengas materias en un horario publicado, aparecerán en esta página."
                        />
                    ) : (
                        selectedCareer.subjects.map((subject) => {
                            const highlightStudentId =
                                focus?.subject_id === subject.id
                                    ? focus.student_id
                                    : null;

                            return (
                                <div
                                    key={`${subject.id}-${subject.schedule_id}`}
                                    id={`materia-${subject.id}`}
                                    className="scroll-mt-28 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-upel-cloud/60 px-5 py-4 dark:bg-muted/30">
                                        <div>
                                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                                {subject.name}
                                            </p>
                                            <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                                {subject.code} · Semestre{' '}
                                                {subject.semester}
                                                {subject.cohort
                                                    ? ` · Cohorte ${subject.cohort}`
                                                    : ''}
                                                {subject.schedule_label
                                                    ? ` · ${subject.schedule_label}`
                                                    : ''}{' '}
                                                ·{' '}
                                                {countLabel(
                                                    subject.plan?.students
                                                        .length ??
                                                        subject.students.length,
                                                    'estudiante',
                                                    'estudiantes',
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {subject.plan ? (
                                                <>
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
                                                    <Link
                                                        href={plans.show.url({
                                                            plan: subject.plan
                                                                .id,
                                                        })}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-bold text-upel-navy ring-1 ring-border transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                                    >
                                                        <ClipboardList className="h-3 w-3" />
                                                        Ver plan
                                                    </Link>
                                                </>
                                            ) : (
                                                <Link
                                                    href={plans.create.url({
                                                        query: {
                                                            subject_id:
                                                                subject.id,
                                                            schedule_id:
                                                                subject.schedule_id,
                                                        },
                                                    })}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-bold text-upel-blue ring-1 ring-border transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Crear plan
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {subject.plan &&
                                    subject.plan.items.length > 0 ? (
                                        <EvaluationPlanGradesPanel
                                            plan={subject.plan}
                                            limits={limits}
                                            highlightStudentId={
                                                highlightStudentId
                                            }
                                        />
                                    ) : (
                                        <div className="px-5 py-4 text-[0.7rem] font-semibold text-muted-foreground">
                                            {subject.plan
                                                ? 'El plan de evaluación todavía no tiene evaluaciones.'
                                                : 'Esta materia aún no tiene plan de evaluación. Créalo para cargar las notas por evaluación.'}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </section>
            </div>
        </>
    );
}
