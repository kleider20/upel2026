import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';

type AdmissionFormData = {
    first_name: string;
    last_name: string;
    nationality: string;
    id_number: string;
    birth_date: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    career_id: number;
    modality: string;
    schedule: string;
    shift: string;
    high_school: string;
    high_school_year: number;
    high_school_average: number;
};

type Admission = AdmissionFormData & {
    code: string;
    has_documents: boolean;
};

type Option = {
    value: string;
    label: string;
};

type Career = {
    id: number;
    name: string;
    offerings: { modality: string; schedule: string; shift: string }[];
};

type Props = {
    admission: Admission;
    careers: Career[];
    modalities: Option[];
    schedules: Option[];
    shifts: Option[];
    genders: Option[];
    update_url: string;
    show_url: string;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';
const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

function TextField({
    id,
    label,
    value,
    type = 'text',
    error,
    disabled = false,
    onChange,
}: {
    id: string;
    label: string;
    value: string | number;
    type?: string;
    error?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <InputError message={error} className="mt-1" />
        </div>
    );
}

function SelectField({
    id,
    label,
    value,
    options,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string | number;
    options: Option[];
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={inputClass}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

export default function AdminAdmissionsEdit({
    admission,
    careers,
    modalities,
    schedules,
    shifts,
    genders,
    update_url,
    show_url,
}: Props) {
    const form = useForm<AdmissionFormData>({
        first_name: admission.first_name,
        last_name: admission.last_name,
        nationality: admission.nationality,
        id_number: admission.id_number,
        birth_date: admission.birth_date,
        gender: admission.gender,
        email: admission.email,
        phone: admission.phone,
        address: admission.address,
        career_id: admission.career_id,
        modality: admission.modality,
        schedule: admission.schedule,
        shift: admission.shift,
        high_school: admission.high_school,
        high_school_year: admission.high_school_year,
        high_school_average: admission.high_school_average,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(update_url, { preserveScroll: true });
    };

    const selectedCareer = careers.find(
        (career) => career.id === Number(form.data.career_id),
    );
    const offerings = selectedCareer?.offerings ?? [];
    const optionLabel = (options: Option[], value: string): string =>
        options.find((option) => option.value === value)?.label ?? value;
    const offeringOptions = (
        available: string[],
        current: string,
        options: Option[],
    ): Option[] => {
        const values = [...new Set([...available, current])].filter(Boolean);

        return values.map((value) => ({
            value,
            label: optionLabel(options, value),
        }));
    };
    const availableModalities = offeringOptions(
        offerings.map((offering) => offering.modality),
        form.data.modality,
        modalities,
    );
    const matchingSchedules = offerings
        .filter((offering) => offering.modality === form.data.modality)
        .map((offering) => offering.schedule);
    const availableSchedules = offeringOptions(
        matchingSchedules,
        form.data.schedule,
        schedules,
    );
    const matchingShifts = offerings
        .filter(
            (offering) =>
                offering.modality === form.data.modality &&
                offering.schedule === form.data.schedule,
        )
        .map((offering) => offering.shift);
    const availableShifts = offeringOptions(
        matchingShifts,
        form.data.shift,
        shifts,
    );
    const changeCareer = (value: string) => {
        const careerId = Number(value);
        const firstOffering = careers
            .find((career) => career.id === careerId)
            ?.offerings.at(0);

        form.setData({
            ...form.data,
            career_id: careerId,
            ...(firstOffering
                ? {
                      modality: firstOffering.modality,
                      schedule: firstOffering.schedule,
                      shift: firstOffering.shift,
                  }
                : {}),
        });
    };
    const changeModality = (value: string) => {
        const firstOffering = offerings.find(
            (offering) => offering.modality === value,
        );

        form.setData({
            ...form.data,
            modality: value,
            ...(firstOffering
                ? {
                      schedule: firstOffering.schedule,
                      shift: firstOffering.shift,
                  }
                : {}),
        });
    };
    const changeSchedule = (value: string) => {
        const firstOffering = offerings.find(
            (offering) =>
                offering.modality === form.data.modality &&
                offering.schedule === value,
        );

        form.setData({
            ...form.data,
            schedule: value,
            ...(firstOffering ? { shift: firstOffering.shift } : {}),
        });
    };
    const careerOptions = careers.map((career) => ({
        value: String(career.id),
        label: career.name,
    }));

    return (
        <>
            <Head title={`Editar solicitud ${admission.code}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow={`Solicitud ${admission.code}`}
                    title="Editar datos de admisión"
                    description="Corrige los datos del aspirante y de su preinscripción. El estado y las revisiones documentales no se modifican desde este formulario."
                    actions={
                        <Link
                            href={show_url}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            Volver al expediente
                        </Link>
                    }
                />

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border border-border/70 bg-white p-5 shadow-sm sm:p-6 dark:bg-card"
                >
                    <section className="space-y-4">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Datos personales
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField
                                id="first_name"
                                label="Nombres"
                                value={form.data.first_name}
                                error={form.errors.first_name}
                                onChange={(value) =>
                                    form.setData('first_name', value)
                                }
                            />
                            <TextField
                                id="last_name"
                                label="Apellidos"
                                value={form.data.last_name}
                                error={form.errors.last_name}
                                onChange={(value) =>
                                    form.setData('last_name', value)
                                }
                            />
                            <SelectField
                                id="nationality"
                                label="Nacionalidad de cédula"
                                value={form.data.nationality}
                                options={[
                                    { value: 'V', label: 'Venezolana (V)' },
                                    { value: 'E', label: 'Extranjera (E)' },
                                ]}
                                error={form.errors.nationality}
                                onChange={(value) =>
                                    form.setData('nationality', value)
                                }
                            />
                            <div>
                                <TextField
                                    id="id_number"
                                    label="Cédula"
                                    value={form.data.id_number}
                                    error={form.errors.id_number}
                                    disabled={admission.has_documents}
                                    onChange={(value) =>
                                        form.setData('id_number', value)
                                    }
                                />
                                {admission.has_documents ? (
                                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                        No se puede cambiar porque ya hay
                                        documentos guardados en la carpeta
                                        privada.
                                    </p>
                                ) : null}
                            </div>
                            <TextField
                                id="birth_date"
                                label="Fecha de nacimiento"
                                type="date"
                                value={form.data.birth_date}
                                error={form.errors.birth_date}
                                onChange={(value) =>
                                    form.setData('birth_date', value)
                                }
                            />
                            <SelectField
                                id="gender"
                                label="Género"
                                value={form.data.gender}
                                options={[
                                    { value: '', label: 'No indicado' },
                                    ...genders,
                                ]}
                                error={form.errors.gender}
                                onChange={(value) =>
                                    form.setData('gender', value)
                                }
                            />
                            <TextField
                                id="email"
                                label="Correo electrónico"
                                type="email"
                                value={form.data.email}
                                error={form.errors.email}
                                onChange={(value) =>
                                    form.setData('email', value)
                                }
                            />
                            <TextField
                                id="phone"
                                label="Teléfono"
                                type="tel"
                                value={form.data.phone}
                                error={form.errors.phone}
                                onChange={(value) =>
                                    form.setData('phone', value)
                                }
                            />
                            <div className="md:col-span-2">
                                <TextField
                                    id="address"
                                    label="Dirección"
                                    value={form.data.address}
                                    error={form.errors.address}
                                    onChange={(value) =>
                                        form.setData('address', value)
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 border-t border-border pt-5">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Datos de la preinscripción
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField
                                id="career_id"
                                label="Carrera"
                                value={form.data.career_id}
                                options={careerOptions}
                                error={form.errors.career_id}
                                onChange={changeCareer}
                            />
                            <SelectField
                                id="modality"
                                label="Modalidad"
                                value={form.data.modality}
                                options={availableModalities}
                                error={form.errors.modality}
                                onChange={changeModality}
                            />
                            <SelectField
                                id="schedule"
                                label="Horario"
                                value={form.data.schedule}
                                options={availableSchedules}
                                error={form.errors.schedule}
                                onChange={changeSchedule}
                            />
                            <SelectField
                                id="shift"
                                label="Turno"
                                value={form.data.shift}
                                options={availableShifts}
                                error={form.errors.shift}
                                onChange={(value) =>
                                    form.setData('shift', value)
                                }
                            />
                            <TextField
                                id="high_school"
                                label="Plantel de bachillerato"
                                value={form.data.high_school}
                                error={form.errors.high_school}
                                onChange={(value) =>
                                    form.setData('high_school', value)
                                }
                            />
                            <TextField
                                id="high_school_year"
                                label="Año de graduación"
                                type="number"
                                value={form.data.high_school_year}
                                error={form.errors.high_school_year}
                                onChange={(value) =>
                                    form.setData(
                                        'high_school_year',
                                        Number(value),
                                    )
                                }
                            />
                            <TextField
                                id="high_school_average"
                                label="Promedio (0 a 20)"
                                type="number"
                                value={form.data.high_school_average}
                                error={form.errors.high_school_average}
                                onChange={(value) =>
                                    form.setData(
                                        'high_school_average',
                                        Number(value),
                                    )
                                }
                            />
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
                        <Link
                            href={show_url}
                            className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-upel-cloud dark:hover:bg-muted"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-60"
                        >
                            {form.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
