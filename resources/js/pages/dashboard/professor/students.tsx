import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, PencilLine, Users } from 'lucide-react';
import { CareerPicker } from '@/components/professor/career-picker';
import type { ProfessorCareer } from '@/components/professor/workspace-types';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import professorRoutes from '@/routes/professor';
import plans from '@/routes/professor/plans';

type Props = {
    careers: ProfessorCareer[];
    summary: {
        students_count: number;
        pending_count: number;
        graded_count: number;
    };
    active_period?: string | null;
};

function formatGrade(grade: number | null): string {
    return grade === null
        ? 'Sin nota'
        : `${grade.toFixed(1).replace('.', ',')} / 10`;
}

/**
 * Página "Estudiantes": lista a los estudiantes que cursan cada materia con la
 * nota definitiva del plan de evaluación (o "Sin nota" mientras no se carga).
 */
export default function ProfessorStudentsPage({
    careers,
    summary,
    active_period,
}: Props) {
    const [selectedCareerId, setSelectedCareerId] = useState<number | null>(
        careers[0]?.id ?? null,
    );

    const selectedCareer =
        careers.find((career) => career.id === selectedCareerId) ??
        careers[0] ??
        null;

    const gradesUrl = (subjectId: number, studentId: number): string =>
        professorRoutes.grades.index.url({
            query: { materia: subjectId, estudiante: studentId },
        });

    return (
        <>
            <Head title="Estudiantes" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Expediente académico"
                    title="Estudiantes"
                    description={`Estudiantes que cursan tus materias${active_period ? ` en el período ${active_period}` : ''} con la nota definitiva del plan de evaluación. Mientras no haya notas cargadas la columna Nota indica «Sin nota».`}
                    actions={
                        <Link
                            href={professorRoutes.grades.index.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90"
                        >
                            <ClipboardList className="h-4 w-4" />
                            Ir a cargar notas
                        </Link>
                    }
                />

                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                    <aside className="space-y-4">
                        <CareerPicker
                            careers={careers}
                            selectedId={selectedCareer?.id ?? null}
                            onSelect={setSelectedCareerId}
                        />

                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Avance de notas
                            </p>
                            <dl className="mt-3 space-y-3 text-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Estudiantes
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {summary.students_count}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Con definitiva
                                    </dt>
                                    <dd className="font-bold text-upel-green">
                                        {summary.graded_count}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Sin nota
                                    </dt>
                                    <dd className="font-bold text-amber-600">
                                        {summary.pending_count}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </aside>

                    <section className="space-y-5">
                        <div>
                            <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                Nota definitiva del plan
                            </p>
                            <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                {selectedCareer?.name ??
                                    'Pendiente por asignación'}
                            </h2>
                            <p className="mt-1 text-[0.68rem] font-semibold text-muted-foreground">
                                El botón «Cargar nota» abre la planilla de
                                evaluación del estudiante en la página Cargar
                                notas. La definitiva aparece a medida que se
                                cargan las evaluaciones; con notas parciales el
                                estado indica «Faltan notas».
                            </p>
                        </div>

                        {careers.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="Pendiente por asignación"
                                description="El decano todavía no te asignó materias ni carreras en un horario. Cuando lo haga, aquí verás a tus estudiantes."
                            />
                        ) : !selectedCareer ||
                          selectedCareer.subjects.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title="Sin estudiantes asignados"
                                description="Cuando tengas materias y estudiantes asignados, aparecerán en esta página."
                            />
                        ) : (
                            selectedCareer.subjects.map((subject) => (
                                <div
                                    key={`${subject.id}-${subject.schedule_id}`}
                                    className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
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
                                                · {subject.students.length}{' '}
                                                estudiantes
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {subject.plan ? (
                                                <Link
                                                    href={plans.show.url({
                                                        plan: subject.plan.id,
                                                    })}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-bold text-upel-navy ring-1 ring-border transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                                >
                                                    <ClipboardList className="h-3 w-3" />
                                                    Ver plan
                                                </Link>
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
                                                    <ClipboardList className="h-3 w-3" />
                                                    Crear plan
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {subject.students.length === 0 ? (
                                        <div className="p-5">
                                            <EmptyState
                                                icon={Users}
                                                title="Sin estudiantes"
                                                description="No hay estudiantes activos en la carrera de esta materia."
                                            />
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                                <thead>
                                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                                        {[
                                                            'Estudiante',
                                                            'Código',
                                                            'Período',
                                                            'Nota',
                                                            'Estado',
                                                            'Acción',
                                                        ].map((label) => (
                                                            <th
                                                                key={label}
                                                                scope="col"
                                                                className="px-5 py-2.5 text-[0.6rem] font-bold tracking-[0.12em] whitespace-nowrap text-muted-foreground uppercase"
                                                            >
                                                                {label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {subject.students.map(
                                                        (student) => (
                                                            <tr
                                                                key={
                                                                    student.student_id
                                                                }
                                                                className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                                            >
                                                                <td className="px-5 py-3.5 text-xs font-bold text-upel-navy dark:text-foreground">
                                                                    {
                                                                        student.student_name
                                                                    }
                                                                </td>
                                                                <td className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                                                                    {student.student_code ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                                                                    {student.period ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-5 py-3.5">
                                                                    <span
                                                                        className={cn(
                                                                            'text-xs font-extrabold',
                                                                            student.grade ===
                                                                                null
                                                                                ? 'text-muted-foreground'
                                                                                : 'text-upel-navy dark:text-foreground',
                                                                        )}
                                                                    >
                                                                        {formatGrade(
                                                                            student.grade,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3.5">
                                                                    <ToneBadge
                                                                        tone={
                                                                            student.status_tone as Tone
                                                                        }
                                                                    >
                                                                        {
                                                                            student.status_label
                                                                        }
                                                                    </ToneBadge>
                                                                </td>
                                                                <td className="px-5 py-3.5">
                                                                    <Link
                                                                        href={gradesUrl(
                                                                            subject.id,
                                                                            student.student_id,
                                                                        )}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-1.5 text-[0.65rem] font-bold text-white transition-colors hover:bg-upel-navy-800"
                                                                    >
                                                                        <PencilLine className="h-3 w-3" />
                                                                        {student.graded_items >
                                                                        0
                                                                            ? 'Editar nota'
                                                                            : 'Cargar nota'}
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
