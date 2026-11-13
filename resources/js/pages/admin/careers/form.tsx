import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { cn } from '@/lib/utils';
import {
    index as careersIndex,
    store as careersStore,
    update as careersUpdate,
} from '@/routes/admin/careers';

type Option = {
    value: string;
    label: string;
};

type OfferingRecord = {
    modality: string;
    schedule: string;
    shift: string;
    is_active: boolean;
};

type CareerRecord = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    degree: string;
    icon: string | null;
    image_url: string | null;
    duration_semesters: number;
    is_active: boolean;
    offerings: OfferingRecord[];
};

type CareerFormData = {
    name: string;
    code: string;
    description: string;
    degree: string;
    icon: string;
    image: File | null;
    remove_image: boolean;
    duration_semesters: string;
    is_active: boolean;
    offerings: OfferingRecord[];
};

type Props = {
    career: CareerRecord | null;
    modalities: Option[];
    schedules: Option[];
    shifts: Option[];
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

const emptyOffering: OfferingRecord = {
    modality: 'presencial',
    schedule: 'lunes_viernes',
    shift: 'diurno',
    is_active: true,
};

/**
 * Formulario compartido para crear y editar carreras con sus ofertas.
 */
export default function AdminCareerForm({
    career,
    modalities,
    schedules,
    shifts,
}: Props) {
    const isEditing = career !== null;

    const form = useForm<CareerFormData>({
        name: career?.name ?? '',
        code: career?.code ?? '',
        description: career?.description ?? '',
        degree: career?.degree ?? 'Licenciatura',
        icon: career?.icon ?? '',
        image: null,
        remove_image: false,
        duration_semesters: career ? String(career.duration_semesters) : '8',
        is_active: career?.is_active ?? true,
        offerings:
            career && career.offerings.length > 0
                ? career.offerings.map((offering) => ({ ...offering }))
                : [{ ...emptyOffering }],
    });

    const setOffering = (
        index: number,
        field: keyof OfferingRecord,
        value: string | boolean,
    ) => {
        const next = form.data.offerings.map((offering, position) =>
            position === index ? { ...offering, [field]: value } : offering,
        );

        form.setData('offerings', next);
    };

    const addOffering = () => {
        form.setData('offerings', [
            ...form.data.offerings,
            { ...emptyOffering },
        ]);
    };

    const removeOffering = (index: number) => {
        form.setData(
            'offerings',
            form.data.offerings.filter(
                (_offering, position) => position !== index,
            ),
        );
    };

    const offeringError = (index: number, field: keyof OfferingRecord) =>
        form.errors[`offerings.${index}.${field}`];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (career !== null) {
            form.put(careersUpdate.url(career.id), {
                preserveScroll: true,
            });

            return;
        }

        form.post(careersStore.url());
    };

    return (
        <>
            <Head title={isEditing ? 'Editar carrera' : 'Nueva carrera'} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title={isEditing ? 'Editar carrera' : 'Nueva carrera'}
                    description={
                        isEditing
                            ? `Actualiza los datos de ${career.name} (${career.code}) y sus ofertas académicas.`
                            : 'Registra una carrera y define las modalidades, horarios y turnos en los que se oferta.'
                    }
                    actions={
                        <Link
                            href={careersIndex()}
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
                            Datos de la carrera
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Identificación, duración y estado de la carrera en
                            el pensum institucional.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label htmlFor="name" className={labelClass}>
                                    Nombre de la carrera
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.name)}
                                    className={inputClass}
                                    placeholder="Educación Primaria"
                                />
                                <InputError
                                    message={form.errors.name}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="code" className={labelClass}>
                                    Código
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    value={form.data.code}
                                    onChange={(event) =>
                                        form.setData(
                                            'code',
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.code)}
                                    className={inputClass}
                                    placeholder="EDPRI"
                                />
                                <InputError
                                    message={form.errors.code}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="duration_semesters"
                                    className={labelClass}
                                >
                                    Duración (periodos)
                                </label>
                                <input
                                    id="duration_semesters"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={form.data.duration_semesters}
                                    onChange={(event) =>
                                        form.setData(
                                            'duration_semesters',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.duration_semesters,
                                    )}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.duration_semesters}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-upel-cloud/40 px-3 text-xs font-semibold text-foreground dark:bg-muted/40">
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
                                    Carrera activa en la oferta académica
                                </label>
                                <InputError
                                    message={form.errors.is_active}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                                <label
                                    htmlFor="description"
                                    className={labelClass}
                                >
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    rows={3}
                                    aria-invalid={Boolean(
                                        form.errors.description,
                                    )}
                                    className="w-full rounded-xl border border-border bg-upel-cloud/50 px-3 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    placeholder="Formación para acompañar el desarrollo integral de niños y niñas en la etapa primaria, con herramientas didácticas innovadoras."
                                />
                                <InputError
                                    message={form.errors.description}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="degree" className={labelClass}>
                                    Título que otorga
                                </label>
                                <input
                                    id="degree"
                                    type="text"
                                    value={form.data.degree}
                                    onChange={(event) =>
                                        form.setData(
                                            'degree',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.degree)}
                                    className={inputClass}
                                    placeholder="Licenciatura"
                                />
                                <InputError
                                    message={form.errors.degree}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="icon" className={labelClass}>
                                    Icono (emoji)
                                </label>
                                <input
                                    id="icon"
                                    type="text"
                                    value={form.data.icon}
                                    onChange={(event) =>
                                        form.setData('icon', event.target.value)
                                    }
                                    maxLength={16}
                                    aria-invalid={Boolean(form.errors.icon)}
                                    className={inputClass}
                                    placeholder="📚"
                                />
                                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                    Se muestra en la tarjeta de la landing.
                                </p>
                                <InputError
                                    message={form.errors.icon}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                                <label htmlFor="image" className={labelClass}>
                                    Imagen de la carrera
                                </label>
                                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    {career?.image_url &&
                                    !form.data.remove_image &&
                                    !form.data.image ? (
                                        <img
                                            src={career.image_url}
                                            alt={`Imagen actual de ${career.name}`}
                                            className="h-24 w-40 rounded-xl object-cover ring-1 ring-border"
                                        />
                                    ) : null}

                                    {form.data.image ? (
                                        <span className="inline-flex max-w-full items-center rounded-xl border border-border bg-upel-cloud/40 px-3 py-2 text-[0.68rem] font-semibold text-foreground">
                                            {form.data.image.name}
                                        </span>
                                    ) : null}

                                    <div className="flex-1">
                                        <input
                                            id="image"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(event) => {
                                                form.setData(
                                                    'image',
                                                    event.target.files?.[0] ??
                                                        null,
                                                );
                                                form.setData(
                                                    'remove_image',
                                                    false,
                                                );
                                            }}
                                            className="block w-full cursor-pointer rounded-xl border border-border bg-upel-cloud/50 px-3 py-2 text-xs font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-upel-navy file:px-3 file:py-1.5 file:text-[0.68rem] file:font-bold file:text-white dark:bg-muted/40"
                                        />
                                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                            JPG, PNG o WEBP. Máximo 2 MB.
                                        </p>
                                    </div>

                                    {career?.image_url &&
                                    !form.data.remove_image ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setData(
                                                    'remove_image',
                                                    true,
                                                );
                                                form.setData('image', null);
                                            }}
                                            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-[0.68rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                        >
                                            Quitar imagen
                                        </button>
                                    ) : null}

                                    {form.data.remove_image ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'remove_image',
                                                    false,
                                                )
                                            }
                                            className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-[0.68rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                        >
                                            Deshacer
                                        </button>
                                    ) : null}
                                </div>
                                <InputError
                                    message={form.errors.image}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    Ofertas académicas
                                </h2>
                                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                                    Una misma carrera puede ofertarse en varias
                                    modalidades. Cada combinación de modalidad,
                                    horario y turno debe ser única.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addOffering}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[0.68rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                            >
                                <Plus className="size-3.5" aria-hidden="true" />
                                Agregar oferta
                            </button>
                        </div>

                        <InputError
                            message={form.errors.offerings}
                            className="mt-3 text-xs"
                        />

                        <div className="mt-4 space-y-3">
                            {form.data.offerings.map((offering, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-border bg-upel-cloud/30 p-4 dark:bg-muted/20"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-[0.68rem] font-bold tracking-wide text-muted-foreground uppercase">
                                            Oferta {index + 1}
                                        </p>
                                        {form.data.offerings.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeOffering(index)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[0.62rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                Quitar
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <label
                                                htmlFor={`offering-modality-${index}`}
                                                className={labelClass}
                                            >
                                                Modalidad
                                            </label>
                                            <select
                                                id={`offering-modality-${index}`}
                                                value={offering.modality}
                                                onChange={(event) =>
                                                    setOffering(
                                                        index,
                                                        'modality',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    offeringError(
                                                        index,
                                                        'modality',
                                                    ),
                                                )}
                                                className={inputClass}
                                            >
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
                                                message={offeringError(
                                                    index,
                                                    'modality',
                                                )}
                                                className="mt-1 text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`offering-schedule-${index}`}
                                                className={labelClass}
                                            >
                                                Horario
                                            </label>
                                            <select
                                                id={`offering-schedule-${index}`}
                                                value={offering.schedule}
                                                onChange={(event) =>
                                                    setOffering(
                                                        index,
                                                        'schedule',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    offeringError(
                                                        index,
                                                        'schedule',
                                                    ),
                                                )}
                                                className={inputClass}
                                            >
                                                {schedules.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={offeringError(
                                                    index,
                                                    'schedule',
                                                )}
                                                className="mt-1 text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`offering-shift-${index}`}
                                                className={labelClass}
                                            >
                                                Turno
                                            </label>
                                            <select
                                                id={`offering-shift-${index}`}
                                                value={offering.shift}
                                                onChange={(event) =>
                                                    setOffering(
                                                        index,
                                                        'shift',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    offeringError(
                                                        index,
                                                        'shift',
                                                    ),
                                                )}
                                                className={inputClass}
                                            >
                                                {shifts.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={offeringError(
                                                    index,
                                                    'shift',
                                                )}
                                                className="mt-1 text-xs"
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground dark:bg-card">
                                                <input
                                                    type="checkbox"
                                                    checked={offering.is_active}
                                                    onChange={(event) =>
                                                        setOffering(
                                                            index,
                                                            'is_active',
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="size-4 rounded border-border text-upel-navy focus:ring-upel-blue"
                                                />
                                                Oferta activa
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                            href={careersIndex()}
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
                                : 'Registrar carrera'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
