import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    GraduationCap,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { type GradingLimits, toDateLabel } from '@/lib/evaluation-plan';
import planRoutes from '@/routes/professor/plans';

type DateOption = {
    value: string;
    label: string;
};

type Cohort = {
    schedule_id: number;
    cohort: string;
    period: number;
    period_label: string;
    label: string;
    study_schedule_label: string;
    starts_on: string | null;
    ends_on: string | null;
    modality_label: string;
    subject_dates: Record<string, DateOption[]>;
};

type CareerOption = {
    id: number;
    name: string;
    code: string;
    program: string;
    modality_label: string;
    cohorts: Cohort[];
    subjects: {
        id: number;
        code: string;
        name: string;
        course: string;
        semester: number;
        modality: string;
        modality_label: string;
    }[];
};

type Period = {
    id: number;
    name: string;
    is_active: boolean;
};

type Draft = {
    key: string;
    title: string;
    content: string;
    weight: string;
    scheduled_on: string;
};

type Props = {
    careers: CareerOption[];
    periods: Period[];
    defaults: {
        academic_period_id: number | null;
        subject_id: number | null;
        schedule_id: number | null;
    };
    professor: {
        name: string;
        cedula: string | null;
    };
    sede: string;
    limits: GradingLimits;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

const selectClass = `${inputClass} appearance-none`;

const newDraft = (scheduledOn: string, weight: string): Draft => ({
    key: Math.random().toString(36).slice(2),
    title: '',
    content: '',
    weight,
    scheduled_on: scheduledOn,
});

/**
 * Formulario para crear un plan de evaluación de una materia y cohorte.
 */
export default function EvaluationPlanCreate({
    careers,
    periods,
    defaults,
    professor,
    sede,
    limits,
}: Props) {
    const defaultCareer =
        careers.find((item) =>
            item.subjects.some((subject) => subject.id === defaults.subject_id),
        ) ??
        careers[0] ??
        null;
    const defaultCohort =
        defaultCareer?.cohorts.find(
            (cohort) => cohort.schedule_id === defaults.schedule_id,
        ) ??
        defaultCareer?.cohorts[0] ??
        null;
    const defaultSubjectId =
        defaults.subject_id ?? defaultCareer?.subjects[0]?.id ?? null;
    const defaultDates =
        defaultSubjectId === null
            ? []
            : (defaultCohort?.subject_dates[String(defaultSubjectId)] ?? []);

    const [careerId, setCareerId] = useState<number | null>(
        defaultCareer?.id ?? null,
    );
    const [scheduleId, setScheduleId] = useState<number | null>(
        defaultCohort?.schedule_id ?? null,
    );
    const [subjectId, setSubjectId] = useState<number | null>(defaultSubjectId);
    const [periodId, setPeriodId] = useState<number | null>(
        defaults.academic_period_id ?? periods[0]?.id ?? null,
    );
    const [drafts, setDrafts] = useState<Draft[]>([
        newDraft(defaultDates[0]?.value ?? '', String(limits.max_item_weight)),
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const career = careers.find((item) => item.id === careerId) ?? null;
    const cohort =
        career?.cohorts.find((item) => item.schedule_id === scheduleId) ?? null;
    const subject =
        career?.subjects.find((item) => item.id === subjectId) ?? null;
    const period = periods.find((item) => item.id === periodId) ?? null;

    const dateOptions = useMemo(
        () =>
            subjectId === null
                ? []
                : (cohort?.subject_dates[String(subjectId)] ?? []),
        [cohort, subjectId],
    );

    const totalWeight = drafts.reduce(
        (total, draft) => total + (Number(draft.weight) || 0),
        0,
    );
    const remaining = Math.max(0, limits.total_weight - totalWeight);

    const usedDates = new Set(
        drafts
            .map((draft) => draft.scheduled_on)
            .filter((value) => value !== ''),
    );
    const firstFreeDate =
        dateOptions.find((option) => !usedDates.has(option.value)) ?? null;

    const dateOptionsFor = (draft: Draft): DateOption[] => {
        const taken = new Set(
            drafts
                .filter(
                    (current) =>
                        current.key !== draft.key &&
                        current.scheduled_on !== '',
                )
                .map((current) => current.scheduled_on),
        );

        return dateOptions.filter((option) => !taken.has(option.value));
    };

    const scheduledDates = useMemo(
        () =>
            drafts
                .map((draft) => draft.scheduled_on)
                .filter((value) => value !== '')
                .sort(),
        [drafts],
    );

    const datesFor = (
        nextCohort: Cohort | null,
        nextSubjectId: number | null,
    ): DateOption[] =>
        nextSubjectId === null
            ? []
            : (nextCohort?.subject_dates[String(nextSubjectId)] ?? []);

    const syncDraftDates = (options: DateOption[]) => {
        setDrafts((current) => {
            const assigned = new Set<string>();

            return current.map((draft) => {
                const keepsDate =
                    options.some(
                        (option) => option.value === draft.scheduled_on,
                    ) && !assigned.has(draft.scheduled_on);

                const scheduledOn = keepsDate
                    ? draft.scheduled_on
                    : (options.find((option) => !assigned.has(option.value))
                          ?.value ?? '');

                if (scheduledOn !== '') {
                    assigned.add(scheduledOn);
                }

                return { ...draft, scheduled_on: scheduledOn };
            });
        });
    };

    const selectCareer = (value: number) => {
        const next = careers.find((item) => item.id === value) ?? null;
        const nextCohort = next?.cohorts[0] ?? null;
        const nextSubjectId = next?.subjects[0]?.id ?? null;

        setCareerId(value);
        setScheduleId(nextCohort?.schedule_id ?? null);
        setSubjectId(nextSubjectId);
        syncDraftDates(datesFor(nextCohort, nextSubjectId));
    };

    const selectCohort = (value: number | null) => {
        const nextCohort =
            career?.cohorts.find((item) => item.schedule_id === value) ?? null;

        setScheduleId(value);
        syncDraftDates(datesFor(nextCohort, subjectId));
    };

    const selectSubject = (value: number | null) => {
        setSubjectId(value);
        syncDraftDates(datesFor(cohort, value));
    };

    const updateDraft = (key: string, field: keyof Draft, value: string) => {
        setDrafts((current) =>
            current.map((draft) =>
                draft.key === key ? { ...draft, [field]: value } : draft,
            ),
        );
    };

    const addDraft = () => {
        if (remaining <= 0 || firstFreeDate === null) {
            return;
        }

        setDrafts((current) => [
            ...current,
            newDraft(
                firstFreeDate.value,
                String(
                    Math.max(
                        limits.min_item_weight,
                        Math.min(limits.max_item_weight, remaining),
                    ),
                ),
            ),
        ]);
    };

    const removeDraft = (key: string) => {
        setDrafts((current) =>
            current.length === 1
                ? current
                : current.filter((draft) => draft.key !== key),
        );
    };

    const submit = () => {
        const nextErrors: Record<string, string> = {};

        if (!scheduleId) {
            nextErrors.schedule_id = 'Selecciona la carrera y el cohorte.';
        }

        if (!subjectId) {
            nextErrors.subject_id = 'Selecciona la materia del plan.';
        } else if (dateOptions.length === 0) {
            nextErrors.subject_id =
                'La materia no tiene horario asignado en este cohorte; no es posible programar evaluaciones.';
        }

        if (!periodId) {
            nextErrors.academic_period_id = 'Selecciona el período académico.';
        }

        if (totalWeight > limits.total_weight) {
            nextErrors.items = `La ponderación no puede superar el ${limits.total_weight} %.`;
        }

        const seenDates = new Set<string>();

        drafts.forEach((draft, index) => {
            if (draft.title.trim() === '') {
                nextErrors[`items.${index}.title`] =
                    'Indica el nombre de la evaluación.';
            }

            if (draft.scheduled_on === '') {
                nextErrors[`items.${index}.scheduled_on`] =
                    'Selecciona un día de clase del horario.';
            } else if (
                !dateOptions.some(
                    (option) => option.value === draft.scheduled_on,
                )
            ) {
                nextErrors[`items.${index}.scheduled_on`] =
                    'La fecha debe ser un día de clase del horario asignado.';
            } else if (seenDates.has(draft.scheduled_on)) {
                nextErrors[`items.${index}.scheduled_on`] =
                    'Esa fecha ya está asignada a otra evaluación del plan.';
            } else {
                seenDates.add(draft.scheduled_on);
            }

            const weight = Number(draft.weight);

            if (
                !Number.isFinite(weight) ||
                weight < limits.min_item_weight ||
                weight > limits.max_item_weight
            ) {
                nextErrors[`items.${index}.weight`] =
                    `La evaluación debe valer entre ${limits.min_item_weight} % y ${limits.max_item_weight} %.`;
            }
        });

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);

            return;
        }

        setErrors({});

        router.post(
            planRoutes.store.url(),
            {
                schedule_id: scheduleId,
                subject_id: subjectId,
                academic_period_id: periodId,
                items: drafts.map((draft) => ({
                    title: draft.title,
                    content: draft.content,
                    weight: Number(draft.weight),
                    scheduled_on: draft.scheduled_on,
                })),
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (received) =>
                    setErrors(received as Record<string, string>),
            },
        );
    };

    return (
        <>
            <Head title="Nuevo plan de evaluación" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Portal Docente"
                    title="Nuevo plan de evaluación"
                    description="Elige la carrera, el cohorte y la materia. Luego distribuye el 100 % entre las evaluaciones del período."
                    actions={
                        <Link
                            href={planRoutes.index.url()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a mis planes
                        </Link>
                    }
                />

                {careers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-upel-cloud/60 px-6 py-12 text-center dark:bg-muted/30">
                        <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                            Pendiente por asignación
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            El decano todavía no te asignó materias ni carreras
                            en un horario publicado. Cuando lo haga, podrás
                            crear tu plan de evaluación.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-6">
                            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <h2 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                    Carrera, cohorte y materia
                                </h2>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="career"
                                            className={labelClass}
                                        >
                                            Carrera (Especialidad)
                                        </label>
                                        <select
                                            id="career"
                                            className={selectClass}
                                            value={careerId ?? ''}
                                            onChange={(event) =>
                                                selectCareer(
                                                    Number(event.target.value),
                                                )
                                            }
                                        >
                                            {careers.map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.name} · {item.program}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="cohort"
                                            className={labelClass}
                                        >
                                            Cohorte
                                        </label>
                                        <select
                                            id="cohort"
                                            className={selectClass}
                                            value={scheduleId ?? ''}
                                            onChange={(event) =>
                                                selectCohort(
                                                    event.target.value === ''
                                                        ? null
                                                        : Number(
                                                              event.target
                                                                  .value,
                                                          ),
                                                )
                                            }
                                            disabled={
                                                !career ||
                                                career.cohorts.length === 0
                                            }
                                        >
                                            {career?.cohorts.length ? (
                                                career.cohorts.map((item) => (
                                                    <option
                                                        key={item.schedule_id}
                                                        value={item.schedule_id}
                                                    >
                                                        {item.label}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">
                                                    Sin cohortes publicados
                                                </option>
                                            )}
                                        </select>
                                        <InputError
                                            message={errors.schedule_id}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="subject"
                                            className={labelClass}
                                        >
                                            Materia (Curso)
                                        </label>
                                        <select
                                            id="subject"
                                            className={selectClass}
                                            value={subjectId ?? ''}
                                            onChange={(event) =>
                                                selectSubject(
                                                    event.target.value === ''
                                                        ? null
                                                        : Number(
                                                              event.target
                                                                  .value,
                                                          ),
                                                )
                                            }
                                        >
                                            {career?.subjects.map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.course} · Semestre{' '}
                                                    {item.semester}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.subject_id}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="period"
                                            className={labelClass}
                                        >
                                            Período académico
                                        </label>
                                        <select
                                            id="period"
                                            className={selectClass}
                                            value={periodId ?? ''}
                                            onChange={(event) =>
                                                setPeriodId(
                                                    event.target.value === ''
                                                        ? null
                                                        : Number(
                                                              event.target
                                                                  .value,
                                                          ),
                                                )
                                            }
                                        >
                                            {periods.map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.name}
                                                    {item.is_active
                                                        ? ' · vigente'
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.academic_period_id}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <span className={labelClass}>
                                            Ambiente
                                        </span>
                                        <div className="flex h-10 w-full items-center rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground dark:bg-muted/40">
                                            {subject?.modality_label ??
                                                'Selecciona una materia'}
                                        </div>
                                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                            Se toma de la modalidad registrada
                                            en la materia.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl border border-border/70 bg-upel-cloud/40 p-4 dark:bg-muted/20">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase">
                                            Días de clase del horario
                                        </p>
                                        <span className="text-[0.66rem] font-semibold text-muted-foreground">
                                            {dateOptions.length}{' '}
                                            {dateOptions.length === 1
                                                ? 'día'
                                                : 'días'}
                                        </span>
                                    </div>

                                    {dateOptions.length === 0 ? (
                                        <div className="mt-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-50 px-3 py-2 text-[0.7rem] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                            Sin horario asignado
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                                            {dateOptions.map((option) => (
                                                <span
                                                    key={option.value}
                                                    className="rounded-lg border border-border bg-white px-2 py-1 text-[0.65rem] font-semibold text-upel-navy dark:bg-card dark:text-foreground"
                                                >
                                                    {option.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="mt-2 text-[0.65rem] leading-relaxed text-muted-foreground">
                                        Las evaluaciones solo pueden programarse
                                        en los días de clase que el horario
                                        asigna a la materia y cada día se usa
                                        una sola vez.
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div>
                                        <h2 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                            Evaluaciones del plan
                                        </h2>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Cada evaluación vale entre{' '}
                                            {limits.min_item_weight} % y{' '}
                                            {limits.max_item_weight} %. El total
                                            debe llegar al {limits.total_weight}{' '}
                                            %.
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase">
                                            Ponderación
                                        </p>
                                        <p className="font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                            {totalWeight} %
                                            <span className="ml-1 text-xs font-semibold text-muted-foreground">
                                                / {limits.total_weight} %
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-upel-cloud dark:bg-muted">
                                    <div
                                        className={
                                            totalWeight > limits.total_weight
                                                ? 'h-full rounded-full bg-red-500'
                                                : 'h-full rounded-full bg-upel-blue'
                                        }
                                        style={{
                                            width: `${Math.min(100, totalWeight)}%`,
                                        }}
                                    />
                                </div>

                                <InputError
                                    message={errors.items}
                                    className="mt-2 text-xs"
                                />

                                <div className="mt-5 space-y-4">
                                    {drafts.map((draft, index) => (
                                        <div
                                            key={draft.key}
                                            className="rounded-xl border border-border/70 bg-upel-cloud/30 p-4 dark:bg-muted/20"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                    Evaluación {index + 1}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDraft(draft.key)
                                                    }
                                                    disabled={
                                                        drafts.length === 1
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.66rem] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Quitar
                                                </button>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_190px_120px]">
                                                <div>
                                                    <label
                                                        htmlFor={`title-${draft.key}`}
                                                        className={labelClass}
                                                    >
                                                        Evaluación
                                                    </label>
                                                    <input
                                                        id={`title-${draft.key}`}
                                                        type="text"
                                                        value={draft.title}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                draft.key,
                                                                'title',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={inputClass}
                                                        placeholder="Taller, prueba escrita, exposición…"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${index}.title`
                                                            ]
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor={`date-${draft.key}`}
                                                        className={labelClass}
                                                    >
                                                        Fecha
                                                    </label>
                                                    {dateOptions.length ===
                                                    0 ? (
                                                        <div className="flex h-10 w-full items-center rounded-xl border border-dashed border-amber-500/50 bg-amber-50 px-3 text-[0.7rem] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                            Sin horario asignado
                                                        </div>
                                                    ) : (
                                                        <select
                                                            id={`date-${draft.key}`}
                                                            className={
                                                                selectClass
                                                            }
                                                            value={
                                                                draft.scheduled_on
                                                            }
                                                            onChange={(event) =>
                                                                updateDraft(
                                                                    draft.key,
                                                                    'scheduled_on',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            {draft.scheduled_on ===
                                                            '' ? (
                                                                <option value="">
                                                                    Sin fecha
                                                                    disponible
                                                                </option>
                                                            ) : null}
                                                            {dateOptionsFor(
                                                                draft,
                                                            ).map((option) => (
                                                                <option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${index}.scheduled_on`
                                                            ]
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor={`weight-${draft.key}`}
                                                        className={labelClass}
                                                    >
                                                        % de nota
                                                    </label>
                                                    <input
                                                        id={`weight-${draft.key}`}
                                                        type="number"
                                                        min={
                                                            limits.min_item_weight
                                                        }
                                                        max={
                                                            limits.max_item_weight
                                                        }
                                                        value={draft.weight}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                draft.key,
                                                                'weight',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={inputClass}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${index}.weight`
                                                            ]
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <label
                                                    htmlFor={`content-${draft.key}`}
                                                    className={labelClass}
                                                >
                                                    Contenido de la evaluación
                                                </label>
                                                <textarea
                                                    id={`content-${draft.key}`}
                                                    rows={2}
                                                    value={draft.content}
                                                    onChange={(event) =>
                                                        updateDraft(
                                                            draft.key,
                                                            'content',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-muted/40"
                                                    placeholder="Contenidos, criterios o temas que se evaluarán"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={addDraft}
                                        disabled={
                                            remaining <= 0 ||
                                            dateOptions.length === 0 ||
                                            firstFreeDate === null
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-upel-blue/40 px-4 py-2.5 text-xs font-bold text-upel-blue transition-colors hover:bg-upel-blue/5 disabled:opacity-40"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar evaluación
                                    </button>

                                    <p className="text-[0.7rem] font-semibold text-muted-foreground">
                                        {remaining === 0
                                            ? 'Ponderación completa.'
                                            : `Te quedan ${remaining} % por asignar.`}
                                    </p>
                                </div>

                                {dateOptions.length > 0 &&
                                firstFreeDate === null ? (
                                    <p className="mt-2 text-[0.7rem] font-bold text-amber-700 dark:text-amber-300">
                                        Todas las fechas del horario ya están
                                        asignadas a una evaluación.
                                    </p>
                                ) : null}
                            </section>

                            <div className="flex flex-wrap items-center justify-end gap-3">
                                {dateOptions.length === 0 ? (
                                    <p className="mr-auto text-[0.7rem] font-bold text-amber-700 dark:text-amber-300">
                                        La materia no tiene horario asignado; no
                                        es posible crear el plan.
                                    </p>
                                ) : null}
                                <Link
                                    href={planRoutes.index.url()}
                                    className="rounded-xl border border-border bg-white px-5 py-3 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={
                                        processing || dateOptions.length === 0
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-6 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing
                                        ? 'Guardando…'
                                        : 'Crear plan de evaluación'}
                                </button>
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl bg-upel-navy p-6 text-white shadow-sm">
                                <div className="flex items-center gap-2 text-upel-gold-light">
                                    <GraduationCap className="h-4 w-4" />
                                    <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
                                        Vista previa de la planilla
                                    </p>
                                </div>

                                <dl className="mt-4 space-y-3 text-xs">
                                    {[
                                        ['Profesor', professor.name],
                                        [
                                            'Cédula',
                                            professor.cedula ??
                                                'Sin cédula registrada',
                                        ],
                                        ['Programa', career?.program ?? '—'],
                                        ['Sede/Extensión', sede],
                                        ['Especialidad', career?.name ?? '—'],
                                        ['Curso', subject?.course ?? '—'],
                                        [
                                            'Período académico',
                                            period?.name ?? '—',
                                        ],
                                        [
                                            'Horario',
                                            cohort?.study_schedule_label ?? '—',
                                        ],
                                        [
                                            'Ambiente',
                                            subject?.modality_label ?? '—',
                                        ],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="flex items-start justify-between gap-4 border-b border-white/10 pb-2 last:border-0 last:pb-0"
                                        >
                                            <dt className="text-white/55">
                                                {label}
                                            </dt>
                                            <dd className="max-w-[60%] text-right font-bold text-white">
                                                {value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <div className="flex items-center gap-2 text-upel-blue">
                                    <CalendarDays className="h-4 w-4" />
                                    <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
                                        Ventana del plan
                                    </p>
                                </div>

                                <dl className="mt-4 space-y-3 text-xs">
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Fecha de inicio
                                        </dt>
                                        <dd className="font-bold text-upel-navy dark:text-foreground">
                                            {scheduledDates.length
                                                ? toDateLabel(scheduledDates[0])
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Fecha de fin
                                        </dt>
                                        <dd className="font-bold text-upel-navy dark:text-foreground">
                                            {scheduledDates.length
                                                ? toDateLabel(
                                                      scheduledDates[
                                                          scheduledDates.length -
                                                              1
                                                      ],
                                                  )
                                                : '—'}
                                        </dd>
                                    </div>
                                </dl>

                                <p className="mt-4 rounded-xl bg-upel-cloud/60 px-3 py-2 text-[0.68rem] leading-relaxed text-muted-foreground dark:bg-muted/40">
                                    Las fechas se calculan automáticamente con
                                    la primera y la última evaluación del plan.
                                </p>

                                {cohort?.starts_on || cohort?.ends_on ? (
                                    <p className="mt-3 text-[0.68rem] text-muted-foreground">
                                        Cohorte del {cohort?.starts_on ?? '—'}{' '}
                                        al {cohort?.ends_on ?? '—'}.
                                    </p>
                                ) : null}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
}
