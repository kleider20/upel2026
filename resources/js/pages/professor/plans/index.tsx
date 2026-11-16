import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarRange,
    ClipboardList,
    GraduationCap,
    PencilLine,
    Plus,
    Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { StatCard } from '@/components/portal/stat-card';
import { ToneBadge } from '@/components/portal/tone-badge';
import { type GradingLimits } from '@/lib/evaluation-plan';
import planRoutes from '@/routes/professor/plans';

type SubjectRow = {
    key: string;
    plan_id: number | null;
    subject_id: number;
    schedule_id: number;
    career: string | null;
    career_code: string | null;
    program: string | null;
    cohort: string | null;
    subject: string;
    subject_code: string;
    course: string;
    period: string | null;
    modality_label: string;
    items_count: number;
    total_weight: number;
    remaining_weight: number;
    is_complete: boolean;
    students_count: number;
};

type Props = {
    subjects: SubjectRow[];
    summary: {
        subjects_count: number;
        plans_count: number;
        complete_count: number;
        evaluations_count: number;
    };
    limits: GradingLimits;
};

/**
 * Listado de las materias que el docente imparte según los horarios, con el
 * estado de su plan de evaluación y el acceso a la vista previa del plan.
 */
export default function EvaluationPlansIndex({
    subjects,
    summary,
    limits,
}: Props) {
    const remove = (row: SubjectRow) => {
        if (row.plan_id === null) {
            return;
        }

        if (
            !window.confirm(
                `¿Eliminar el plan de ${row.course}? Esta acción no se puede deshacer.`,
            )
        ) {
            return;
        }

        router.delete(planRoutes.destroy.url({ plan: row.plan_id }), {
            preserveScroll: true,
        });
    };

    const planUrl = (row: SubjectRow): string =>
        row.plan_id !== null
            ? planRoutes.show.url({ plan: row.plan_id })
            : planRoutes.create.url({
                  query: {
                      subject_id: row.subject_id,
                      schedule_id: row.schedule_id,
                  },
              });

    return (
        <>
            <Head title="Planes de evaluación" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Portal Docente"
                    title="Planes de evaluación"
                    description={`Materias asignadas por los horarios publicados. Cada plan debe ponderar el ${limits.total_weight} %; al abrir una materia verás sus evaluaciones y la vista previa del documento.`}
                    actions={
                        <Link
                            href={planRoutes.create.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-5 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo plan de evaluación
                        </Link>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Materias asignadas"
                        value={summary.subjects_count}
                        hint="Materias en tus horarios publicados"
                        icon={GraduationCap}
                        tone="blue"
                    />
                    <StatCard
                        label="Planes creados"
                        value={summary.plans_count}
                        hint="Materias con plan de evaluación"
                        icon={ClipboardList}
                        tone="navy"
                    />
                    <StatCard
                        label="Ponderación completa"
                        value={summary.complete_count}
                        hint={`Planes que suman ${limits.total_weight} %`}
                        icon={CalendarRange}
                        tone="green"
                    />
                    <StatCard
                        label="Evaluaciones"
                        value={summary.evaluations_count}
                        hint="Evaluaciones planificadas"
                        icon={PencilLine}
                        tone="gold"
                    />
                </section>

                {subjects.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Pendiente por asignación"
                        description="El decano todavía no te asignó materias en un horario publicado. Cuando lo haga, aparecerán aquí para crear su plan de evaluación."
                    />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-upel-cloud/70 text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase dark:bg-muted/50">
                                        <th className="px-5 py-3">Materia</th>
                                        <th className="px-5 py-3">Período</th>
                                        <th className="px-5 py-3">
                                            Ponderación
                                        </th>
                                        <th className="px-5 py-3">
                                            Evaluaciones
                                        </th>
                                        <th className="px-5 py-3">
                                            Estudiantes
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/70">
                                    {subjects.map((row) => (
                                        <tr
                                            key={row.key}
                                            className="align-middle transition-colors hover:bg-upel-cloud/40 dark:hover:bg-muted/20"
                                        >
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={planUrl(row)}
                                                    className="block"
                                                >
                                                    <p className="text-sm font-bold text-upel-navy hover:text-upel-blue dark:text-foreground">
                                                        {row.course}
                                                    </p>
                                                    <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">
                                                        {row.career ??
                                                            'Sin carrera'}
                                                        {row.cohort
                                                            ? ` · Cohorte ${row.cohort}`
                                                            : ''}
                                                        {row.program
                                                            ? ` · ${row.program}`
                                                            : ''}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-upel-navy dark:text-foreground">
                                                    {row.period ?? '—'}
                                                </p>
                                                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                                                    {row.modality_label}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                {row.plan_id === null ? (
                                                    <ToneBadge tone="slate">
                                                        Sin plan
                                                    </ToneBadge>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-upel-cloud dark:bg-muted">
                                                                <span
                                                                    className="block h-full rounded-full bg-upel-blue"
                                                                    style={{
                                                                        width: `${Math.min(100, row.total_weight)}%`,
                                                                    }}
                                                                />
                                                            </span>
                                                            <span className="font-bold text-upel-navy dark:text-foreground">
                                                                {
                                                                    row.total_weight
                                                                }{' '}
                                                                %
                                                            </span>
                                                        </div>
                                                        <div className="mt-2">
                                                            {row.is_complete ? (
                                                                <ToneBadge tone="green">
                                                                    Completo
                                                                </ToneBadge>
                                                            ) : (
                                                                <ToneBadge tone="amber">
                                                                    Faltan{' '}
                                                                    {
                                                                        row.remaining_weight
                                                                    }{' '}
                                                                    %
                                                                </ToneBadge>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-upel-navy dark:text-foreground">
                                                {row.items_count}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-upel-navy dark:text-foreground">
                                                {row.plan_id !== null
                                                    ? row.students_count
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={planUrl(row)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-bold text-white transition-colors hover:bg-upel-navy/90"
                                                    >
                                                        {row.plan_id !== null
                                                            ? 'Abrir planilla'
                                                            : 'Crear plan'}
                                                    </Link>
                                                    {row.plan_id !== null ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                remove(row)
                                                            }
                                                            aria-label={`Eliminar plan de ${row.course}`}
                                                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-2.5 py-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <p className="text-[0.7rem] font-semibold text-muted-foreground">
                    Las notas por evaluación se cargan en la página{' '}
                    <span className="font-bold text-upel-navy dark:text-foreground">
                        Cargar notas
                    </span>
                    . Aquí solo se administra el plan y su vista previa.
                </p>
            </div>
        </>
    );
}
