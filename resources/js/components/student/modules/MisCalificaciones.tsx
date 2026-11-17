import { useState } from 'react';
import { ChevronDown, ClipboardList, Download } from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps, StudentEnrollment } from '@/types/student';

function formatScore(score: number | null, digits = 1): string {
    if (score === null || Number.isNaN(score)) return '—';
    return score.toFixed(digits).replace('.', ',');
}

function EvaluationBreakdown({
    enrollment,
}: {
    enrollment: StudentEnrollment;
}) {
    if (enrollment.items_count === 0) {
        return (
            <p className="text-xs font-semibold text-muted-foreground">
                El docente todavía no ha registrado el plan de evaluación de
                esta materia.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[0.7rem] font-semibold text-muted-foreground">
                {enrollment.graded_count} de {enrollment.items_count}{' '}
                evaluaciones calificadas · Notas sobre 20, aportes y definitiva
                sobre 10.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-[0.7rem]">
                    <thead>
                        <tr className="text-muted-foreground uppercase">
                            <th className="px-3 py-2 font-bold tracking-wider">
                                Evaluación
                            </th>
                            <th className="px-3 py-2 text-center font-bold tracking-wider">
                                Fecha
                            </th>
                            <th className="px-3 py-2 text-center font-bold tracking-wider">
                                Ponderación
                            </th>
                            <th className="px-3 py-2 text-center font-bold tracking-wider">
                                Nota
                            </th>
                            <th className="px-3 py-2 text-center font-bold tracking-wider">
                                Aporte
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {enrollment.evaluations.map((evaluation, index) => (
                            <tr key={`${evaluation.title}-${index}`}>
                                <td className="px-3 py-2 font-bold text-upel-navy dark:text-foreground">
                                    {evaluation.title}
                                </td>
                                <td className="px-3 py-2 text-center font-semibold text-muted-foreground">
                                    {evaluation.scheduled_on}
                                </td>
                                <td className="px-3 py-2 text-center font-semibold">
                                    {evaluation.weight} %
                                </td>
                                <td className="px-3 py-2 text-center font-bold">
                                    {formatScore(evaluation.score)}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-upel-blue">
                                    {formatScore(evaluation.contribution, 2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-[0.7rem] font-semibold text-muted-foreground">
                Definitiva:{' '}
                <span className="font-extrabold text-upel-navy dark:text-foreground">
                    {formatScore(enrollment.definitive)} / 10
                </span>{' '}
                · {enrollment.status_label}
            </p>
        </div>
    );
}

export function MisCalificaciones({
    profile,
    summary,
    enrollments,
}: StudentDashboardProps) {
    const grouped = enrollments.reduce<Record<string, StudentEnrollment[]>>(
        (accumulator, enrollment) => {
            const period = enrollment.period ?? 'Sin período';
            (accumulator[period] ??= []).push(enrollment);

            return accumulator;
        },
        {},
    );

    const periods = Object.entries(grouped).sort(([a], [b]) =>
        b.localeCompare(a),
    );

    const [openPeriod, setOpenPeriod] = useState<string | null>(
        periods[0]?.[0] ?? null,
    );
    const [openSubject, setOpenSubject] = useState<number | null>(null);

    const handleDownload = () => {
        alert('Generando constancia de notas en PDF (Demo)...');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:bg-card">
                <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-gold/15 px-3 py-1 text-[0.68rem] font-extrabold text-[#8a6c0d] dark:bg-upel-gold/20 dark:text-upel-gold-light">
                        Escala 1–10 · Mín. aprobatoria 6
                    </span>
                    <h2 className="mt-2 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        Mis Calificaciones y Récord Académico
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Expediente: {profile?.student_code ?? 'S/N'} · Carrera:{' '}
                        {profile?.career ?? '—'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-upel-navy-800"
                >
                    <Download className="h-4 w-4" />
                    Descargar Récord Certificado
                </button>
            </div>

            {/* Stats superiores */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
                    <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        Promedio general acumulado
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                        {formatScore(summary.average)}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            / 10
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
                    <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        Materias Aprobadas
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {summary.approved_count}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            / {summary.subjects_count}
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
                    <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        Créditos Aprobados
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-upel-blue">
                        {summary.credits_approved}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            U.C.
                        </span>
                    </p>
                </div>
            </div>

            {/* Calificaciones por período, materia y evaluación */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">
                        Calificaciones por período
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Cada materia muestra las evaluaciones que cargó el
                        docente, su definitiva sobre 10 y la condición: aprueba
                        con 6 o más.
                    </p>
                </div>

                {enrollments.length === 0 ? (
                    <div className="rounded-2xl border border-border/80 bg-white p-12 text-center shadow-sm dark:bg-card">
                        <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                            No hay calificaciones registradas
                        </p>
                    </div>
                ) : (
                    periods.map(([period, subjects]) => {
                        const isPeriodOpen = openPeriod === period;

                        return (
                            <div
                                key={period}
                                className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenPeriod(
                                            isPeriodOpen ? null : period,
                                        )
                                    }
                                    aria-expanded={isPeriodOpen}
                                    className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-upel-cloud/40 dark:hover:bg-muted/30"
                                >
                                    <span>
                                        <span className="block text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                                            Período académico
                                        </span>
                                        <span className="mt-0.5 block font-display text-base font-bold text-upel-navy dark:text-foreground">
                                            {period}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="text-[0.68rem] font-bold text-muted-foreground">
                                            {subjects.length}{' '}
                                            {subjects.length === 1
                                                ? 'materia'
                                                : 'materias'}
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                                isPeriodOpen ? 'rotate-180' : ''
                                            }`}
                                            aria-hidden="true"
                                        />
                                    </span>
                                </button>

                                {isPeriodOpen ? (
                                    <div className="divide-y divide-border border-t border-border">
                                        {subjects.map((item) => {
                                            const isSubjectOpen =
                                                openSubject === item.id;

                                            return (
                                                <div key={item.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenSubject(
                                                                isSubjectOpen
                                                                    ? null
                                                                    : item.id,
                                                            )
                                                        }
                                                        aria-expanded={
                                                            isSubjectOpen
                                                        }
                                                        className="flex w-full flex-col gap-3 px-6 py-4 text-left transition-colors hover:bg-upel-cloud/30 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-muted/20"
                                                    >
                                                        <span className="flex min-w-0 items-start gap-2">
                                                            <ChevronDown
                                                                className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                                                    isSubjectOpen
                                                                        ? 'rotate-180'
                                                                        : ''
                                                                }`}
                                                                aria-hidden="true"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-bold text-upel-navy dark:text-foreground">
                                                                    {
                                                                        item.subject
                                                                    }
                                                                </span>
                                                                <span className="mt-0.5 block text-[0.68rem] font-semibold text-muted-foreground">
                                                                    {item.code}{' '}
                                                                    ·{' '}
                                                                    {item.credits ??
                                                                        3}{' '}
                                                                    U.C.
                                                                    {item.professor
                                                                        ? ` · Prof. ${item.professor}`
                                                                        : ''}
                                                                </span>
                                                                <span className="mt-0.5 block text-[0.68rem] font-semibold text-muted-foreground">
                                                                    {
                                                                        item.graded_count
                                                                    }{' '}
                                                                    de{' '}
                                                                    {
                                                                        item.items_count
                                                                    }{' '}
                                                                    evaluaciones
                                                                    calificadas
                                                                </span>
                                                            </span>
                                                        </span>

                                                        <span className="flex shrink-0 items-center gap-3 pl-6 sm:pl-0">
                                                            <span className="text-right">
                                                                <span className="block text-[0.6rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                                                                    Definitiva
                                                                </span>
                                                                <span className="block text-sm font-extrabold text-upel-navy dark:text-foreground">
                                                                    {formatScore(
                                                                        item.definitive,
                                                                    )}{' '}
                                                                    <span className="text-[0.68rem] font-semibold text-muted-foreground">
                                                                        / 10
                                                                    </span>
                                                                </span>
                                                            </span>
                                                            <ToneBadge
                                                                tone={
                                                                    item.status_tone as Tone
                                                                }
                                                            >
                                                                {
                                                                    item.status_label
                                                                }
                                                            </ToneBadge>
                                                        </span>
                                                    </button>

                                                    {isSubjectOpen ? (
                                                        <div className="bg-upel-cloud/30 px-6 py-4 dark:bg-muted/20">
                                                            <EvaluationBreakdown
                                                                enrollment={
                                                                    item
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
