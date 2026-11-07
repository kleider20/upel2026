import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { generateSubjectCode } from '@/lib/subject-code';
import { cn } from '@/lib/utils';
import {
    index as subjectsIndex,
    store as subjectsStore,
    update as subjectsUpdate,
} from '@/routes/admin/subjects';

type CareerOption = {
    id: number;
    name: string;
    code: string;
};

type Option = {
    value: string;
    label: string;
};

type SubjectOption = {
    id: number;
    career_id: number;
    code: string;
    name: string;
    semester: number;
};

type SubjectRecord = {
    id: number;
    career_id: number;
    code: string;
    name: string;
    semester: number;
    modality: string;
    component: string | null;
    type: string | null;
    area: string | null;
    level: string | null;
    credits: number;
    theory_hours: number;
    practice_hours: number;
    prerequisites: string | null;
    is_active: boolean;
};

type SubjectFormData = {
    career_id: string;
    code: string;
    name: string;
    semester: string;
    modality: string;
    component: string;
    type: string;
    area: string;
    level: string;
    credits: string;
    theory_hours: string;
    practice_hours: string;
    prerequisites: string;
    is_active: boolean;
};

type Props = {
    subject: SubjectRecord | null;
    careers: CareerOption[];
    subjects: SubjectOption[];
    modalities: Option[];
    components: Option[];
    types: Option[];
    levels: Option[];
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/**
 * Formulario compartido para crear y editar materias.
 */
export default function AdminSubjectForm({
    subject,
    careers,
    subjects,
    modalities,
    components,
    types,
    levels,
}: Props) {
    const isEditing = subject !== null;

    const form = useForm<SubjectFormData>({
        career_id: subject ? String(subject.career_id) : '',
        code: subject?.code ?? '',
        name: subject?.name ?? '',
        semester: subject ? String(subject.semester) : '',
        modality: subject?.modality ?? '',
        component: subject?.component ?? 'CFPE',
        type: subject?.type ?? 'UNCO',
        area: subject?.area ?? '',
        level: subject?.level ?? 'FUND',
        credits: subject ? String(subject.credits) : '4',
        theory_hours: subject ? String(subject.theory_hours) : '4',
        practice_hours: subject ? String(subject.practice_hours) : '8',
        prerequisites: subject?.prerequisites ?? '',
        is_active: subject?.is_active ?? true,
    });

    const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

    const suggestedCode = generateSubjectCode({
        name: form.data.name,
        period: form.data.semester,
        modality: form.data.modality,
        type: form.data.type,
    });

    const canApplySuggestion =
        !isEditing && suggestedCode !== '' && suggestedCode !== form.data.code;

    const selectedCareerId = Number(form.data.career_id);
    const selectedSemester = Number(form.data.semester);
    const showPrerequisites = selectedSemester > 1;

    const prerequisiteOptions = showPrerequisites
        ? subjects
              .filter(
                  (option) =>
                      option.career_id === selectedCareerId &&
                      option.semester === selectedSemester - 1,
              )
              .sort((first, second) =>
                  first.name.localeCompare(second.name, 'es'),
              )
        : [];

    const isCurrentPrerequisiteListed = prerequisiteOptions.some(
        (option) => option.name === form.data.prerequisites,
    );

    /**
     * Aplica el código sugerido por el sistema.
     */
    const applySuggestion = () => {
        setIsCodeManuallyEdited(false);
        form.setData('code', suggestedCode);
    };

    /**
     * Actualiza nombre, periodo o modalidad y regenera el código en modo creación.
     *
     * Se usa el actualizador funcional para partir siempre del estado más
     * reciente: `setData` con un objeto reemplaza todo el formulario en Inertia
     * y, con una copia capturada en el render, el código podía generarse con un
     * nombre anterior.
     */
    const updateIdentification = (
        changes: Partial<
            Pick<SubjectFormData, 'name' | 'semester' | 'modality' | 'type'>
        >,
    ) => {
        form.setData((current) => {
            const next = { ...current, ...changes };
            const semester = Number(next.semester);
            const careerId = Number(next.career_id);
            const keepsPrerequisite =
                semester > 1 &&
                next.prerequisites !== '' &&
                subjects.some(
                    (option) =>
                        option.career_id === careerId &&
                        option.semester === semester - 1 &&
                        option.name === next.prerequisites,
                );

            if ('semester' in changes && !keepsPrerequisite) {
                next.prerequisites = '';
            }

            if (isEditing || isCodeManuallyEdited) {
                return next;
            }

            return {
                ...next,
                code: generateSubjectCode({
                    name: next.name,
                    period: next.semester,
                    modality: next.modality,
                    type: next.type,
                }),
            };
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (subject !== null) {
            form.put(subjectsUpdate.url(subject.id), {
                preserveScroll: true,
            });

            return;
        }

        form.post(subjectsStore.url());
    };

    return (
        <>
            <Head title={isEditing ? 'Editar materia' : 'Nueva materia'} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title={isEditing ? 'Editar materia' : 'Nueva materia'}
                    description={
                        isEditing
                            ? `Actualiza los datos de ${subject.name} (${subject.code}).`
                            : 'Registra una unidad curricular y asígnala a una carrera y periodo.'
                    }
                    actions={
                        <Link
                            href={subjectsIndex()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al listado
                        </Link>
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Identificación
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Carrera, código, nombre, periodo y modalidad de la
                            materia dentro del pensum.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="sm:col-span-2 lg:col-span-1">
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
                                        form.setData((current) => ({
                                            ...current,
                                            career_id: event.target.value,
                                            prerequisites: '',
                                        }))
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
                                            {career.name} ({career.code})
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.career_id}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="code" className={labelClass}>
                                    Código
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="code"
                                        type="text"
                                        value={form.data.code}
                                        maxLength={40}
                                        onChange={(event) => {
                                            setIsCodeManuallyEdited(true);
                                            form.setData(
                                                'code',
                                                event.target.value,
                                            );
                                        }}
                                        aria-invalid={Boolean(form.errors.code)}
                                        aria-describedby={
                                            isEditing ? undefined : 'code-help'
                                        }
                                        className={inputClass}
                                        placeholder="DSAS-PA1PRE"
                                    />
                                    {canApplySuggestion ? (
                                        <button
                                            type="button"
                                            onClick={applySuggestion}
                                            title={`Usar el código sugerido: ${suggestedCode}`}
                                            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[0.66rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Usar sugerencia
                                        </button>
                                    ) : null}
                                </div>
                                {!isEditing ? (
                                    <p
                                        id="code-help"
                                        className="mt-1 text-[0.66rem] text-muted-foreground"
                                    >
                                        {suggestedCode !== '' ? (
                                            <>
                                                Sugerencia del sistema:{' '}
                                                <span className="font-bold text-upel-navy dark:text-foreground">
                                                    {suggestedCode}
                                                </span>
                                                . Usa las iniciales del nombre,
                                                el periodo, la modalidad y el
                                                tipo; también puedes escribir tu
                                                propio código.
                                            </>
                                        ) : (
                                            'Escribe tu propio código o completa el nombre, el periodo y la modalidad para recibir una sugerencia.'
                                        )}
                                    </p>
                                ) : null}
                                <InputError
                                    message={form.errors.code}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="semester"
                                    className={labelClass}
                                >
                                    Periodo
                                </label>
                                <select
                                    id="semester"
                                    value={form.data.semester}
                                    onChange={(event) =>
                                        updateIdentification({
                                            semester: event.target.value,
                                        })
                                    }
                                    aria-invalid={Boolean(form.errors.semester)}
                                    className={inputClass}
                                >
                                    <option value="">
                                        Selecciona un periodo
                                    </option>
                                    {Array.from(
                                        { length: 12 },
                                        (_, index) => index + 1,
                                    ).map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.semester}
                                    className="mt-1 text-xs"
                                />
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
                                        updateIdentification({
                                            modality: event.target.value,
                                        })
                                    }
                                    aria-invalid={Boolean(form.errors.modality)}
                                    className={inputClass}
                                >
                                    <option value="">
                                        Selecciona una modalidad
                                    </option>
                                    {modalities.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.modality}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                                <label htmlFor="name" className={labelClass}>
                                    Nombre de la materia
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        updateIdentification({
                                            name: event.target.value,
                                        })
                                    }
                                    aria-invalid={Boolean(form.errors.name)}
                                    className={inputClass}
                                    placeholder="Fundamentos de la Educación Primaria"
                                />
                                <InputError
                                    message={form.errors.name}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                                <label className="flex items-center gap-2 rounded-xl border border-border bg-upel-cloud/40 px-3 py-2.5 text-xs font-semibold text-foreground dark:bg-muted/40">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(event) =>
                                            form.setData(
                                                'is_active',
                                                event.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-border text-upel-navy focus:ring-upel-blue"
                                    />
                                    Materia activa en el pensum
                                </label>
                                <InputError
                                    message={form.errors.is_active}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Carga académica
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Componente, tipo, créditos y horas de la unidad
                            curricular.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label
                                    htmlFor="component"
                                    className={labelClass}
                                >
                                    Componente
                                </label>
                                <select
                                    id="component"
                                    value={form.data.component}
                                    onChange={(event) =>
                                        form.setData(
                                            'component',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                >
                                    {components.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.value} · {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.component}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className={labelClass}>
                                    Tipo
                                </label>
                                <select
                                    id="type"
                                    value={form.data.type}
                                    onChange={(event) =>
                                        updateIdentification({
                                            type: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    {types.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.type}
                                    className="mt-1 text-xs"
                                />
                                {form.data.type === 'UNCLE' ? (
                                    <p className="mt-1 text-[0.66rem] text-muted-foreground">
                                        Las unidades de libre elección agregan
                                        el sufijo{' '}
                                        <span className="font-bold">UNCLE</span>{' '}
                                        al código y se resaltan en el listado.
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label htmlFor="level" className={labelClass}>
                                    Nivel
                                </label>
                                <select
                                    id="level"
                                    value={form.data.level}
                                    onChange={(event) =>
                                        form.setData(
                                            'level',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                >
                                    {levels.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.level}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="credits" className={labelClass}>
                                    Créditos
                                </label>
                                <input
                                    id="credits"
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={form.data.credits}
                                    onChange={(event) =>
                                        form.setData(
                                            'credits',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.credits)}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.credits}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="theory_hours"
                                    className={labelClass}
                                >
                                    Horas teóricas (HAD)
                                </label>
                                <input
                                    id="theory_hours"
                                    type="number"
                                    min={0}
                                    max={40}
                                    value={form.data.theory_hours}
                                    onChange={(event) =>
                                        form.setData(
                                            'theory_hours',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.theory_hours,
                                    )}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.theory_hours}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="practice_hours"
                                    className={labelClass}
                                >
                                    Horas prácticas (HLE)
                                </label>
                                <input
                                    id="practice_hours"
                                    type="number"
                                    min={0}
                                    max={40}
                                    value={form.data.practice_hours}
                                    onChange={(event) =>
                                        form.setData(
                                            'practice_hours',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.practice_hours,
                                    )}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.practice_hours}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="area" className={labelClass}>
                                    Área (opcional)
                                </label>
                                <input
                                    id="area"
                                    type="text"
                                    value={form.data.area}
                                    onChange={(event) =>
                                        form.setData('area', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.area)}
                                    className={inputClass}
                                    placeholder="CFPE"
                                />
                                <InputError
                                    message={form.errors.area}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            {showPrerequisites ? (
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="prerequisites"
                                        className={labelClass}
                                    >
                                        Prerrequisitos (opcional)
                                    </label>
                                    <select
                                        id="prerequisites"
                                        value={form.data.prerequisites}
                                        onChange={(event) =>
                                            form.setData(
                                                'prerequisites',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.prerequisites,
                                        )}
                                        className={inputClass}
                                    >
                                        <option value="">
                                            Sin prerrequisito
                                        </option>
                                        {form.data.prerequisites !== '' &&
                                        !isCurrentPrerequisiteListed ? (
                                            <option
                                                value={form.data.prerequisites}
                                            >
                                                {form.data.prerequisites}{' '}
                                                (actual)
                                            </option>
                                        ) : null}
                                        {prerequisiteOptions.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.name}
                                            >
                                                {option.code} · {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[0.66rem] text-muted-foreground">
                                        {selectedCareerId === 0
                                            ? 'Selecciona una carrera para ver sus materias del periodo anterior.'
                                            : prerequisiteOptions.length > 0
                                              ? `Materias del periodo ${selectedSemester - 1} de la carrera seleccionada.`
                                              : `La carrera no tiene materias registradas en el periodo ${selectedSemester - 1}.`}
                                    </p>
                                    <InputError
                                        message={form.errors.prerequisites}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                            href={subjectsIndex()}
                            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-xl bg-upel-navy px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800',
                                form.processing && 'opacity-70',
                            )}
                        >
                            {form.processing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {isEditing
                                ? 'Guardar cambios'
                                : 'Registrar materia'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
