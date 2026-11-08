import { useMemo } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    Loader2,
    RefreshCw,
    Save,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import {
    index as professorsIndex,
    store as professorsStore,
    update as professorsUpdate,
} from '@/routes/admin/professors';
import { create as subjectsCreate } from '@/routes/admin/subjects';

type SubjectOption = {
    id: number;
    career_id: number;
    career: string;
    career_code: string;
    semester: number;
    code: string;
    name: string;
    is_active: boolean;
};

type ProfessorRecord = {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    department: string | null;
    academic_title: string | null;
    subject_ids: number[];
};

type ProfessorFormData = {
    name: string;
    email: string;
    employee_code: string;
    department: string;
    academic_title: string;
    password: string;
    password_confirmation: string;
    subject_ids: number[];
};

type PeriodGroup = {
    semester: number;
    subjects: SubjectOption[];
};

type SubjectGroup = {
    career_id: number;
    career: string;
    career_code: string;
    subjects: SubjectOption[];
    periods: PeriodGroup[];
};

type Props = {
    professor: ProfessorRecord | null;
    subjects: SubjectOption[];
    can_manage_subjects: boolean;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

const ROMAN_PERIODS = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
];

const periodLabel = (semester: number): string =>
    ROMAN_PERIODS[semester - 1] ?? String(semester);

/**
 * Formulario de alta docente y asignación de materias.
 */
export default function AdminProfessorForm({
    professor,
    subjects,
    can_manage_subjects,
}: Props) {
    const isEditing = professor !== null;
    const form = useForm<ProfessorFormData>({
        name: professor?.name ?? '',
        email: professor?.email ?? '',
        employee_code: professor?.employee_code ?? '',
        department: professor?.department ?? '',
        academic_title: professor?.academic_title ?? '',
        password: '',
        password_confirmation: '',
        subject_ids: professor?.subject_ids ?? [],
    });

    const subjectGroups = useMemo(
        () =>
            Object.values(
                subjects.reduce<Record<string, SubjectGroup>>(
                    (groups, subject) => {
                        const key = String(subject.career_id);

                        if (!groups[key]) {
                            groups[key] = {
                                career_id: subject.career_id,
                                career: subject.career,
                                career_code: subject.career_code,
                                subjects: [],
                                periods: [],
                            };
                        }

                        groups[key].subjects.push(subject);

                        let period = groups[key].periods.find(
                            (item) => item.semester === subject.semester,
                        );

                        if (!period) {
                            period = {
                                semester: subject.semester,
                                subjects: [],
                            };
                            groups[key].periods.push(period);
                        }

                        period.subjects.push(subject);

                        return groups;
                    },
                    {},
                ),
            )
                .map((group) => ({
                    ...group,
                    periods: [...group.periods].sort(
                        (a, b) => a.semester - b.semester,
                    ),
                }))
                .sort((a, b) => a.career.localeCompare(b.career)),
        [subjects],
    );

    const selectedCount = (group: SubjectGroup | PeriodGroup): number =>
        group.subjects.filter((subject) =>
            form.data.subject_ids.includes(subject.id),
        ).length;

    const toggleSubject = (subjectId: number, checked: boolean) => {
        form.setData(
            'subject_ids',
            checked
                ? [...form.data.subject_ids, subjectId]
                : form.data.subject_ids.filter((id) => id !== subjectId),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (professor !== null) {
            form.put(professorsUpdate.url(professor.id), {
                preserveScroll: true,
            });

            return;
        }

        form.post(professorsStore.url());
    };

    return (
        <>
            <Head
                title={isEditing ? 'Editar profesor' : 'Registrar profesor'}
            />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title={isEditing ? 'Editar profesor' : 'Registrar profesor'}
                    description={
                        isEditing
                            ? 'Actualiza la cuenta, el perfil docente y las materias que podrá impartir.'
                            : 'Crea la cuenta docente y asigna desde el inicio las materias que podrá impartir.'
                    }
                    actions={
                        <Link
                            href={professorsIndex()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            Volver al listado
                        </Link>
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Cuenta y perfil docente
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            La cuenta recibirá el rol Profesor y podrá acceder
                            al portal académico.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className={labelClass}>
                                    Nombre completo
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.name)}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.name}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className={labelClass}>
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.email)}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.email}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="employee_code"
                                    className={labelClass}
                                >
                                    Código del profesor
                                </label>
                                <input
                                    id="employee_code"
                                    type="text"
                                    value={form.data.employee_code}
                                    onChange={(event) =>
                                        form.setData(
                                            'employee_code',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.employee_code,
                                    )}
                                    className={inputClass}
                                    placeholder="PROF-001"
                                />
                                <InputError
                                    message={form.errors.employee_code}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="department"
                                    className={labelClass}
                                >
                                    Departamento
                                </label>
                                <input
                                    id="department"
                                    type="text"
                                    value={form.data.department}
                                    onChange={(event) =>
                                        form.setData(
                                            'department',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.department,
                                    )}
                                    className={inputClass}
                                    placeholder="Educación"
                                />
                                <InputError
                                    message={form.errors.department}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="academic_title"
                                    className={labelClass}
                                >
                                    Título académico
                                </label>
                                <input
                                    id="academic_title"
                                    type="text"
                                    value={form.data.academic_title}
                                    onChange={(event) =>
                                        form.setData(
                                            'academic_title',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.academic_title,
                                    )}
                                    className={inputClass}
                                    placeholder="Magíster en Educación"
                                />
                                <InputError
                                    message={form.errors.academic_title}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            {!isEditing ? (
                                <>
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className={labelClass}
                                        >
                                            Contraseña temporal
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={form.data.password}
                                            onChange={(event) =>
                                                form.setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.password,
                                            )}
                                            className={inputClass}
                                        />
                                        <InputError
                                            message={form.errors.password}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="password_confirmation"
                                            className={labelClass}
                                        >
                                            Confirmar contraseña temporal
                                        </label>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            autoComplete="new-password"
                                            value={
                                                form.data.password_confirmation
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'password_confirmation',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .password_confirmation,
                                            )}
                                            className={inputClass}
                                        />
                                        <InputError
                                            message={
                                                form.errors
                                                    .password_confirmation
                                            }
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                                        El profesor deberá definir una
                                        contraseña personal al ingresar por
                                        primera vez. Comparte la contraseña
                                        temporal por un canal seguro.
                                    </p>
                                </>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    Materias que imparte
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Selecciona una o varias materias. La
                                    selección aparecerá como opción docente en
                                    la creación de horarios.
                                </p>
                            </div>
                            {can_manage_subjects ? (
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={subjectsCreate()}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                    >
                                        <BookOpen className="size-3.5" />
                                        Crear materia
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.reload({
                                                only: ['subjects'],
                                            })
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                    >
                                        <RefreshCw className="size-3.5" />
                                        Actualizar lista
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.68rem] font-bold text-upel-navy dark:bg-muted dark:text-foreground">
                                {form.data.subject_ids.length} seleccionada
                                {form.data.subject_ids.length === 1 ? '' : 's'}
                            </span>
                            <InputError
                                message={form.errors.subject_ids}
                                className="text-xs"
                            />
                            <InputError
                                message={form.errors['subject_ids.0']}
                                className="text-xs"
                            />
                        </div>

                        {subjectGroups.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
                                <p className="text-xs font-semibold text-foreground">
                                    No hay materias registradas todavía.
                                </p>
                                {can_manage_subjects ? (
                                    <Link
                                        href={subjectsCreate()}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex text-xs font-bold text-upel-blue hover:underline"
                                    >
                                        Crear la primera materia
                                    </Link>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {subjectGroups.map((group, groupIndex) => {
                                    const careerSelected = selectedCount(group);

                                    return (
                                        <details
                                            key={group.career_id}
                                            className="group/career rounded-xl border border-border/70 bg-upel-cloud/20 dark:bg-muted/20"
                                            open={groupIndex === 0}
                                        >
                                            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3 text-xs font-extrabold text-upel-navy dark:text-foreground">
                                                <ChevronDown className="size-4 shrink-0 text-upel-blue transition-transform group-open/career:rotate-180" />
                                                <span>
                                                    {group.career} (
                                                    {group.career_code})
                                                </span>
                                                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-bold text-muted-foreground dark:bg-card">
                                                    {careerSelected}{' '}
                                                    seleccionada
                                                    {careerSelected === 1
                                                        ? ''
                                                        : 's'}
                                                </span>
                                            </summary>
                                            <div className="space-y-2 border-t border-border/60 p-3">
                                                {group.periods.map((period) => {
                                                    const periodSelected =
                                                        selectedCount(period);

                                                    return (
                                                        <details
                                                            key={
                                                                period.semester
                                                            }
                                                            className="group/period rounded-lg border border-border/70 bg-white dark:bg-card"
                                                        >
                                                            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 text-[0.7rem] font-bold text-upel-navy dark:text-foreground">
                                                                <ChevronDown className="size-3.5 shrink-0 text-upel-blue transition-transform group-open/period:rotate-180" />
                                                                <span>
                                                                    Período{' '}
                                                                    {periodLabel(
                                                                        period.semester,
                                                                    )}
                                                                </span>
                                                                <span className="rounded-full bg-upel-cloud px-2 py-0.5 text-[0.6rem] font-bold text-muted-foreground dark:bg-muted">
                                                                    {
                                                                        period
                                                                            .subjects
                                                                            .length
                                                                    }{' '}
                                                                    materia
                                                                    {period
                                                                        .subjects
                                                                        .length ===
                                                                    1
                                                                        ? ''
                                                                        : 's'}
                                                                </span>
                                                                {periodSelected >
                                                                0 ? (
                                                                    <span className="rounded-full bg-upel-blue/10 px-2 py-0.5 text-[0.6rem] font-bold text-upel-blue">
                                                                        {
                                                                            periodSelected
                                                                        }{' '}
                                                                        seleccionada
                                                                        {periodSelected ===
                                                                        1
                                                                            ? ''
                                                                            : 's'}
                                                                    </span>
                                                                ) : null}
                                                            </summary>
                                                            <div className="grid gap-2 border-t border-border/60 p-3 sm:grid-cols-2 xl:grid-cols-3">
                                                                {period.subjects.map(
                                                                    (
                                                                        subject,
                                                                    ) => {
                                                                        const selected =
                                                                            form.data.subject_ids.includes(
                                                                                subject.id,
                                                                            );
                                                                        const inputId = `subject-${subject.id}`;

                                                                        return (
                                                                            <label
                                                                                key={
                                                                                    subject.id
                                                                                }
                                                                                htmlFor={
                                                                                    inputId
                                                                                }
                                                                                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 p-3 transition-colors hover:bg-upel-cloud/60 has-checked:border-upel-blue/50 has-checked:bg-upel-cloud dark:hover:bg-muted/50 dark:has-checked:bg-muted"
                                                                            >
                                                                                <input
                                                                                    id={
                                                                                        inputId
                                                                                    }
                                                                                    type="checkbox"
                                                                                    checked={
                                                                                        selected
                                                                                    }
                                                                                    onChange={(
                                                                                        event,
                                                                                    ) =>
                                                                                        toggleSubject(
                                                                                            subject.id,
                                                                                            event
                                                                                                .target
                                                                                                .checked,
                                                                                        )
                                                                                    }
                                                                                    className="mt-0.5 size-4 rounded border-border accent-upel-blue"
                                                                                />
                                                                                <span className="min-w-0">
                                                                                    <span className="block text-xs font-bold text-foreground">
                                                                                        {
                                                                                            subject.name
                                                                                        }
                                                                                    </span>
                                                                                    <span className="mt-1 block text-[0.65rem] text-muted-foreground">
                                                                                        {
                                                                                            subject.code
                                                                                        }
                                                                                        {!subject.is_active
                                                                                            ? ' · Inactiva'
                                                                                            : ''}
                                                                                    </span>
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </details>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                            href={professorsIndex()}
                            className="rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Save className="size-3.5" />
                            )}
                            {form.processing
                                ? 'Guardando…'
                                : isEditing
                                  ? 'Guardar cambios'
                                  : 'Registrar profesor'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
