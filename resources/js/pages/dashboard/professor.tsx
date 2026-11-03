import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    GraduationCap,
    PencilLine,
    Users,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { GradeModal } from '@/components/portal/grade-modal';
import { PageHeader } from '@/components/portal/page-header';
import { RoleBadge } from '@/components/portal/role-badge';
import { StatCard } from '@/components/portal/stat-card';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type Student = {
    enrollment_id: number;
    student_name: string | null;
    student_code: string | null;
    period: string | null;
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
};

type Subject = {
    id: number;
    name: string;
    code: string;
    semester: number;
    students: Student[];
};

type Career = {
    id: number | null;
    name: string | null;
    code: string | null;
    students_count: number;
    subjects: Subject[];
};

type GradeTarget = {
    enrollment_id: number;
    student_name: string | null;
    student_code: string | null;
    subject_name: string;
    grade: number | null;
};

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
    careers: Career[];
    active_period?: string | null;
};

function formatGrade(grade: number | null): string {
    return grade === null
        ? 'Sin nota'
        : `${grade.toFixed(1).replace('.', ',')} / 10`;
}

/**
 * Panel del profesor con acceso a sus carreras, materias y estudiantes.
 */
export default function ProfessorDashboard({
    profile,
    summary,
    careers,
    active_period,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [selectedCareerId, setSelectedCareerId] = useState<number | null>(
        careers[0]?.id ?? null,
    );
    const [gradeTarget, setGradeTarget] = useState<GradeTarget | null>(null);
    const [gradeOpen, setGradeOpen] = useState(false);

    const selectedCareer =
        careers.find((career) => career.id === selectedCareerId) ??
        careers[0] ??
        null;

    const openGradeModal = (subject: Subject, student: Student) => {
        setGradeTarget({
            enrollment_id: student.enrollment_id,
            student_name: student.student_name,
            student_code: student.student_code,
            subject_name: subject.name,
            grade: student.grade,
        });
        setGradeOpen(true);
    };

    return (
        <>
            <Head title="Mi cátedra" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Portal del profesor"
                    title={`Bienvenida, ${auth.user?.name.split(' ')[0] ?? 'profesora'}`}
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

                        <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-sm dark:bg-card">
                            <p className="px-2 pt-2 pb-3 text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Mis carreras
                            </p>
                            <div className="space-y-1.5">
                                {careers.map((career) => (
                                    <button
                                        key={career.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCareerId(career.id)
                                        }
                                        className={cn(
                                            'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                                            selectedCareer?.id === career.id
                                                ? 'bg-upel-navy text-white'
                                                : 'text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted',
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-bold">
                                                {career.name}
                                            </span>
                                            <span
                                                className={cn(
                                                    'mt-0.5 block text-[0.62rem] font-semibold',
                                                    selectedCareer?.id ===
                                                        career.id
                                                        ? 'text-white/60'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {career.students_count}{' '}
                                                estudiantes ·{' '}
                                                {career.subjects.length}{' '}
                                                materias
                                            </span>
                                        </span>
                                        <ChevronRight
                                            className={cn(
                                                'h-4 w-4 shrink-0',
                                                selectedCareer?.id ===
                                                    career.id
                                                    ? 'text-white'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <section id="cargar-notas" className="space-y-5">
                        <div
                            id="estudiantes"
                            className="flex flex-wrap items-end justify-between gap-3"
                        >
                            <div>
                                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                    Estudiantes por materia
                                </p>
                                <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                    {selectedCareer?.name ??
                                        'Selecciona una carrera'}
                                </h2>
                            </div>
                            <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                                {selectedCareer?.students_count ?? 0}{' '}
                                estudiantes
                            </span>
                        </div>

                        {!selectedCareer || selectedCareer.subjects.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title="Sin estudiantes asignados"
                                description="Cuando tengas materias y estudiantes asignados, aparecerán en esta sección."
                            />
                        ) : (
                            selectedCareer.subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-upel-cloud/60 px-5 py-4 dark:bg-muted/30">
                                        <div>
                                            <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                                {subject.name}
                                            </p>
                                            <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                                {subject.code} · Semestre{' '}
                                                {subject.semester} ·{' '}
                                                {subject.students.length}{' '}
                                                estudiantes
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-bold text-upel-blue ring-1 ring-border dark:bg-card">
                                            <BookOpen className="h-3 w-3" />
                                            Materia
                                        </span>
                                    </div>

                                    {subject.students.length === 0 ? (
                                        <div className="p-5">
                                            <EmptyState
                                                icon={Users}
                                                title="Sin estudiantes"
                                                description="Aún no hay estudiantes inscritos en esta materia."
                                            />
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                                <thead>
                                                    <tr>
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
                                                                    student.enrollment_id
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
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openGradeModal(
                                                                                subject,
                                                                                student,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-1.5 text-[0.65rem] font-bold text-white transition-colors hover:bg-upel-navy-800"
                                                                    >
                                                                        <PencilLine className="h-3 w-3" />
                                                                        {student.grade ===
                                                                        null
                                                                            ? 'Cargar nota'
                                                                            : 'Editar nota'}
                                                                    </button>
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

                <div className="rounded-2xl border border-upel-green/20 bg-upel-green/5 p-5">
                    <div className="flex items-center gap-2 text-upel-green">
                        <CheckCircle2 className="h-4 w-4" />
                        <p className="text-xs font-bold tracking-wide uppercase">
                            Registro de calificaciones
                        </p>
                    </div>
                    <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                        Las notas se guardan directamente en el expediente del
                        estudiante. Una nota igual o superior a 5 marca la
                        materia como aprobada; una nota menor la marca como
                        reprobada.
                    </p>
                </div>
            </div>

            <GradeModal
                key={gradeTarget?.enrollment_id ?? 'no-target'}
                open={gradeOpen && gradeTarget !== null}
                onOpenChange={setGradeOpen}
                target={gradeTarget}
            />
        </>
    );
}
