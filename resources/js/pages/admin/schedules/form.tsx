import { useMemo } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    Clock,
    Loader2,
    Save,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { SchedulePreview } from '@/components/admin/schedule-preview';
import { PageHeader } from '@/components/portal/page-header';
import {
    buildClassDates,
    buildScheduleWeeks,
    daysLabel,
    formatTimeRange,
    groupClassDates,
    monthsBetween,
    timeSlotLabels,
} from '@/lib/schedule-calendar';
import {
    index as schedulesIndex,
    store as schedulesStore,
} from '@/routes/admin/schedules';
import type {
    StudentScheduleData,
    StudentScheduleSubject,
    StudentScheduleWeek,
} from '@/types/student';

type PeriodOption = {
    value: number;
    label: string;
};

type CareerOption = {
    id: number;
    name: string;
    code: string;
    duration_semesters: number;
    periods: PeriodOption[];
};

type TemplateSubject = {
    code: string;
    name: string;
    teacher: string;
    hours: Record<string, string>;
};

type ScheduleTemplate = {
    weeks: StudentScheduleWeek[];
    subjects: TemplateSubject[];
    time_slots: string[];
    distance_schedule: string | null;
    distance_time: string | null;
};

type SubjectOption = {
    id: number;
    career_id: number;
    semester: number;
    code: string;
    name: string;
    modality: string;
    professors: {
        id: number;
        name: string;
    }[];
};

type ScheduleTypeOption = {
    value: string;
    label: string;
};

type SubjectChoice = {
    position: string;
    subject_id: string;
    professor_id: string;
    teacher_name: string;
    starts_at: string;
    ends_at: string;
    dates: string[];
};

type ScheduleFormData = {
    career_id: string;
    period: string;
    cohort: string;
    study_schedule: string;
    starts_on: string;
    ends_on: string;
    subjects: SubjectChoice[];
};

type Props = {
    careers: CareerOption[];
    template: ScheduleTemplate;
    study_schedules: ScheduleTypeOption[];
    subjects: SubjectOption[];
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

const DEFAULT_STARTS_AT = '08:00';
const DEFAULT_ENDS_AT = '12:00';

/**
 * Publica un horario con la plantilla oficial del documento de la Coordinación
 * de Docencia y una vista previa en vivo.
 */
export default function AdminScheduleForm({
    careers,
    template,
    study_schedules: scheduleTypes,
    subjects: subjectCatalog,
}: Props) {
    const form = useForm<ScheduleFormData>({
        career_id: '',
        period: '1',
        cohort: '',
        study_schedule: scheduleTypes[0]?.value ?? 'sabatino',
        starts_on: '',
        ends_on: '',
        subjects: template.subjects.map((_subject, index) => ({
            position: String(index + 1),
            subject_id: '',
            professor_id: '',
            teacher_name: '',
            starts_at: DEFAULT_STARTS_AT,
            ends_at: DEFAULT_ENDS_AT,
            dates: [],
        })),
    });

    const selectedCareer = careers.find(
        (career) => String(career.id) === form.data.career_id,
    );

    const periodLabel =
        selectedCareer?.periods.find(
            (period) => String(period.value) === form.data.period,
        )?.label ?? '—';

    const careerId = Number(form.data.career_id);
    const period = Number(form.data.period);

    const availableSubjects = useMemo(
        () =>
            subjectCatalog.filter(
                (subject) =>
                    subject.career_id === careerId &&
                    subject.semester === period,
            ),
        [careerId, period, subjectCatalog],
    );

    const subjectById = useMemo(
        () => new Map(subjectCatalog.map((subject) => [subject.id, subject])),
        [subjectCatalog],
    );

    const templateTeachers = useMemo(
        () =>
            Array.from(
                new Set(
                    template.subjects
                        .map((subject) => subject.teacher.trim())
                        .filter((teacher) => teacher !== ''),
                ),
            ),
        [template],
    );

    const range = {
        starts_on: form.data.starts_on,
        ends_on: form.data.ends_on,
        study_schedule: form.data.study_schedule,
    };

    const classDates = useMemo(
        () => buildClassDates(range),
        [form.data.starts_on, form.data.ends_on, form.data.study_schedule],
    );

    const weeks = useMemo(
        () => buildScheduleWeeks(range),
        [form.data.starts_on, form.data.ends_on, form.data.study_schedule],
    );

    const months = useMemo(
        () =>
            monthsBetween({
                starts_on: form.data.starts_on,
                ends_on: form.data.ends_on,
            }),
        [form.data.starts_on, form.data.ends_on],
    );

    const dateGroups = useMemo(() => groupClassDates(classDates), [classDates]);

    const scheduleTypeLabel =
        scheduleTypes.find(
            (option) => option.value === form.data.study_schedule,
        )?.label ?? 'Sabatino';

    const previewSubjects = useMemo<StudentScheduleSubject[]>(() => {
        return form.data.subjects
            .map((choice): StudentScheduleSubject | null => {
                const subject = subjectById.get(Number(choice.subject_id));
                const slot = template.subjects[Number(choice.position) - 1];

                if (subject === undefined || slot === undefined) {
                    return null;
                }

                const chosenProfessor =
                    choice.professor_id !== ''
                        ? subject.professors.find(
                              (professor) =>
                                  professor.id === Number(choice.professor_id),
                          )
                        : undefined;
                const chosenTeacherName = choice.teacher_name.trim();
                const chosenDates = new Set(choice.dates);
                const timeLabel = formatTimeRange(
                    choice.starts_at,
                    choice.ends_at,
                );

                return {
                    code: subject.code,
                    name: subject.name,
                    teacher:
                        chosenProfessor?.name ??
                        (chosenTeacherName !== ''
                            ? chosenTeacherName
                            : (subject.professors[0]?.name ?? slot.teacher)),
                    hours: weeks.map((week) => {
                        const matches = (week.dates ?? []).filter((date) =>
                            chosenDates.has(date),
                        );

                        if (matches.length === 0) {
                            return null;
                        }

                        if (subject.modality === 'online') {
                            return 'Virtual';
                        }

                        return form.data.study_schedule === 'sabatino'
                            ? timeLabel
                            : `${daysLabel(matches)} · ${timeLabel}`;
                    }),
                };
            })
            .filter(
                (subject): subject is StudentScheduleSubject =>
                    subject !== null,
            );
    }, [
        form.data.subjects,
        form.data.study_schedule,
        subjectById,
        template,
        weeks,
    ]);

    const preview = useMemo<StudentScheduleData>(() => {
        const distanceSubjects = previewSubjects.map((subject) => ({
            ...subject,
            hours: subject.hours.map((hour) =>
                hour === 'Virtual' ? 'Virtual' : null,
            ),
        }));

        const cohort =
            form.data.cohort.trim() !== '' ? form.data.cohort : '2025-II';

        const slots = timeSlotLabels(
            form.data.subjects
                .filter(
                    (choice) =>
                        choice.subject_id !== '' && choice.dates.length > 0,
                )
                .map((choice) => ({
                    starts_at: choice.starts_at,
                    ends_at: choice.ends_at,
                })),
        );

        return {
            title: `HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO ${cohort}`,
            career: selectedCareer?.name ?? 'Selecciona una carrera',
            cohort,
            period: periodLabel,
            schedule_label: scheduleTypeLabel,
            weeks,
            subjects: previewSubjects,
            distance_subjects: distanceSubjects,
            time_slots: slots,
            distance_schedule: template.distance_schedule,
            distance_time: template.distance_time,
        };
    }, [
        form.data.cohort,
        form.data.subjects,
        periodLabel,
        previewSubjects,
        scheduleTypeLabel,
        selectedCareer,
        template,
        weeks,
    ]);

    const clearSubjects = (choices: SubjectChoice[]): SubjectChoice[] =>
        choices.map((choice) => ({
            ...choice,
            subject_id: '',
            professor_id: '',
            teacher_name: '',
            starts_at: DEFAULT_STARTS_AT,
            ends_at: DEFAULT_ENDS_AT,
            dates: [],
        }));

    const resetDates = (choices: SubjectChoice[]): SubjectChoice[] =>
        choices.map((choice) => ({
            ...choice,
            dates: [],
        }));

    const selectCareer = (value: string) => {
        const career = careers.find((option) => String(option.id) === value);

        form.setData((current) => ({
            ...current,
            career_id: value,
            period: career
                ? String(career.periods[0]?.value ?? 1)
                : current.period,
            subjects: clearSubjects(current.subjects),
        }));
    };

    const selectPeriod = (value: string) => {
        form.setData((current) => ({
            ...current,
            period: value,
            subjects: clearSubjects(current.subjects),
        }));
    };

    const selectStudySchedule = (value: string) => {
        form.setData((current) => ({
            ...current,
            study_schedule: value,
            subjects: resetDates(current.subjects),
        }));
    };

    const selectRangeDate = (key: 'starts_on' | 'ends_on', value: string) => {
        form.setData((current) => ({
            ...current,
            [key]: value,
            subjects: resetDates(current.subjects),
        }));
    };

    const setSubject = (index: number, subjectId: string) => {
        const subject = subjectById.get(Number(subjectId));
        const choice = form.data.subjects[index];
        const slot =
            choice !== undefined
                ? template.subjects[Number(choice.position) - 1]
                : undefined;
        const defaultProfessor = subject?.professors[0]?.id;

        form.setData(
            'subjects',
            form.data.subjects.map((item, position) =>
                position === index
                    ? {
                          ...item,
                          subject_id: subjectId,
                          professor_id:
                              defaultProfessor !== undefined
                                  ? String(defaultProfessor)
                                  : '',
                          teacher_name:
                              defaultProfessor === undefined
                                  ? (slot?.teacher ?? '')
                                  : '',
                      }
                    : item,
            ),
        );
    };

    const setTeacher = (index: number, value: string) => {
        const [kind, ...rest] = value.split(':');
        const raw = rest.join(':');

        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) =>
                position === index
                    ? {
                          ...choice,
                          professor_id: kind === 'professor' ? raw : '',
                          teacher_name: kind === 'teacher' ? raw : '',
                      }
                    : choice,
            ),
        );
    };

    const setTime = (
        index: number,
        key: 'starts_at' | 'ends_at',
        value: string,
    ) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) =>
                position === index ? { ...choice, [key]: value } : choice,
            ),
        );
    };

    const toggleDate = (index: number, date: string) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) => {
                if (position !== index) {
                    return choice;
                }

                const selected = choice.dates.includes(date);

                return {
                    ...choice,
                    dates: selected
                        ? choice.dates.filter((item) => item !== date)
                        : [...choice.dates, date].sort(),
                };
            }),
        );
    };

    const setAllDates = (index: number, selected: boolean) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) =>
                position === index
                    ? {
                          ...choice,
                          dates: selected
                              ? classDates.map((date) => date.date)
                              : [],
                      }
                    : choice,
            ),
        );
    };

    const optionsFor = (index: number): SubjectOption[] => {
        const used = new Set(
            form.data.subjects
                .filter((_choice, position) => position !== index)
                .map((choice) => choice.subject_id)
                .filter((subjectId) => subjectId !== ''),
        );

        return availableSubjects.filter(
            (subject) => !used.has(String(subject.id)),
        );
    };

    const usedSubjects = form.data.subjects.filter(
        (choice) => choice.subject_id !== '',
    );

    const hasSubjects = usedSubjects.length > 0;

    const hasCompleteSubjects =
        hasSubjects &&
        usedSubjects.every(
            (choice) =>
                choice.dates.length > 0 &&
                choice.starts_at !== '' &&
                choice.ends_at !== '',
        );

    const canSubmit =
        form.data.career_id !== '' &&
        form.data.starts_on !== '' &&
        form.data.ends_on !== '' &&
        classDates.length > 0 &&
        hasCompleteSubjects;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            subjects: data.subjects.filter(
                (choice) => choice.subject_id !== '',
            ),
        }));

        form.post(schedulesStore.url());
    };

    return (
        <>
            <Head title="Nuevo horario" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Nuevo horario"
                    description="Define el rango de clases y publica el horario oficial de una carrera, período y cohorte."
                    actions={
                        <Link
                            href={schedulesIndex()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al listado
                        </Link>
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                        <div className="space-y-6">
                            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-upel-blue" />
                                    <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                        Datos del horario
                                    </h2>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    La carrera y el período definen a quién
                                    corresponde el horario; la cohorte se
                                    escribe manualmente.
                                </p>

                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label
                                            htmlFor="career_id"
                                            className={labelClass}
                                        >
                                            Carrera
                                        </label>
                                        <select
                                            id="career_id"
                                            value={form.data.career_id}
                                            onChange={(event) =>
                                                selectCareer(event.target.value)
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.career_id,
                                            )}
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Selecciona una carrera
                                            </option>
                                            {careers.map((career) => (
                                                <option
                                                    key={career.id}
                                                    value={career.id}
                                                >
                                                    {career.name} ({career.code}
                                                    )
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={form.errors.career_id}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="study_schedule"
                                                className={labelClass}
                                            >
                                                Tipo de horario
                                            </label>
                                            <select
                                                id="study_schedule"
                                                value={form.data.study_schedule}
                                                onChange={(event) =>
                                                    selectStudySchedule(
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.study_schedule,
                                                )}
                                                className={inputClass}
                                            >
                                                {scheduleTypes.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={
                                                    form.errors.study_schedule
                                                }
                                                className="mt-1 text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="period"
                                                className={labelClass}
                                            >
                                                Período
                                            </label>
                                            <select
                                                id="period"
                                                value={form.data.period}
                                                onChange={(event) =>
                                                    selectPeriod(
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.period,
                                                )}
                                                disabled={
                                                    selectedCareer === undefined
                                                }
                                                className={inputClass}
                                            >
                                                {selectedCareer ===
                                                undefined ? (
                                                    <option value="">
                                                        Selecciona una carrera
                                                    </option>
                                                ) : null}
                                                {(
                                                    selectedCareer?.periods ??
                                                    []
                                                ).map((periodOption) => (
                                                    <option
                                                        key={periodOption.value}
                                                        value={
                                                            periodOption.value
                                                        }
                                                    >
                                                        {periodOption.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={form.errors.period}
                                                className="mt-1 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="cohort"
                                            className={labelClass}
                                        >
                                            Cohorte
                                        </label>
                                        <input
                                            id="cohort"
                                            type="text"
                                            value={form.data.cohort}
                                            onChange={(event) =>
                                                form.setData(
                                                    'cohort',
                                                    event.target.value.toUpperCase(),
                                                )
                                            }
                                            maxLength={7}
                                            placeholder="2025-II"
                                            aria-invalid={Boolean(
                                                form.errors.cohort,
                                            )}
                                            className={inputClass}
                                        />
                                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                                            Año, guion y momento: 2025-I o
                                            2025-II.
                                        </p>
                                        <InputError
                                            message={form.errors.cohort}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-upel-cloud/40 p-3 dark:bg-muted/30">
                                        <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-upel-navy dark:text-foreground">
                                            <Clock className="h-3.5 w-3.5 text-upel-blue" />
                                            Rango de clases
                                        </p>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="starts_on"
                                                    className={labelClass}
                                                >
                                                    Fecha de inicio
                                                </label>
                                                <input
                                                    id="starts_on"
                                                    type="date"
                                                    value={form.data.starts_on}
                                                    onChange={(event) =>
                                                        selectRangeDate(
                                                            'starts_on',
                                                            event.target.value,
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        form.errors.starts_on,
                                                    )}
                                                    className={inputClass}
                                                />
                                                <InputError
                                                    message={
                                                        form.errors.starts_on
                                                    }
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="ends_on"
                                                    className={labelClass}
                                                >
                                                    Fecha de finalización
                                                </label>
                                                <input
                                                    id="ends_on"
                                                    type="date"
                                                    value={form.data.ends_on}
                                                    min={form.data.starts_on}
                                                    onChange={(event) =>
                                                        selectRangeDate(
                                                            'ends_on',
                                                            event.target.value,
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        form.errors.ends_on,
                                                    )}
                                                    className={inputClass}
                                                />
                                                <InputError
                                                    message={
                                                        form.errors.ends_on
                                                    }
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                        </div>

                                        {classDates.length === 0 ? (
                                            <p className="mt-3 text-[0.68rem] font-semibold text-muted-foreground">
                                                Elige la fecha de inicio y de
                                                finalización para generar los
                                                meses, las semanas y las fechas
                                                de clase.
                                            </p>
                                        ) : (
                                            <div className="mt-3 space-y-2 text-[0.68rem]">
                                                <p className="font-bold text-upel-navy dark:text-foreground">
                                                    {classDates.length} fechas
                                                    de clase · {weeks.length}{' '}
                                                    semanas
                                                </p>
                                                <p className="text-muted-foreground">
                                                    <strong className="text-upel-navy dark:text-foreground">
                                                        Meses:
                                                    </strong>{' '}
                                                    {months
                                                        .map(
                                                            (month) =>
                                                                month.month,
                                                        )
                                                        .join(', ')}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {months.map((month) => (
                                                        <span
                                                            key={
                                                                month.month_key
                                                            }
                                                            className="rounded-md bg-white px-1.5 py-0.5 font-semibold text-upel-blue dark:bg-card"
                                                        >
                                                            {month.month}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={form.processing || !canSubmit}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}
                                    Publicar horario
                                </button>
                                <Link
                                    href={schedulesIndex()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                >
                                    Cancelar
                                </Link>
                            </div>

                            <p className="rounded-xl bg-upel-cloud px-3 py-2.5 text-[0.68rem] leading-relaxed font-semibold text-muted-foreground dark:bg-muted">
                                El horario Sabatino genera una columna por cada
                                sábado del rango. El horario de Lunes a Viernes
                                agrupa los días por semana y muestra dentro de
                                la celda los días y la hora de cada materia.
                            </p>
                        </div>

                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-upel-blue" />
                                <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    Unidades / Ejes curriculares
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Elige la materia, el docente, la hora y los días
                                exactos de clase. Una materia ya elegida no
                                vuelve a aparecer en las demás filas.
                            </p>

                            {selectedCareer === undefined ? (
                                <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-semibold text-muted-foreground">
                                    Selecciona una carrera y un período para ver
                                    las materias disponibles.
                                </p>
                            ) : (
                                <>
                                    <div className="mt-5 space-y-3">
                                        {form.data.subjects.map(
                                            (choice, index) => {
                                                const selected =
                                                    subjectById.get(
                                                        Number(
                                                            choice.subject_id,
                                                        ),
                                                    );
                                                const rowError =
                                                    form.errors[
                                                        `subjects.${index}.subject_id`
                                                    ];
                                                const professorError =
                                                    form.errors[
                                                        `subjects.${index}.professor_id`
                                                    ] ??
                                                    form.errors[
                                                        `subjects.${index}.teacher_name`
                                                    ];
                                                const datesError =
                                                    form.errors[
                                                        `subjects.${index}.dates`
                                                    ];
                                                const timeError =
                                                    form.errors[
                                                        `subjects.${index}.starts_at`
                                                    ] ??
                                                    form.errors[
                                                        `subjects.${index}.ends_at`
                                                    ];
                                                const professors =
                                                    selected?.professors ?? [];
                                                const professorNames = new Set(
                                                    professors.map(
                                                        (professor) =>
                                                            professor.name,
                                                    ),
                                                );
                                                const plantillaTeachers =
                                                    templateTeachers.filter(
                                                        (teacher) =>
                                                            !professorNames.has(
                                                                teacher,
                                                            ),
                                                    );
                                                const teacherValue =
                                                    choice.professor_id !== ''
                                                        ? `professor:${choice.professor_id}`
                                                        : choice.teacher_name !==
                                                            ''
                                                          ? `teacher:${choice.teacher_name}`
                                                          : '';
                                                const timeLabel =
                                                    formatTimeRange(
                                                        choice.starts_at,
                                                        choice.ends_at,
                                                    );

                                                return (
                                                    <div
                                                        key={choice.position}
                                                        className="rounded-xl border border-border/70 bg-upel-cloud/20 p-3 dark:bg-muted/20"
                                                    >
                                                        <div className="grid gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_11rem_6.5rem] sm:items-start">
                                                            <span className="mt-2.5 hidden h-6 w-6 items-center justify-center rounded-lg bg-upel-cloud text-[0.65rem] font-extrabold text-upel-navy sm:flex dark:bg-muted dark:text-foreground">
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <label
                                                                    htmlFor={`subject-${index}`}
                                                                    className="sr-only"
                                                                >
                                                                    Materia de
                                                                    la fila{' '}
                                                                    {index + 1}
                                                                </label>
                                                                <select
                                                                    id={`subject-${index}`}
                                                                    value={
                                                                        choice.subject_id
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setSubject(
                                                                            index,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    aria-invalid={Boolean(
                                                                        rowError,
                                                                    )}
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Selecciona
                                                                        una
                                                                        materia
                                                                    </option>
                                                                    {optionsFor(
                                                                        index,
                                                                    ).map(
                                                                        (
                                                                            subject,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    subject.id
                                                                                }
                                                                                value={
                                                                                    subject.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    subject.name
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                                {selected?.modality ===
                                                                'online' ? (
                                                                    <p className="mt-1 text-[0.62rem] font-bold text-upel-blue">
                                                                        Modalidad
                                                                        online ·
                                                                        se
                                                                        mostrará
                                                                        como
                                                                        Virtual
                                                                    </p>
                                                                ) : null}
                                                                <InputError
                                                                    message={
                                                                        rowError
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label
                                                                    htmlFor={`professor-${index}`}
                                                                    className="sr-only"
                                                                >
                                                                    Docente de
                                                                    la materia{' '}
                                                                    {index + 1}
                                                                </label>
                                                                <select
                                                                    id={`professor-${index}`}
                                                                    value={
                                                                        teacherValue
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setTeacher(
                                                                            index,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        selected ===
                                                                        undefined
                                                                    }
                                                                    aria-invalid={Boolean(
                                                                        professorError,
                                                                    )}
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                >
                                                                    {professors.length >
                                                                    0 ? (
                                                                        <optgroup label="Docentes asignados a la materia">
                                                                            {professors.map(
                                                                                (
                                                                                    professor,
                                                                                ) => (
                                                                                    <option
                                                                                        key={`professor-${professor.id}`}
                                                                                        value={`professor:${professor.id}`}
                                                                                    >
                                                                                        {
                                                                                            professor.name
                                                                                        }
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                        </optgroup>
                                                                    ) : null}
                                                                    <optgroup label="Docentes de la plantilla">
                                                                        {plantillaTeachers.map(
                                                                            (
                                                                                teacher,
                                                                            ) => (
                                                                                <option
                                                                                    key={`teacher-${teacher}`}
                                                                                    value={`teacher:${teacher}`}
                                                                                >
                                                                                    {
                                                                                        teacher
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </optgroup>
                                                                </select>
                                                                <InputError
                                                                    message={
                                                                        professorError
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                            <div className="mt-0.5 flex h-10 items-center justify-center rounded-xl border border-border bg-upel-cloud/50 px-3 dark:bg-muted/40">
                                                                <span className="font-mono text-[0.7rem] font-bold text-upel-navy dark:text-foreground">
                                                                    {selected?.code ??
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {selected !==
                                                        undefined ? (
                                                            <div className="mt-3 space-y-3">
                                                                <div className="flex flex-wrap items-end gap-2">
                                                                    <div className="w-[7.5rem]">
                                                                        <label
                                                                            htmlFor={`starts-at-${index}`}
                                                                            className={
                                                                                labelClass
                                                                            }
                                                                        >
                                                                            Hora
                                                                            de
                                                                            inicio
                                                                        </label>
                                                                        <input
                                                                            id={`starts-at-${index}`}
                                                                            type="time"
                                                                            value={
                                                                                choice.starts_at
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                setTime(
                                                                                    index,
                                                                                    'starts_at',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className={
                                                                                inputClass
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="w-[7.5rem]">
                                                                        <label
                                                                            htmlFor={`ends-at-${index}`}
                                                                            className={
                                                                                labelClass
                                                                            }
                                                                        >
                                                                            Hora
                                                                            de
                                                                            fin
                                                                        </label>
                                                                        <input
                                                                            id={`ends-at-${index}`}
                                                                            type="time"
                                                                            value={
                                                                                choice.ends_at
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                setTime(
                                                                                    index,
                                                                                    'ends_at',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className={
                                                                                inputClass
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <span className="flex h-10 items-center rounded-xl border border-border bg-white px-3 text-[0.7rem] font-bold text-upel-navy dark:bg-card dark:text-foreground">
                                                                        {timeLabel !==
                                                                        ''
                                                                            ? timeLabel
                                                                            : 'Define la hora'}
                                                                    </span>
                                                                    <span className="flex h-10 items-center rounded-xl bg-upel-cloud px-3 text-[0.68rem] font-bold text-upel-blue dark:bg-muted">
                                                                        {
                                                                            choice
                                                                                .dates
                                                                                .length
                                                                        }{' '}
                                                                        días
                                                                        marcados
                                                                    </span>
                                                                </div>
                                                                <InputError
                                                                    message={
                                                                        timeError
                                                                    }
                                                                    className="text-xs"
                                                                />

                                                                {classDates.length ===
                                                                0 ? (
                                                                    <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[0.68rem] font-semibold text-muted-foreground">
                                                                        Define
                                                                        primero
                                                                        el rango
                                                                        de
                                                                        fechas
                                                                        para
                                                                        elegir
                                                                        los días
                                                                        de
                                                                        clase.
                                                                    </p>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <p className="text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                                                Días
                                                                                de
                                                                                clase
                                                                            </p>
                                                                            <div className="flex gap-1.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setAllDates(
                                                                                            index,
                                                                                            true,
                                                                                        )
                                                                                    }
                                                                                    className="rounded-md border border-border bg-white px-2 py-1 text-[0.62rem] font-bold text-upel-blue dark:bg-card"
                                                                                >
                                                                                    Todos
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setAllDates(
                                                                                            index,
                                                                                            false,
                                                                                        )
                                                                                    }
                                                                                    className="rounded-md border border-border bg-white px-2 py-1 text-[0.62rem] font-bold text-muted-foreground dark:bg-card"
                                                                                >
                                                                                    Limpiar
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {dateGroups.map(
                                                                            (
                                                                                group,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        group.month_key
                                                                                    }
                                                                                    className="flex flex-wrap items-center gap-1.5"
                                                                                >
                                                                                    <span className="w-16 text-[0.6rem] font-bold text-muted-foreground">
                                                                                        {
                                                                                            group.month
                                                                                        }
                                                                                    </span>
                                                                                    {group.dates.map(
                                                                                        (
                                                                                            date,
                                                                                        ) => {
                                                                                            const active =
                                                                                                choice.dates.includes(
                                                                                                    date.date,
                                                                                                );

                                                                                            return (
                                                                                                <button
                                                                                                    key={
                                                                                                        date.date
                                                                                                    }
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        toggleDate(
                                                                                                            index,
                                                                                                            date.date,
                                                                                                        )
                                                                                                    }
                                                                                                    aria-pressed={
                                                                                                        active
                                                                                                    }
                                                                                                    title={`${date.weekday} ${date.day} de ${date.month}`}
                                                                                                    className={`flex h-7 min-w-7 flex-col items-center justify-center rounded-md border px-1 text-[0.58rem] leading-none font-bold transition-colors ${
                                                                                                        active
                                                                                                            ? 'border-upel-blue bg-upel-blue text-white'
                                                                                                            : 'border-border bg-white text-upel-navy hover:border-upel-blue dark:bg-card dark:text-foreground'
                                                                                                    }`}
                                                                                                >
                                                                                                    <span>
                                                                                                        {
                                                                                                            date.day
                                                                                                        }
                                                                                                    </span>
                                                                                                    <span className="text-[0.5rem] font-semibold opacity-80">
                                                                                                        {
                                                                                                            date.weekday_short
                                                                                                        }
                                                                                                    </span>
                                                                                                </button>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <InputError
                                                                    message={
                                                                        datesError
                                                                    }
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>

                                    <p className="mt-4 text-[0.68rem] text-muted-foreground">
                                        {availableSubjects.length} materias
                                        disponibles en el período {periodLabel}.
                                        Deja vacías las filas que no necesites.
                                    </p>
                                    <InputError
                                        message={form.errors.subjects}
                                        className="mt-2 text-xs"
                                    />
                                </>
                            )}
                        </section>
                    </div>

                    <section
                        aria-label="Vista previa del horario"
                        className="min-w-0 space-y-3"
                    >
                        <div>
                            <p className="text-[0.68rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                Vista previa
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-upel-navy dark:text-foreground">
                                Formato oficial del horario
                            </h2>
                        </div>
                        <SchedulePreview schedule={preview} />
                    </section>
                </form>
            </div>
        </>
    );
}
