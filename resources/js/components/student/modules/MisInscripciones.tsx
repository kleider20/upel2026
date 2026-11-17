import { useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    Lock,
    ShieldAlert,
} from 'lucide-react';
import { ToneBadge } from '@/components/portal/tone-badge';
import {
    sheet as sheetRoute,
    store as storeRoute,
} from '@/routes/student/enrollment';
import type {
    StudentEnrollmentPayload,
    StudentEnrollmentSheet,
    StudentEnrollmentSubjectOption,
} from '@/types/student';

type MisInscripcionesProps = {
    enrollment: StudentEnrollmentPayload;
};

const closureMessages: Record<string, string> = {
    manual: 'La coordinación cerró la ventana de inscripciones por ahora.',
    before: 'La ventana de inscripciones todavía no ha comenzado.',
    after: 'La ventana de inscripciones ya finalizó.',
};

/**
 * Inscripción de materias del siguiente período: el estudiante administra sus
 * unidades de crédito, las materias aplazadas quedan bloqueadas y al guardar
 * se genera la planilla de inscripción.
 */
export function MisInscripciones({ enrollment }: MisInscripcionesProps) {
    const {
        window,
        period,
        semester,
        credits,
        subjects,
        suspension,
        submitted,
        sheet,
    } = enrollment;
    const failedSubjects = subjects.filter((subject) => subject.is_locked);
    const optionalSubjects = subjects.filter((subject) => !subject.is_locked);

    const [selected, setSelected] = useState<number[]>(() =>
        subjects
            .filter((subject) => subject.is_locked || subject.is_selected)
            .map((subject) => subject.subject_id),
    );

    const form = useForm<{ subjects: number[] }>({ subjects: [] });

    const selectedCredits = useMemo(
        () =>
            subjects
                .filter((subject) => selected.includes(subject.subject_id))
                .reduce((total, subject) => total + subject.credits, 0),
        [selected, subjects],
    );

    const toggleSubject = (subject: StudentEnrollmentSubjectOption) => {
        if (subject.is_locked) {
            return;
        }

        setSelected((current) => {
            if (current.includes(subject.subject_id)) {
                return current.filter((id) => id !== subject.subject_id);
            }

            if (selectedCredits + subject.credits > credits.budget) {
                return current;
            }

            return [...current, subject.subject_id];
        });
    };

    const isBlocked = (subject: StudentEnrollmentSubjectOption) =>
        !selected.includes(subject.subject_id) &&
        selectedCredits + subject.credits > credits.budget;

    const submit = () => {
        form.transform(() => ({ subjects: selected }));
        form.post(storeRoute.url(), { preserveScroll: true });
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
                    <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-upel-cloud text-upel-blue dark:bg-muted">
                            <ClipboardCheck
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </span>
                        <div>
                            <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                                Inscripción en línea
                            </p>
                            <h2 className="mt-0.5 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                                {period !== null
                                    ? `Materias del período ${period.name}`
                                    : 'Inscripción de materias'}
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                {period !== null ? (
                                    <>
                                        Semestre {semester}° del pénsum ·{' '}
                                        {period.starts_at} al {period.ends_at}
                                    </>
                                ) : (
                                    'No hay un período disponible para inscribir.'
                                )}
                            </p>
                        </div>
                    </div>

                    <ToneBadge tone={window.is_open ? 'green' : 'slate'}>
                        {window.is_open
                            ? `Abierta hasta el ${window.closes_at}`
                            : 'Ventana cerrada'}
                    </ToneBadge>
                </div>

                {!window.is_open ? (
                    <div className="flex items-start gap-3 border-b border-border bg-amber-50/70 px-6 py-4 dark:bg-amber-500/10">
                        <CalendarClock
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                            aria-hidden="true"
                        />
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                            {closureMessages[window.reason] ??
                                'La ventana de inscripciones está cerrada.'}{' '}
                            {window.opens_at !== '' && window.closes_at !== ''
                                ? `La ventana está prevista del ${window.opens_at} al ${window.closes_at}.`
                                : null}
                        </p>
                    </div>
                ) : null}

                {period === null ? (
                    <div className="px-6 py-12 text-center">
                        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                            Todavía no hay un período para tu inscripción
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Cuando la coordinación publique el próximo período
                            podrás inscribir tus materias desde esta sección.
                        </p>
                    </div>
                ) : suspension.is_suspended ? (
                    <div className="px-6 py-8">
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-5 dark:border-red-500/25 dark:bg-red-500/10">
                            <ShieldAlert
                                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                                aria-hidden="true"
                            />
                            <div>
                                <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
                                    Inscripciones suspendidas
                                </p>
                                <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-200">
                                    {suspension.message ??
                                        'Has reprobado una materia tres veces. Debes dirigirte a control de estudios.'}
                                </p>
                                <p className="mt-2 text-[0.68rem] font-semibold text-red-600/90 dark:text-red-300">
                                    Una materia reprobada puede cursarse un
                                    máximo de tres veces. La coordinación debe
                                    habilitar tu inscripción nuevamente.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                label="UC asignadas"
                                value={credits.budget}
                                detail={`Semestre ${semester}° del pénsum`}
                                tone="blue"
                            />
                            <SummaryCard
                                label="UC aplazadas"
                                value={credits.required}
                                detail={
                                    failedSubjects.length === 0
                                        ? 'Sin materias reprobadas'
                                        : `${failedSubjects.length} materia(s) bloqueada(s)`
                                }
                                tone={credits.required > 0 ? 'amber' : 'slate'}
                            />
                            <SummaryCard
                                label="UC disponibles"
                                value={Math.max(
                                    0,
                                    credits.budget - credits.required,
                                )}
                                detail="Para las materias del semestre"
                                tone="gold"
                            />
                            <SummaryCard
                                label="UC seleccionadas"
                                value={selectedCredits}
                                detail={`de ${credits.budget} permitidas`}
                                tone={
                                    selectedCredits > credits.budget
                                        ? 'red'
                                        : 'green'
                                }
                            />
                        </div>

                        <div className="px-6 pb-5">
                            <div className="h-2.5 overflow-hidden rounded-full bg-upel-mist dark:bg-muted">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#12876f,#1e5fa8)] transition-all duration-500"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            credits.budget === 0
                                                ? 0
                                                : (selectedCredits /
                                                      credits.budget) *
                                                      100,
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {failedSubjects.length > 0 ? (
                            <div className="mx-6 mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/10">
                                <AlertTriangle
                                    className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                                    aria-hidden="true"
                                />
                                <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                                    Tienes materias aplazadas: se inscriben
                                    automáticamente y consumen parte de tus UC
                                    asignadas. No puedes desmarcarlas.
                                </p>
                            </div>
                        ) : null}

                        <div className="border-t border-border">
                            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                                <h3 className="text-xs font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
                                    Materias a cursar
                                </h3>
                                <p className="text-[0.68rem] font-semibold text-muted-foreground">
                                    {selectedCredits} UC seleccionadas ·{' '}
                                    {Math.max(
                                        0,
                                        credits.budget - selectedCredits,
                                    )}{' '}
                                    UC libres
                                </p>
                            </div>

                            <ul className="divide-y divide-border border-t border-border">
                                {subjects.length === 0 ? (
                                    <li className="px-6 py-10 text-center text-xs font-semibold text-muted-foreground">
                                        No hay materias disponibles para este
                                        período.
                                    </li>
                                ) : (
                                    <>
                                        {failedSubjects.map((subject) => (
                                            <SubjectRow
                                                key={subject.subject_id}
                                                subject={subject}
                                                isSelected
                                                isBlocked={false}
                                                onToggle={toggleSubject}
                                            />
                                        ))}
                                        {optionalSubjects.map((subject) => (
                                            <SubjectRow
                                                key={subject.subject_id}
                                                subject={subject}
                                                isSelected={selected.includes(
                                                    subject.subject_id,
                                                )}
                                                isBlocked={isBlocked(subject)}
                                                onToggle={toggleSubject}
                                            />
                                        ))}
                                    </>
                                )}
                            </ul>
                        </div>

                        {form.errors.subjects ? (
                            <p className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                                {form.errors.subjects}
                            </p>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
                            <p className="text-[0.68rem] font-semibold text-muted-foreground">
                                {window.is_open
                                    ? 'Puedes marcar o desmarcar materias mientras la ventana esté abierta.'
                                    : 'La selección guardada se muestra tal como quedó al cierre.'}
                            </p>

                            {window.is_open ? (
                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-5 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <CheckCircle2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    {form.processing
                                        ? 'Guardando…'
                                        : submitted
                                          ? 'Actualizar inscripción'
                                          : 'Confirmar inscripción'}
                                </button>
                            ) : null}
                        </div>
                    </>
                )}
            </section>

            {sheet !== null ? (
                <EnrollmentSheet sheet={sheet} isOpen={window.is_open} />
            ) : null}

            {!window.is_open && !submitted && period !== null ? (
                <p className="text-center text-[0.68rem] font-semibold text-muted-foreground">
                    Cuando la ventana se habilite podrás inscribir tus materias
                    desde este apartado.
                </p>
            ) : null}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    detail,
    tone,
}: {
    label: string;
    value: number;
    detail: string;
    tone: 'blue' | 'amber' | 'gold' | 'green' | 'red' | 'slate';
}) {
    const toneClasses: Record<string, string> = {
        blue: 'bg-blue-500/15 text-blue-600',
        amber: 'bg-amber-500/15 text-amber-600',
        gold: 'bg-upel-gold/15 text-upel-gold',
        green: 'bg-emerald-500/15 text-emerald-600',
        red: 'bg-red-500/15 text-red-600',
        slate: 'bg-upel-navy/10 text-upel-navy dark:bg-muted dark:text-foreground',
    };

    return (
        <div className="rounded-xl border border-border/80 bg-upel-cloud/40 p-4 dark:bg-muted/30">
            <div className="flex items-center justify-between">
                <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                    {label}
                </p>
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}
                    aria-hidden="true"
                >
                    <BookOpen className="h-4 w-4" />
                </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                {value}{' '}
                <span className="text-xs font-semibold text-muted-foreground">
                    U.C.
                </span>
            </p>
            <p className="mt-1 text-[0.66rem] font-semibold text-muted-foreground">
                {detail}
            </p>
        </div>
    );
}

function SubjectRow({
    subject,
    isSelected,
    isBlocked,
    onToggle,
}: {
    subject: StudentEnrollmentSubjectOption;
    isSelected: boolean;
    isBlocked: boolean;
    onToggle: (subject: StudentEnrollmentSubjectOption) => void;
}) {
    const disabled = subject.is_locked || (!isSelected && isBlocked);

    return (
        <li
            className={`flex items-start gap-3 px-6 py-4 transition-colors ${
                isSelected
                    ? 'bg-emerald-50/40 dark:bg-emerald-500/5'
                    : 'bg-white dark:bg-card'
            }`}
        >
            <button
                type="button"
                onClick={() => onToggle(subject)}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Desmarcar' : 'Marcar'} ${subject.name}`}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-border bg-white text-transparent dark:bg-card'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-upel-blue'}`}
            >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-upel-cloud px-2 py-0.5 text-[0.62rem] font-extrabold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground">
                        {subject.code}
                    </span>
                    <p className="truncate text-xs font-bold text-upel-navy dark:text-foreground">
                        {subject.name}
                    </p>
                    {subject.is_locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.6rem] font-extrabold text-red-700 uppercase ring-1 ring-red-200 ring-inset dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Aplazada
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 text-[0.66rem] font-semibold text-muted-foreground">
                    Semestre {subject.semester}° · {subject.credits} U.C. ·
                    Prof. {subject.professor ?? 'Por asignar'}
                    {subject.is_locked && subject.previous_period
                        ? ` · Cursada en ${subject.previous_period}`
                        : ''}
                    {subject.is_locked && subject.attempts > 0
                        ? ` · Reprobada ${subject.attempts}.ª vez`
                        : ''}
                    {subject.is_locked && subject.definitive !== null
                        ? ` · Nota ${subject.definitive
                              .toFixed(1)
                              .replace('.', ',')}`
                        : ''}
                </p>
            </div>

            {isBlocked && !subject.is_locked ? (
                <span className="shrink-0 text-[0.62rem] font-extrabold text-amber-600 uppercase">
                    Sin UC
                </span>
            ) : null}
        </li>
    );
}

function EnrollmentSheet({
    sheet,
    isOpen,
}: {
    sheet: StudentEnrollmentSheet;
    isOpen: boolean;
}) {
    const student = sheet.student;
    const previewRows = Math.max(7, sheet.rows.length);

    const labelClass =
        'border border-border bg-[#d7d7d7] px-2 py-1.5 text-center text-[0.62rem] font-extrabold text-upel-navy dark:bg-muted dark:text-foreground';
    const valueClass =
        'border border-border px-2 py-1.5 text-center font-bold text-upel-navy dark:text-foreground';

    return (
        <section className="rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-upel-cloud text-upel-blue dark:bg-muted">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                            Planilla de inscripción
                        </p>
                        <h3 className="mt-0.5 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                            Planilla de Asesoría Académica e Inscripción
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            Diseño 2015 · Período {sheet.period} ·{' '}
                            {sheet.rows.length} materia(s) ·{' '}
                            {sheet.total_credits} U.C. en total
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a
                        href={sheetRoute.url()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Abrir PDF
                    </a>
                    <a
                        href={sheetRoute.url({ query: { download: 1 } })}
                        className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy transition-colors hover:bg-upel-gold-light"
                    >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Descargar
                    </a>
                </div>
            </div>

            <div className="space-y-6 px-6 py-5">
                <div>
                    <h4 className="text-[0.7rem] font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
                        Datos Básicos
                    </h4>

                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[34rem] border-collapse text-[0.68rem]">
                            <tbody>
                                <tr>
                                    <th colSpan={1} className={labelClass}>
                                        Céd. de Identidad
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.identity_document ?? ''}
                                    </td>
                                    <th className={labelClass}>
                                        Período Académico
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.period ?? sheet.period}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>Cohorte</th>
                                    <td className={valueClass}>
                                        {student.cohort ?? ''}
                                    </td>
                                    <th className={labelClass}>Especialidad</th>
                                    <td colSpan={3} className={valueClass}>
                                        {student.specialty}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>
                                        Entidad Académica
                                    </th>
                                    <td colSpan={5} className={valueClass}>
                                        {student.entity}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>
                                        Primer Apellido
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.first_surname}
                                    </td>
                                    <th className={labelClass}>
                                        Segundo Apellido
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.second_surname}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>
                                        Primer Nombre
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.first_name}
                                    </td>
                                    <th className={labelClass}>
                                        Segundo Nombre
                                    </th>
                                    <td colSpan={2} className={valueClass}>
                                        {student.second_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>
                                        Fecha de Nacimiento
                                    </th>
                                    <td className={valueClass}>
                                        {student.birth_date ?? ''}
                                    </td>
                                    <th className={labelClass}>Estado Civil</th>
                                    <td className={valueClass}>
                                        {student.civil_status}
                                    </td>
                                    <th className={labelClass}>Sexo</th>
                                    <td className={valueClass}>
                                        {student.sex}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>Teléfono</th>
                                    <td className={valueClass}>
                                        {student.phone ?? ''}
                                    </td>
                                    <th className={labelClass}>Email</th>
                                    <td colSpan={3} className={valueClass}>
                                        {student.email ?? ''}
                                    </td>
                                </tr>
                                <tr>
                                    <th className={labelClass}>Dirección</th>
                                    <td colSpan={5} className={valueClass}>
                                        {student.address ?? ''}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 className="text-[0.7rem] font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
                        Unidades Curriculares Asesoradas/Inscritas
                    </h4>

                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[40rem] border-collapse text-[0.68rem]">
                            <thead>
                                <tr className="bg-[#d9d9d9] text-[0.6rem] text-upel-navy uppercase dark:bg-muted dark:text-foreground">
                                    <th className="border border-border px-1 py-2 text-center font-extrabold">
                                        PA
                                    </th>
                                    <th className="border border-border px-2 py-2 text-center font-extrabold">
                                        UNIDAD CURRICULAR / EJE CURRICULAR
                                    </th>
                                    <th className="border border-border px-1 py-2 text-center font-extrabold">
                                        COMP
                                    </th>
                                    <th className="border border-border px-1 py-2 text-center font-extrabold">
                                        TIPO
                                    </th>
                                    <th className="border border-border px-1 py-2 text-center font-extrabold">
                                        CA
                                    </th>
                                    <th className="border border-border px-1 py-2 text-center font-extrabold">
                                        INSCRITAS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: previewRows }).map(
                                    (_, index) => {
                                        const row = sheet.rows[index];

                                        return (
                                            <tr
                                                key={index}
                                                className="h-9 font-bold text-upel-navy dark:text-foreground"
                                            >
                                                <td className="border border-border px-1 text-center">
                                                    {row?.pa ?? ''}
                                                </td>
                                                <td className="border border-border px-2 text-center">
                                                    {row?.name ?? ''}
                                                </td>
                                                <td className="border border-border px-1 text-center">
                                                    {row?.component ?? ''}
                                                </td>
                                                <td className="border border-border px-1 text-center">
                                                    {row?.type ?? ''}
                                                </td>
                                                <td className="border border-border px-1 text-center">
                                                    {row?.credits ?? ''}
                                                </td>
                                                <td className="border border-border px-1 text-center">
                                                    {row?.enrolled ? 'X' : ''}
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#d7d7d7] text-[0.6rem] text-upel-navy dark:bg-muted dark:text-foreground">
                                    <td
                                        colSpan={2}
                                        className="border border-border px-2 py-2 text-center font-extrabold"
                                    >
                                        Firma del Estudiante:
                                    </td>
                                    <td
                                        colSpan={3}
                                        className="border border-border px-2 py-2 text-center text-[0.56rem] font-extrabold uppercase"
                                    >
                                        TOTAL CA ASESORADOS E INSCRITOS EN EL
                                        PERÍODO
                                    </td>
                                    <td className="border border-border px-1 py-2 text-center font-extrabold">
                                        {sheet.total_credits}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 className="text-[0.7rem] font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
                        Datos de los Funcionarios
                    </h4>

                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[30rem] border-collapse text-[0.68rem]">
                            <thead>
                                <tr className="text-[0.6rem] font-extrabold text-upel-navy uppercase dark:text-foreground">
                                    <th className="w-[20%] border border-border px-2 py-1.5" />
                                    <th className="border border-border px-2 py-1.5 text-center">
                                        Nombre y Apellido
                                    </th>
                                    <th className="border border-border px-2 py-1.5 text-center">
                                        Fecha
                                    </th>
                                    <th className="border border-border px-2 py-1.5 text-center">
                                        Firma
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {['Asesoría:', 'Inscripción:'].map((label) => (
                                    <tr key={label}>
                                        <th className={labelClass}>{label}</th>
                                        <td className="border border-border px-2 py-2" />
                                        <td className="border border-border px-2 py-2" />
                                        <td className="border border-border px-2 py-2" />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-center text-[0.68rem] font-extrabold text-upel-navy dark:text-foreground">
                        Sello:
                    </p>
                </div>

                <p className="text-[0.66rem] leading-relaxed font-medium text-muted-foreground">
                    Esta planilla refleja las materias inscritas en el período{' '}
                    {sheet.period}.{' '}
                    {isOpen
                        ? 'Si modificas tu selección, la planilla se actualizará al guardar.'
                        : 'La ventana de inscripciones está cerrada; la planilla queda como constancia.'}
                </p>
            </div>
        </section>
    );
}
