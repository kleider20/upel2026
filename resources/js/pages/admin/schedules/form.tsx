import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    ChevronDown,
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
    selectedScheduleWeeks,
    timeSlotLabels,
} from '@/lib/schedule-calendar';
import {
    index as schedulesIndex,
    store as schedulesStore,
    update as schedulesUpdate,
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
    offerings: OfferingOption[];
    schedules: ScheduleTypeOption[];
    modalities: ScheduleTypeOption[];
};

type OfferingOption = {
    id: number;
    modality: string;
    modality_label: string;
    schedule: string;
    schedule_label: string;
    shift: string;
    shift_label: string;
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
    dates: string[];
    date_times: Record<string, { starts_at: string; ends_at: string }>;
};

type ScheduleFormData = {
    career_id: string;
    period: string;
    cohort: string;
    study_schedule: string;
    modality: string;
    starts_on: string;
    ends_on: string;
    subjects: SubjectChoice[];
};

type ExistingSchedule = Omit<ScheduleFormData, 'subjects'> & {
    id: number;
    subjects: (Omit<SubjectChoice, 'position'> & { position: number })[];
};

type Props = {
    careers: CareerOption[];
    template: ScheduleTemplate;
    subjects: SubjectOption[];
    schedule: ExistingSchedule | null;
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
    subjects: subjectCatalog,
    schedule,
}: Props) {
    const isEditing = schedule !== null;
    const [openSubjectIndex, setOpenSubjectIndex] = useState<number | null>(
        () =>
            schedule?.subjects[0] !== undefined
                ? schedule.subjects[0].position - 1
                : 0,
    );
    const form = useForm<ScheduleFormData>({
        career_id: schedule?.career_id ?? '',
        period: schedule?.period ?? '1',
        cohort: schedule?.cohort ?? '',
        study_schedule: schedule?.study_schedule ?? '',
        modality: schedule?.modality ?? '',
        starts_on: schedule?.starts_on ?? '',
        ends_on: schedule?.ends_on ?? '',
        subjects: template.subjects.map((_subject, index) => {
            const existingSubject = schedule?.subjects.find(
                (choice) => choice.position === index + 1,
            );

            return {
                ...(existingSubject ?? {
                    subject_id: '',
                    professor_id: '',
                    teacher_name: '',
                    dates: [],
                    date_times: {},
                }),
                position: String(index + 1),
            };
        }),
    });

    const selectedCareer = careers.find(
        (career) => String(career.id) === form.data.career_id,
    );

    const careerSchedules = selectedCareer?.schedules ?? [];

    // Filtrar modalidades por el tipo de horario seleccionado
    const careerModalities = useMemo(() => {
        if (!selectedCareer) return [];
        const studySchedule = form.data.study_schedule;
        if (!studySchedule) return [];

        // Obtener las ofertas que coinciden con el tipo de horario seleccionado
        const offeringsForSchedule = selectedCareer.offerings.filter(
            (offering) => offering.schedule === studySchedule,
        );

        // Extraer las modalidades únicas de esas ofertas
        const modalitiesMap = new Map<string, ScheduleTypeOption>();
        offeringsForSchedule.forEach((offering) => {
            const modalityOption: ScheduleTypeOption = {
                value: offering.modality,
                label: offering.modality_label,
            };
            modalitiesMap.set(offering.modality, modalityOption);
        });

        return Array.from(modalitiesMap.values());
    }, [selectedCareer, form.data.study_schedule]);

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

    const selectedDates = useMemo(
        () =>
            Array.from(
                new Set(
                    form.data.subjects.flatMap((choice) =>
                        choice.subject_id === '' ? [] : choice.dates,
                    ),
                ),
            ),
        [form.data.subjects],
    );

    const previewWeeks = useMemo(
        () => selectedScheduleWeeks(weeks, selectedDates),
        [selectedDates, weeks],
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
        careerSchedules.find(
            (option) => option.value === form.data.study_schedule,
        )?.label ?? '—';

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
                const chosenDates = new Set(choice.dates);

                return {
                    code: subject.code,
                    name: subject.name,
                    teacher:
                        chosenProfessor?.name ??
                        (choice.teacher_name.trim() !== ''
                            ? choice.teacher_name
                            : (subject.professors[0]?.name ??
                              (isEditing
                                  ? slot.teacher
                                  : 'Sin profesor asignado'))),
                    hours: previewWeeks.map((week) => {
                        const matches = (week.dates ?? []).filter((date) =>
                            chosenDates.has(date),
                        );

                        if (matches.length === 0) {
                            return null;
                        }

                        if (subject.modality === 'online') {
                            return 'Virtual';
                        }

                        const timeGroups = new Map<
                            string,
                            {
                                starts_at: string;
                                ends_at: string;
                                dates: string[];
                            }
                        >();

                        matches.forEach((date) => {
                            const dateTime = choice.date_times[date];

                            if (dateTime === undefined) {
                                return;
                            }

                            const key = `${dateTime.starts_at}-${dateTime.ends_at}`;
                            const group = timeGroups.get(key) ?? {
                                starts_at: dateTime.starts_at,
                                ends_at: dateTime.ends_at,
                                dates: [],
                            };
                            group.dates.push(date);
                            timeGroups.set(key, group);
                        });

                        return Array.from(timeGroups.values())
                            .map((group) => {
                                const timeLabel = formatTimeRange(
                                    group.starts_at,
                                    group.ends_at,
                                );

                                if (timeLabel === '') {
                                    return '';
                                }

                                return form.data.study_schedule === 'sabatino'
                                    ? timeLabel
                                    : `${daysLabel(group.dates)} · ${timeLabel}`;
                            })
                            .filter((label) => label !== '')
                            .join(' / ');
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
        isEditing,
        subjectById,
        template,
        previewWeeks,
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
                .filter((choice) => {
                    if (choice.subject_id === '' || choice.dates.length === 0) {
                        return false;
                    }

                    return (
                        subjectById.get(Number(choice.subject_id))?.modality !==
                        'online'
                    );
                })
                .flatMap((choice) =>
                    choice.dates.map((date) => choice.date_times[date]),
                )
                .filter(
                    (
                        dateTime,
                    ): dateTime is { starts_at: string; ends_at: string } =>
                        dateTime !== undefined,
                ),
        );

        return {
            title: `HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO ${cohort}`,
            career: selectedCareer?.name ?? 'Selecciona una carrera',
            cohort,
            period: periodLabel,
            schedule_label: scheduleTypeLabel,
            weeks: previewWeeks,
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
        subjectById,
        template,
        previewWeeks,
    ]);

    const clearSubjects = (choices: SubjectChoice[]): SubjectChoice[] =>
        choices.map((choice) => ({
            ...choice,
            subject_id: '',
            professor_id: '',
            teacher_name: '',
            dates: [],
            date_times: {},
        }));

    const resetDates = (choices: SubjectChoice[]): SubjectChoice[] =>
        choices.map((choice) => ({
            ...choice,
            dates: [],
            date_times: {},
        }));

    const selectCareer = (value: string) => {
        const career = careers.find((option) => String(option.id) === value);

        form.setData((current) => {
            const careerSchedules = career?.schedules ?? [];

            // Obtener las ofertas para esta carrera
            const careerOfferings = career?.offerings ?? [];

            // Filtrar ofertas por el tipo de horario actual si existe
            const offeringsForCurrentSchedule = current.study_schedule
                ? careerOfferings.filter(
                      (o) => o.schedule === current.study_schedule,
                  )
                : careerOfferings;

            // Obtener modalidades disponibles para el tipo de horario actual
            const availableModalities = offeringsForCurrentSchedule
                .map((o) => o.modality)
                .filter((m, index, self) => self.indexOf(m) === index);

            const nextSchedule = careerSchedules.some(
                (option) => option.value === current.study_schedule,
            )
                ? current.study_schedule
                : (careerSchedules[0]?.value ?? '');

            // Si el tipo de horario ha cambiado, reiniciar la modalidad
            let nextModality = current.modality;

            // Si hay un tipo de horario seleccionado y modalidades disponibles
            if (nextSchedule && availableModalities.length > 0) {
                // Si la modalidad actual está disponible para este tipo de horario, mantenerla
                if (availableModalities.includes(current.modality)) {
                    nextModality = current.modality;
                } else {
                    // De lo contrario, seleccionar la primera modalidad disponible
                    nextModality = availableModalities[0] ?? '';
                }
            } else {
                nextModality = '';
            }

            return {
                ...current,
                career_id: value,
                period: career
                    ? String(career.periods[0]?.value ?? 1)
                    : current.period,
                study_schedule: nextSchedule,
                modality: nextModality,
                subjects: clearSubjects(current.subjects),
            };
        });
    };

    const selectPeriod = (value: string) => {
        form.setData((current) => ({
            ...current,
            period: value,
            subjects: clearSubjects(current.subjects),
        }));
    };

    const selectStudySchedule = (value: string) => {
        form.setData((current) => {
            // Si hay una carrera seleccionada, obtener las modalidades disponibles para este tipo de horario
            let nextModality = current.modality;

            if (selectedCareer) {
                const careerOfferings = selectedCareer.offerings;
                const offeringsForSchedule = careerOfferings.filter(
                    (o) => o.schedule === value,
                );

                const availableModalities = offeringsForSchedule.map(
                    (o) => o.modality,
                );

                // Si la modalidad actual no está disponible para este tipo de horario, seleccionar la primera
                if (
                    availableModalities.length > 0 &&
                    !availableModalities.includes(current.modality)
                ) {
                    nextModality = availableModalities[0];
                }
                // Si no hay modalidades disponibles, limpiar
                else if (availableModalities.length === 0) {
                    nextModality = '';
                }
            } else {
                nextModality = '';
            }

            return {
                ...current,
                study_schedule: value,
                modality: nextModality,
                subjects: resetDates(current.subjects),
            };
        });
    };

    const selectModality = (value: string) => {
        form.setData((current) => ({
            ...current,
            modality: value,
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
                          teacher_name: '',
                          dates: subjectId === '' ? [] : item.dates,
                          date_times: subjectId === '' ? {} : item.date_times,
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

    const toggleDate = (index: number, date: string) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) => {
                if (position !== index) {
                    return choice;
                }

                const selected = choice.dates.includes(date);
                const newDates = selected
                    ? choice.dates.filter((item) => item !== date)
                    : [...choice.dates, date].sort();

                const newDateTimes = { ...choice.date_times };
                if (!selected) {
                    if (!newDateTimes[date]) {
                        newDateTimes[date] = {
                            starts_at: DEFAULT_STARTS_AT,
                            ends_at: DEFAULT_ENDS_AT,
                        };
                    }
                } else {
                    delete newDateTimes[date];
                }

                return {
                    ...choice,
                    dates: newDates,
                    date_times: newDateTimes,
                };
            }),
        );
    };

    const setAllDates = (index: number, selected: boolean) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) => {
                if (position !== index) {
                    return choice;
                }

                const newDates = selected
                    ? classDates.map((date) => date.date)
                    : [];

                const newDateTimes: Record<
                    string,
                    { starts_at: string; ends_at: string }
                > = {};
                if (selected) {
                    classDates.forEach((dateObj) => {
                        const date = dateObj.date;
                        if (choice.date_times?.[date]) {
                            newDateTimes[date] = choice.date_times[date];
                        } else {
                            newDateTimes[date] = {
                                starts_at: DEFAULT_STARTS_AT,
                                ends_at: DEFAULT_ENDS_AT,
                            };
                        }
                    });
                }

                return {
                    ...choice,
                    dates: newDates,
                    date_times: newDateTimes,
                };
            }),
        );
    };

    const setDateTime = (
        index: number,
        date: string,
        field: 'starts_at' | 'ends_at',
        value: string,
    ) => {
        form.setData(
            'subjects',
            form.data.subjects.map((choice, position) => {
                if (position !== index) {
                    return choice;
                }

                const newDateTimes = { ...choice.date_times };
                if (!newDateTimes[date]) {
                    newDateTimes[date] = {
                        starts_at: DEFAULT_STARTS_AT,
                        ends_at: DEFAULT_ENDS_AT,
                    };
                }
                newDateTimes[date] = {
                    ...newDateTimes[date],
                    [field]: value,
                };

                return {
                    ...choice,
                    date_times: newDateTimes,
                };
            }),
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
                choice.dates.every((date) => {
                    const dateTime = choice.date_times?.[date];
                    return (
                        dateTime !== undefined &&
                        dateTime.starts_at !== '' &&
                        dateTime.ends_at !== '' &&
                        dateTime.ends_at > dateTime.starts_at
                    );
                }),
        );

    const canSubmit =
        form.data.career_id !== '' &&
        form.data.study_schedule !== '' &&
        form.data.modality !== '' &&
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

        if (schedule !== null) {
            form.put(schedulesUpdate.url(schedule.id));

            return;
        }

        form.post(schedulesStore.url());
    };

    return (
        <>
            <Head title={isEditing ? 'Editar horario' : 'Nuevo horario'} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title={isEditing ? 'Editar horario' : 'Nuevo horario'}
                    description={
                        isEditing
                            ? 'Actualiza los datos, materias, fechas y horas del horario publicado.'
                            : 'Define el rango de clases y publica el horario oficial de una carrera, período y cohorte.'
                    }
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
                                                disabled={
                                                    selectedCareer ===
                                                        undefined ||
                                                    careerSchedules.length === 0
                                                }
                                                className={inputClass}
                                            >
                                                {selectedCareer ===
                                                undefined ? (
                                                    <option value="">
                                                        Selecciona una carrera
                                                    </option>
                                                ) : careerSchedules.length ===
                                                  0 ? (
                                                    <option value="">
                                                        Sin ofertas activas
                                                    </option>
                                                ) : (
                                                    careerSchedules.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ),
                                                    )
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    form.errors.study_schedule
                                                }
                                                className="mt-1 text-xs"
                                            />
                                            {selectedCareer !== undefined &&
                                            careerSchedules.length === 0 ? (
                                                <p className="mt-1 text-[0.64rem] font-semibold text-amber-700 dark:text-amber-400">
                                                    Esta carrera no tiene
                                                    ofertas activas. Actívalas
                                                    en el módulo de carreras
                                                    para publicar un horario.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="modality"
                                                className={labelClass}
                                            >
                                                Modalidad
                                            </label>
                                            <select
                                                id="modality"
                                                value={form.data.modality}
                                                onChange={(event) =>
                                                    selectModality(
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.modality,
                                                )}
                                                disabled={
                                                    selectedCareer ===
                                                        undefined ||
                                                    form.data.study_schedule ===
                                                        ''
                                                }
                                                className={inputClass}
                                            >
                                                {selectedCareer === undefined ||
                                                form.data.study_schedule ===
                                                    '' ? (
                                                    <option value="">
                                                        {selectedCareer ===
                                                        undefined
                                                            ? 'Selecciona una carrera'
                                                            : 'Selecciona un tipo de horario'}
                                                    </option>
                                                ) : (
                                                    careerModalities.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ),
                                                    )
                                                )}
                                            </select>
                                            <InputError
                                                message={form.errors.modality}
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
                                    {isEditing
                                        ? 'Guardar cambios'
                                        : 'Publicar horario'}
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
                                                const professors =
                                                    selected?.professors ?? [];
                                                const hasSavedTeacher =
                                                    isEditing &&
                                                    choice.professor_id ===
                                                        '' &&
                                                    choice.teacher_name !== '';
                                                const teacherValue =
                                                    choice.professor_id !== ''
                                                        ? `professor:${choice.professor_id}`
                                                        : choice.teacher_name !==
                                                            ''
                                                          ? `teacher:${choice.teacher_name}`
                                                          : '';
                                                const isOpen =
                                                    openSubjectIndex === index;
                                                const selectedTeacher =
                                                    choice.professor_id !== ''
                                                        ? (professors.find(
                                                              (professor) =>
                                                                  String(
                                                                      professor.id,
                                                                  ) ===
                                                                  choice.professor_id,
                                                          )?.name ?? '')
                                                        : choice.teacher_name;
                                                const hasRowErrors =
                                                    rowError !== undefined ||
                                                    professorError !==
                                                        undefined ||
                                                    datesError !== undefined ||
                                                    Object.keys(
                                                        form.errors,
                                                    ).some((key) =>
                                                        key.startsWith(
                                                            `subjects.${index}.date_times`,
                                                        ),
                                                    );
                                                return (
                                                    <div
                                                        key={choice.position}
                                                        className={`overflow-hidden rounded-xl border bg-upel-cloud/20 dark:bg-muted/20 ${
                                                            isOpen
                                                                ? 'border-upel-blue/50'
                                                                : 'border-border/70'
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-expanded={
                                                                isOpen
                                                            }
                                                            aria-controls={`subject-panel-${choice.position}`}
                                                            onClick={() =>
                                                                setOpenSubjectIndex(
                                                                    isOpen
                                                                        ? null
                                                                        : index,
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-upel-cloud/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-upel-blue dark:hover:bg-muted/50"
                                                        >
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-upel-cloud text-[0.65rem] font-extrabold text-upel-navy dark:bg-muted dark:text-foreground">
                                                                {index + 1}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                                    Materia{' '}
                                                                    {index + 1}
                                                                </span>
                                                                <span className="block truncate text-xs font-bold text-upel-navy dark:text-foreground">
                                                                    {selected?.name ??
                                                                        'Selecciona una materia'}
                                                                </span>
                                                                <span className="block truncate text-[0.62rem] text-muted-foreground">
                                                                    {hasRowErrors
                                                                        ? 'Revisa los datos de esta materia'
                                                                        : selected ===
                                                                            undefined
                                                                          ? 'Pendiente de configurar'
                                                                          : [
                                                                                selectedTeacher,
                                                                                `${choice.dates.length} fechas`,
                                                                            ]
                                                                                .filter(
                                                                                    Boolean,
                                                                                )
                                                                                .join(
                                                                                    ' · ',
                                                                                )}
                                                                </span>
                                                            </span>
                                                            <ChevronDown
                                                                aria-hidden="true"
                                                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                                                    isOpen
                                                                        ? 'rotate-180'
                                                                        : ''
                                                                }`}
                                                            />
                                                        </button>
                                                        {isOpen ? (
                                                            <div
                                                                id={`subject-panel-${choice.position}`}
                                                                className="space-y-3 border-t border-border/70 p-3"
                                                            >
                                                                <div className="grid gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_11rem_6.5rem] sm:items-start">
                                                                    <span className="mt-2.5 hidden h-6 w-6 items-center justify-center rounded-lg bg-upel-cloud text-[0.65rem] font-extrabold text-upel-navy sm:flex dark:bg-muted dark:text-foreground">
                                                                        {index +
                                                                            1}
                                                                    </span>
                                                                    <div>
                                                                        <label
                                                                            htmlFor={`subject-${index}`}
                                                                            className="sr-only"
                                                                        >
                                                                            Materia
                                                                            de
                                                                            la
                                                                            fila{' '}
                                                                            {index +
                                                                                1}
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
                                                                                online
                                                                                ·
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
                                                                            Docente
                                                                            de
                                                                            la
                                                                            materia{' '}
                                                                            {index +
                                                                                1}
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
                                                                            {professors.length ===
                                                                                0 &&
                                                                            !hasSavedTeacher ? (
                                                                                <option value="">
                                                                                    No
                                                                                    hay
                                                                                    profesores
                                                                                    asignados
                                                                                </option>
                                                                            ) : null}
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
                                                                            {hasSavedTeacher ? (
                                                                                <optgroup label="Docente guardado (sin perfil)">
                                                                                    <option
                                                                                        value={`teacher:${choice.teacher_name}`}
                                                                                    >
                                                                                        {
                                                                                            choice.teacher_name
                                                                                        }
                                                                                    </option>
                                                                                </optgroup>
                                                                            ) : null}
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
                                                                        <span className="inline-flex h-8 items-center rounded-xl bg-upel-cloud px-3 text-[0.68rem] font-bold text-upel-blue dark:bg-muted">
                                                                            {
                                                                                choice
                                                                                    .dates
                                                                                    .length
                                                                            }{' '}
                                                                            fechas
                                                                            marcadas
                                                                        </span>

                                                                        {classDates.length ===
                                                                        0 ? (
                                                                            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[0.68rem] font-semibold text-muted-foreground">
                                                                                Define
                                                                                primero
                                                                                el
                                                                                rango
                                                                                de
                                                                                fechas
                                                                                para
                                                                                elegir
                                                                                los
                                                                                días
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

                                                                        {choice
                                                                            .dates
                                                                            .length >
                                                                            0 && (
                                                                            <div className="space-y-2 border-t border-border/70 pt-3">
                                                                                <p className="text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                                                    Horario
                                                                                    por
                                                                                    fecha
                                                                                </p>
                                                                                {choice.dates.map(
                                                                                    (
                                                                                        date,
                                                                                    ) => {
                                                                                        const classDate =
                                                                                            classDates.find(
                                                                                                (
                                                                                                    item,
                                                                                                ) =>
                                                                                                    item.date ===
                                                                                                    date,
                                                                                            );
                                                                                        const dateTime =
                                                                                            choice
                                                                                                .date_times[
                                                                                                date
                                                                                            ];
                                                                                        const startsAtError =
                                                                                            form
                                                                                                .errors[
                                                                                                `subjects.${index}.date_times.${date}.starts_at`
                                                                                            ];
                                                                                        const endsAtError =
                                                                                            form
                                                                                                .errors[
                                                                                                `subjects.${index}.date_times.${date}.ends_at`
                                                                                            ];

                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    date
                                                                                                }
                                                                                                className="grid gap-2 rounded-lg border border-border/70 bg-white/70 p-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] dark:bg-card/70"
                                                                                            >
                                                                                                <p className="flex items-center text-[0.68rem] font-bold text-upel-navy dark:text-foreground">
                                                                                                    {
                                                                                                        classDate?.weekday
                                                                                                    }{' '}
                                                                                                    {
                                                                                                        classDate?.day
                                                                                                    }{' '}
                                                                                                    de{' '}
                                                                                                    {
                                                                                                        classDate?.month
                                                                                                    }
                                                                                                </p>
                                                                                                <div>
                                                                                                    <label
                                                                                                        htmlFor={`starts-at-${index}-${date}`}
                                                                                                        className={
                                                                                                            labelClass
                                                                                                        }
                                                                                                    >
                                                                                                        Inicio
                                                                                                    </label>
                                                                                                    <input
                                                                                                        id={`starts-at-${index}-${date}`}
                                                                                                        type="time"
                                                                                                        value={
                                                                                                            dateTime?.starts_at ??
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            event,
                                                                                                        ) =>
                                                                                                            setDateTime(
                                                                                                                index,
                                                                                                                date,
                                                                                                                'starts_at',
                                                                                                                event
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            )
                                                                                                        }
                                                                                                        aria-invalid={Boolean(
                                                                                                            startsAtError,
                                                                                                        )}
                                                                                                        className={
                                                                                                            inputClass
                                                                                                        }
                                                                                                    />
                                                                                                    <InputError
                                                                                                        message={
                                                                                                            startsAtError
                                                                                                        }
                                                                                                        className="mt-1 text-xs"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <label
                                                                                                        htmlFor={`ends-at-${index}-${date}`}
                                                                                                        className={
                                                                                                            labelClass
                                                                                                        }
                                                                                                    >
                                                                                                        Fin
                                                                                                    </label>
                                                                                                    <input
                                                                                                        id={`ends-at-${index}-${date}`}
                                                                                                        type="time"
                                                                                                        value={
                                                                                                            dateTime?.ends_at ??
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            event,
                                                                                                        ) =>
                                                                                                            setDateTime(
                                                                                                                index,
                                                                                                                date,
                                                                                                                'ends_at',
                                                                                                                event
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            )
                                                                                                        }
                                                                                                        aria-invalid={Boolean(
                                                                                                            endsAtError,
                                                                                                        )}
                                                                                                        className={
                                                                                                            inputClass
                                                                                                        }
                                                                                                    />
                                                                                                    <InputError
                                                                                                        message={
                                                                                                            endsAtError
                                                                                                        }
                                                                                                        className="mt-1 text-xs"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                                <InputError
                                                                                    message={
                                                                                        form
                                                                                            .errors[
                                                                                            `subjects.${index}.date_times`
                                                                                        ]
                                                                                    }
                                                                                    className="text-xs"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : null}
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
