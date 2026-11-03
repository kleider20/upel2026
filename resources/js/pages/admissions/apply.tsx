import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    FileText,
    GraduationCap,
    Loader2,
    LockKeyhole,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import {
    lookup as admissionLookup,
    store as admissionStore,
} from '@/routes/admissions';

type CareerOfferingOption = {
    modality: string;
    modality_label: string;
    schedule: string;
    schedule_label: string;
    shift: string;
    shift_label: string;
};

type CareerOption = {
    id: number;
    name: string;
    code: string;
    modality: string;
    modality_label: string;
    duration_semesters: number;
    offerings: CareerOfferingOption[];
};

type DocumentTypeOption = {
    value: string;
    label: string;
    description: string;
    required: boolean;
    accept: string;
};

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
    career_id: string;
    modality: string;
    schedule: string;
    shift: string;
    high_school: string;
    high_school_year: string;
    high_school_average: string;
    terms: boolean;
};

type Props = {
    careers: CareerOption[];
    periodYear: number;
    documentTypes: DocumentTypeOption[];
    highSchools: string[];
    opensAt: string;
};

const steps = [
    {
        title: 'Datos personales',
        description: 'Identificación y contacto',
    },
    {
        title: 'Información académica',
        description: 'Carrera y bachillerato',
    },
    {
        title: 'Confirmación',
        description: 'Revisa y envía',
    },
];

const inputClass =
    'h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 px-3 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-upel-blue/15';

const selectClass =
    'h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 px-3 text-sm font-medium text-upel-navy focus:border-upel-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-upel-blue/15';

const labelClass = 'mb-1.5 block text-[0.72rem] font-extrabold text-upel-navy';

const stepOneFields: (keyof AdmissionFormData)[] = [
    'first_name',
    'last_name',
    'nationality',
    'id_number',
    'birth_date',
    'email',
    'phone',
];

const stepTwoFields: (keyof AdmissionFormData)[] = [
    'career_id',
    'modality',
    'schedule',
    'shift',
    'high_school',
    'high_school_year',
    'high_school_average',
];

/**
 * Calcula la fecha máxima de nacimiento para aspirantes de 15 años o más.
 */
function latestBirthDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 15);

    return date.toISOString().slice(0, 10);
}

/**
 * Da formato venezolano al teléfono de contacto: 0412-9354992.
 *
 * Acepta números con espacios o guiones y convierte el prefijo
 * internacional +58 en el 0 local.
 */
function formatPhoneNumber(value: string): string {
    let digits = value.replace(/\D/g, '');

    if (digits.length > 11 && digits.startsWith('58')) {
        digits = `0${digits.slice(2)}`;
    }

    digits = digits.slice(0, 11);

    if (digits.length <= 4) {
        return digits;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/**
 * Normaliza texto para comparar nombres sin distinguir mayúsculas ni acentos.
 */
function normalizeSearch(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

/**
 * Formulario público de preinscripción en tres pasos.
 *
 * Los documentos no se adjuntan aquí: una vez creada la solicitud, el
 * aspirante los carga desde la página de seguimiento.
 */
export default function AdmissionApply({
    careers,
    periodYear,
    documentTypes,
    highSchools,
}: Props) {
    const [step, setStep] = useState(1);
    const [highSchoolOpen, setHighSchoolOpen] = useState(false);
    const [clientErrors, setClientErrors] = useState<
        Partial<Record<keyof AdmissionFormData, string>>
    >({});

    const { data, setData, post, processing, errors } =
        useForm<AdmissionFormData>({
            first_name: '',
            last_name: '',
            nationality: 'V',
            id_number: '',
            birth_date: '',
            gender: '',
            email: '',
            phone: '',
            address: '',
            career_id: '',
            modality: '',
            schedule: '',
            shift: '',
            high_school: '',
            high_school_year: '',
            high_school_average: '',
            terms: false,
        });

    const fieldError = (field: keyof AdmissionFormData): string | undefined =>
        clientErrors[field] ??
        (errors as Record<string, string | undefined>)[field];

    const selectedCareer = careers.find(
        (career) => String(career.id) === data.career_id,
    );
    const selectedOfferings = selectedCareer?.offerings ?? [];
    const selectedOffering = selectedOfferings.find(
        (offering) =>
            offering.modality === data.modality &&
            offering.schedule === data.schedule &&
            offering.shift === data.shift,
    );

    const modalityOptions = Array.from(
        new Map(
            selectedOfferings.map((offering) => [
                offering.modality,
                { value: offering.modality, label: offering.modality_label },
            ]),
        ).values(),
    );
    const scheduleOptions = Array.from(
        new Map(
            selectedOfferings
                .filter((offering) => offering.modality === data.modality)
                .map((offering) => [
                    offering.schedule,
                    {
                        value: offering.schedule,
                        label: offering.schedule_label,
                    },
                ]),
        ).values(),
    );
    const shiftOptions = Array.from(
        new Map(
            selectedOfferings
                .filter(
                    (offering) =>
                        offering.modality === data.modality &&
                        offering.schedule === data.schedule,
                )
                .map((offering) => [
                    offering.shift,
                    { value: offering.shift, label: offering.shift_label },
                ]),
        ).values(),
    );

    const highSchoolQuery = normalizeSearch(data.high_school);
    const highSchoolSuggestions =
        highSchoolQuery === ''
            ? []
            : highSchools
                  .filter((name) =>
                      normalizeSearch(name).includes(highSchoolQuery),
                  )
                  .filter(
                      (name) => normalizeSearch(name) !== highSchoolQuery,
                  )
                  .slice(0, 6);
    const showHighSchoolSuggestions =
        highSchoolOpen && highSchoolSuggestions.length > 0;

    /**
     * Cambia la carrera y ajusta modalidad, horario y turno a su primera oferta.
     */
    const handleCareerChange = (value: string) => {
        const career = careers.find(
            (option) => String(option.id) === value,
        );
        const offering = career?.offerings[0];

        setData((current) => ({
            ...current,
            career_id: value,
            modality: offering?.modality ?? '',
            schedule: offering?.schedule ?? '',
            shift: offering?.shift ?? '',
        }));
    };

    /**
     * Cambia la modalidad y ajusta el horario y el turno a una oferta válida.
     */
    const handleModalityChange = (value: string) => {
        const offering = selectedOfferings.find(
            (option) => option.modality === value,
        );

        setData((current) => ({
            ...current,
            modality: value,
            schedule: offering?.schedule ?? '',
            shift: offering?.shift ?? '',
        }));
    };

    /**
     * Cambia el horario y ajusta el turno a una oferta válida.
     */
    const handleScheduleChange = (value: string) => {
        const offering = selectedOfferings.find(
            (option) =>
                option.modality === data.modality &&
                option.schedule === value,
        );

        setData((current) => ({
            ...current,
            schedule: value,
            shift: offering?.shift ?? '',
        }));
    };

    /**
     * Valida un paso antes de avanzar y devuelve el primer campo con error.
     */
    const validateStep = (
        target: number,
    ): { valid: boolean; firstField?: keyof AdmissionFormData } => {
        const nextErrors: Partial<Record<keyof AdmissionFormData, string>> = {};

        if (target === 1) {
            if (data.first_name.trim().length < 2) {
                nextErrors.first_name = 'Indica tus nombres.';
            }

            if (data.last_name.trim().length < 2) {
                nextErrors.last_name = 'Indica tus apellidos.';
            }

            if (!['V', 'E'].includes(data.nationality)) {
                nextErrors.nationality = 'Selecciona la nacionalidad.';
            }

            if (!/^\d{5,9}$/.test(data.id_number.trim())) {
                nextErrors.id_number =
                    'La cédula debe contener entre 5 y 9 dígitos.';
            }

            if (data.birth_date === '') {
                nextErrors.birth_date = 'Indica tu fecha de nacimiento.';
            } else {
                const birthDate = new Date(`${data.birth_date}T00:00:00`);
                const age =
                    (Date.now() - birthDate.getTime()) / 31_557_600_000;

                if (Number.isNaN(birthDate.getTime())) {
                    nextErrors.birth_date =
                        'La fecha de nacimiento no es válida.';
                } else if (age < 15) {
                    nextErrors.birth_date =
                        'Debes tener al menos 15 años para preinscribirte.';
                }
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
                nextErrors.email = 'Indica un correo electrónico válido.';
            }

            if (!/^[0-9+()\-\s]{7,30}$/.test(data.phone.trim())) {
                nextErrors.phone =
                    'Indica un teléfono de contacto válido (mínimo 7 caracteres).';
            }
        }

        if (target === 2) {
            if (data.career_id === '') {
                nextErrors.career_id = 'Selecciona la carrera de tu interés.';
            } else if (!selectedCareer) {
                nextErrors.career_id =
                    'La carrera seleccionada ya no está disponible.';
            } else if (
                !selectedOfferings.some(
                    (offering) => offering.modality === data.modality,
                )
            ) {
                nextErrors.modality = 'Selecciona la modalidad de estudio.';
            } else if (
                !selectedOfferings.some(
                    (offering) =>
                        offering.modality === data.modality &&
                        offering.schedule === data.schedule,
                )
            ) {
                nextErrors.schedule = 'Selecciona el horario de estudio.';
            } else if (
                !selectedOfferings.some(
                    (offering) =>
                        offering.modality === data.modality &&
                        offering.schedule === data.schedule &&
                        offering.shift === data.shift,
                )
            ) {
                nextErrors.shift = 'Selecciona el turno de estudio.';
            }

            if (data.high_school.trim().length < 3) {
                nextErrors.high_school =
                    'Indica el plantel donde cursaste el bachillerato.';
            }

            const year = Number(data.high_school_year);
            const currentYear = new Date().getFullYear();

            if (
                !Number.isInteger(year) ||
                year < 1980 ||
                year > currentYear
            ) {
                nextErrors.high_school_year =
                    'Indica un año de graduación válido.';
            }

            const average = Number(data.high_school_average);

            if (
                data.high_school_average === '' ||
                Number.isNaN(average) ||
                average < 0 ||
                average > 20
            ) {
                nextErrors.high_school_average =
                    'El promedio debe estar entre 0 y 20 puntos.';
            }
        }

        if (target === 3 && !data.terms) {
            nextErrors.terms = 'Debes aceptar las condiciones del proceso.';
        }

        setClientErrors((current) => {
            const cleaned = { ...current };
            const validatedFields =
                target === 1
                    ? stepOneFields
                    : target === 2
                      ? stepTwoFields
                      : (['terms'] as (keyof AdmissionFormData)[]);

            for (const field of validatedFields) {
                delete cleaned[field];
            }

            return { ...cleaned, ...nextErrors };
        });

        return {
            valid: Object.keys(nextErrors).length === 0,
            firstField: Object.keys(nextErrors)[0] as
                | keyof AdmissionFormData
                | undefined,
        };
    };

    const goNext = () => {
        const result = validateStep(step);

        if (result.valid) {
            setStep((current) => Math.min(3, current + 1));
        }
    };

    const goBack = () => setStep((current) => Math.max(1, current - 1));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        for (const target of [1, 2, 3]) {
            const result = validateStep(target);

            if (!result.valid) {
                setStep(target);

                return;
            }
        }

        post(admissionStore.url(), {
            onError: (serverErrors) => {
                const keys = Object.keys(serverErrors);

                if (keys.some((key) => stepOneFields.includes(key as keyof AdmissionFormData))) {
                    setStep(1);
                } else if (
                    keys.some((key) =>
                        stepTwoFields.includes(key as keyof AdmissionFormData),
                    )
                ) {
                    setStep(2);
                } else {
                    setStep(3);
                }
            },
        });
    };

    return (
        <>
            <Head title="Preinscripción 2027" />

            <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <div className="rounded-3xl border border-upel-navy/10 bg-white p-6 shadow-[0_30px_70px_-45px_rgba(10,37,64,0.45)] sm:p-8 lg:p-10">
                    <div className="flex flex-col gap-4 border-b border-upel-navy/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[0.68rem] font-extrabold tracking-[0.18em] text-upel-blue uppercase">
                                Admisión {periodYear}
                            </p>
                            <h1 className="mt-2 font-display text-3xl leading-tight font-bold text-upel-navy sm:text-4xl">
                                Inicia tu preinscripción
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-upel-slate">
                                Completa tus datos en tres pasos. Al finalizar
                                recibirás un código de aspirante y un enlace
                                para cargar tus documentos y consultar el estado
                                de tu solicitud.
                            </p>
                        </div>
                        <Link
                            href={admissionLookup()}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-upel-navy/12 px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                        >
                            <LockKeyhole className="size-3.5" aria-hidden="true" />
                            Ya tengo una solicitud
                        </Link>
                    </div>

                    <ol
                        className="mt-6 grid gap-3 sm:grid-cols-3"
                        aria-label="Pasos de la preinscripción"
                    >
                        {steps.map((item, index) => {
                            const number = index + 1;
                            const done = step > number;
                            const current = step === number;

                            return (
                                <li
                                    key={item.title}
                                    aria-current={current ? 'step' : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                                        current
                                            ? 'border-upel-blue/30 bg-upel-blue/5'
                                            : done
                                              ? 'border-upel-green/25 bg-upel-green/5'
                                              : 'border-upel-navy/10 bg-upel-cloud/50',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                                            current
                                                ? 'bg-upel-blue text-white'
                                                : done
                                                  ? 'bg-upel-green text-white'
                                                  : 'bg-white text-upel-slate ring-1 ring-upel-navy/10',
                                        )}
                                    >
                                        {done ? (
                                            <Check
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            number
                                        )}
                                    </span>
                                    <span>
                                        <span className="block text-xs font-extrabold text-upel-navy">
                                            {item.title}
                                        </span>
                                        <span className="block text-[0.65rem] font-semibold text-upel-slate">
                                            {item.description}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>

                    <form onSubmit={submit} className="mt-8" noValidate>
                        {step === 1 ? (
                            <section
                                aria-labelledby="step-personal"
                                className="animate-fade-up space-y-5"
                            >
                                <div>
                                    <h2
                                        id="step-personal"
                                        className="text-sm font-extrabold text-upel-navy"
                                    >
                                        Datos personales
                                    </h2>
                                    <p className="mt-1 text-xs text-upel-slate">
                                        Tal como aparecen en tu cédula de
                                        identidad.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="first_name"
                                            className={labelClass}
                                        >
                                            Nombres
                                        </label>
                                        <input
                                            id="first_name"
                                            type="text"
                                            autoComplete="given-name"
                                            value={data.first_name}
                                            onChange={(event) =>
                                                setData(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('first_name'),
                                            )}
                                            className={inputClass}
                                            placeholder="María Alejandra"
                                        />
                                        <InputError
                                            message={fieldError('first_name')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="last_name"
                                            className={labelClass}
                                        >
                                            Apellidos
                                        </label>
                                        <input
                                            id="last_name"
                                            type="text"
                                            autoComplete="family-name"
                                            value={data.last_name}
                                            onChange={(event) =>
                                                setData(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('last_name'),
                                            )}
                                            className={inputClass}
                                            placeholder="Rodríguez Pérez"
                                        />
                                        <InputError
                                            message={fieldError('last_name')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="id_number"
                                            className={labelClass}
                                        >
                                            Cédula de identidad
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                aria-label="Nacionalidad de la cédula"
                                                value={data.nationality}
                                                onChange={(event) =>
                                                    setData(
                                                        'nationality',
                                                        event.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    selectClass,
                                                    'w-20 shrink-0',
                                                )}
                                            >
                                                <option value="V">V</option>
                                                <option value="E">E</option>
                                            </select>
                                            <input
                                                id="id_number"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                value={data.id_number}
                                                onChange={(event) =>
                                                    setData(
                                                        'id_number',
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    fieldError('id_number'),
                                                )}
                                                className={inputClass}
                                                placeholder="12345678"
                                            />
                                        </div>
                                        <InputError
                                            message={fieldError('id_number')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="birth_date"
                                            className={labelClass}
                                        >
                                            Fecha de nacimiento
                                        </label>
                                        <input
                                            id="birth_date"
                                            type="date"
                                            max={latestBirthDate()}
                                            value={data.birth_date}
                                            onChange={(event) =>
                                                setData(
                                                    'birth_date',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('birth_date'),
                                            )}
                                            className={inputClass}
                                        />
                                        <InputError
                                            message={fieldError('birth_date')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className={labelClass}
                                        >
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('email'),
                                            )}
                                            className={inputClass}
                                            placeholder="nombre@correo.com"
                                        />
                                        <InputError
                                            message={fieldError('email')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className={labelClass}
                                        >
                                            Teléfono de contacto
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            value={data.phone}
                                            onChange={(event) =>
                                                setData(
                                                    'phone',
                                                    formatPhoneNumber(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('phone'),
                                            )}
                                            className={inputClass}
                                            placeholder="0412-9354992"
                                        />
                                        <InputError
                                            message={fieldError('phone')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="gender"
                                            className={labelClass}
                                        >
                                            Género{' '}
                                            <span className="font-semibold text-upel-slate">
                                                (opcional)
                                            </span>
                                        </label>
                                        <select
                                            id="gender"
                                            value={data.gender}
                                            onChange={(event) =>
                                                setData(
                                                    'gender',
                                                    event.target.value,
                                                )
                                            }
                                            className={selectClass}
                                        >
                                            <option value="">
                                                Prefiero no indicar
                                            </option>
                                            <option value="femenino">
                                                Femenino
                                            </option>
                                            <option value="masculino">
                                                Masculino
                                            </option>
                                            <option value="otro">Otro</option>
                                            <option value="prefiero_no_decir">
                                                Prefiero no decir
                                            </option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="address"
                                            className={labelClass}
                                        >
                                            Dirección de residencia{' '}
                                            <span className="font-semibold text-upel-slate">
                                                (opcional)
                                            </span>
                                        </label>
                                        <textarea
                                            id="address"
                                            rows={2}
                                            value={data.address}
                                            onChange={(event) =>
                                                setData(
                                                    'address',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 px-3 py-2.5 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-upel-blue/15"
                                            placeholder="Estado, municipio, parroquia y referencia"
                                        />
                                        <InputError
                                            message={fieldError('address')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {step === 2 ? (
                            <section
                                aria-labelledby="step-academic"
                                className="animate-fade-up space-y-5"
                            >
                                <div>
                                    <h2
                                        id="step-academic"
                                        className="text-sm font-extrabold text-upel-navy"
                                    >
                                        Información académica
                                    </h2>
                                    <p className="mt-1 text-xs text-upel-slate">
                                        Elige la carrera y registra tus datos de
                                        bachillerato.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="career_id"
                                            className={labelClass}
                                        >
                                            Carrera de interés
                                        </label>
                                        <select
                                            id="career_id"
                                            value={data.career_id}
                                            onChange={(event) =>
                                                handleCareerChange(
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('career_id'),
                                            )}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                Selecciona una carrera
                                            </option>
                                            {careers.map((career) => (
                                                <option
                                                    key={career.id}
                                                    value={career.id}
                                                >
                                                    {career.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={fieldError('career_id')}
                                            className="mt-1 text-xs"
                                        />
                                        {selectedCareer ? (
                                            <p className="mt-2 rounded-xl bg-upel-blue/5 px-3 py-2 text-[0.7rem] font-semibold text-upel-blue">
                                                {selectedCareer.code} ·{' '}
                                                {
                                                    selectedCareer.duration_semesters
                                                }{' '}
                                                semestres ·{' '}
                                                {selectedOfferings.length}{' '}
                                                {selectedOfferings.length === 1
                                                    ? 'oferta disponible'
                                                    : 'ofertas disponibles'}
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
                                            value={data.modality}
                                            onChange={(event) =>
                                                handleModalityChange(
                                                    event.target.value,
                                                )
                                            }
                                            disabled={!selectedCareer}
                                            aria-invalid={Boolean(
                                                fieldError('modality'),
                                            )}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                {selectedCareer
                                                    ? 'Selecciona una modalidad'
                                                    : 'Selecciona una carrera primero'}
                                            </option>
                                            {modalityOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={fieldError('modality')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="schedule"
                                            className={labelClass}
                                        >
                                            Horario
                                        </label>
                                        <select
                                            id="schedule"
                                            value={data.schedule}
                                            onChange={(event) =>
                                                handleScheduleChange(
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !selectedCareer ||
                                                data.modality === ''
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('schedule'),
                                            )}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                {data.modality === ''
                                                    ? 'Selecciona una modalidad primero'
                                                    : 'Selecciona un horario'}
                                            </option>
                                            {scheduleOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={fieldError('schedule')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="shift"
                                            className={labelClass}
                                        >
                                            Turno
                                        </label>
                                        <select
                                            id="shift"
                                            value={data.shift}
                                            onChange={(event) =>
                                                setData(
                                                    'shift',
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                !selectedCareer ||
                                                data.schedule === ''
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('shift'),
                                            )}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                {data.schedule === ''
                                                    ? 'Selecciona un horario primero'
                                                    : 'Selecciona un turno'}
                                            </option>
                                            {shiftOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={fieldError('shift')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="high_school"
                                            className={labelClass}
                                        >
                                            Plantel de bachillerato
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="high_school"
                                                type="text"
                                                value={data.high_school}
                                                onChange={(event) => {
                                                    setData(
                                                        'high_school',
                                                        event.target.value,
                                                    );
                                                    setHighSchoolOpen(true);
                                                }}
                                                onFocus={() =>
                                                    setHighSchoolOpen(true)
                                                }
                                                onBlur={() =>
                                                    setHighSchoolOpen(false)
                                                }
                                                autoComplete="off"
                                                role="combobox"
                                                aria-autocomplete="list"
                                                aria-expanded={
                                                    showHighSchoolSuggestions
                                                }
                                                aria-controls="high-school-suggestions"
                                                aria-invalid={Boolean(
                                                    fieldError('high_school'),
                                                )}
                                                className={inputClass}
                                                placeholder="Unidad Educativa Nacional..."
                                            />
                                            {showHighSchoolSuggestions ? (
                                                <div
                                                    id="high-school-suggestions"
                                                    role="listbox"
                                                    aria-label="Planteles de bachillerato"
                                                    className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-upel-mist bg-white py-1 shadow-lg"
                                                >
                                                    {highSchoolSuggestions.map(
                                                        (name) => (
                                                            <button
                                                                key={name}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={
                                                                    data.high_school ===
                                                                    name
                                                                }
                                                                onMouseDown={(
                                                                    event,
                                                                ) =>
                                                                    event.preventDefault()
                                                                }
                                                                onClick={() => {
                                                                    setData(
                                                                        'high_school',
                                                                        name,
                                                                    );
                                                                    setHighSchoolOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-upel-navy transition-colors hover:bg-upel-cloud"
                                                            >
                                                                {name}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-[0.66rem] text-upel-slate">
                                            Escribe el nombre y elige una
                                            coincidencia si aparece.
                                        </p>
                                        <InputError
                                            message={fieldError('high_school')}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="high_school_year"
                                            className={labelClass}
                                        >
                                            Año de graduación
                                        </label>
                                        <input
                                            id="high_school_year"
                                            type="number"
                                            min={1980}
                                            max={new Date().getFullYear()}
                                            value={data.high_school_year}
                                            onChange={(event) =>
                                                setData(
                                                    'high_school_year',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('high_school_year'),
                                            )}
                                            className={inputClass}
                                            placeholder="2025"
                                        />
                                        <InputError
                                            message={fieldError(
                                                'high_school_year',
                                            )}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="high_school_average"
                                            className={labelClass}
                                        >
                                            Promedio de bachillerato (0–20)
                                        </label>
                                        <input
                                            id="high_school_average"
                                            type="number"
                                            min={0}
                                            max={20}
                                            step="0.01"
                                            value={data.high_school_average}
                                            onChange={(event) =>
                                                setData(
                                                    'high_school_average',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError(
                                                    'high_school_average',
                                                ),
                                            )}
                                            className={inputClass}
                                            placeholder="16.50"
                                        />
                                        <InputError
                                            message={fieldError(
                                                'high_school_average',
                                            )}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {step === 3 ? (
                            <section
                                aria-labelledby="step-confirm"
                                className="animate-fade-up space-y-5"
                            >
                                <div>
                                    <h2
                                        id="step-confirm"
                                        className="text-sm font-extrabold text-upel-navy"
                                    >
                                        Revisa y confirma
                                    </h2>
                                    <p className="mt-1 text-xs text-upel-slate">
                                        Verifica que la información coincida con
                                        tus documentos.
                                    </p>
                                </div>

                                <dl className="grid gap-3 rounded-2xl border border-upel-navy/10 bg-upel-cloud/50 p-5 sm:grid-cols-2">
                                    {[
                                        [
                                            'Nombre completo',
                                            `${data.first_name} ${data.last_name}`.trim(),
                                        ],
                                        [
                                            'Cédula',
                                            `${data.nationality}-${data.id_number}`,
                                        ],
                                        ['Correo', data.email],
                                        [
                                            'Teléfono',
                                            formatPhoneNumber(data.phone),
                                        ],
                                        [
                                            'Carrera',
                                            selectedCareer?.name ?? '—',
                                        ],
                                        [
                                            'Modalidad',
                                            selectedOffering?.modality_label ??
                                                '—',
                                        ],
                                        [
                                            'Horario',
                                            selectedOffering?.schedule_label ??
                                                '—',
                                        ],
                                        [
                                            'Turno',
                                            selectedOffering?.shift_label ?? '—',
                                        ],
                                        [
                                            'Plantel de bachillerato',
                                            data.high_school,
                                        ],
                                        [
                                            'Año de graduación',
                                            data.high_school_year,
                                        ],
                                        [
                                            'Promedio',
                                            data.high_school_average,
                                        ],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <dt className="text-[0.62rem] font-extrabold tracking-wide text-upel-slate uppercase">
                                                {label}
                                            </dt>
                                            <dd className="mt-0.5 text-sm font-semibold text-upel-navy">
                                                {value || '—'}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                <div className="rounded-2xl border border-upel-gold/30 bg-upel-gold/8 p-5">
                                    <p className="flex items-center gap-2 text-xs font-extrabold text-upel-navy">
                                        <FileText
                                            className="size-4 text-upel-gold"
                                            aria-hidden="true"
                                        />
                                        Documentos que cargarás después de
                                        enviar la solicitud
                                    </p>
                                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {documentTypes.map((document) => (
                                            <li
                                                key={document.value}
                                                className="flex items-start gap-2 text-[0.72rem] leading-relaxed text-upel-slate"
                                            >
                                                <CheckCircle2
                                                    className="mt-0.5 size-3.5 shrink-0 text-upel-green"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    <strong className="font-bold text-upel-navy">
                                                        {document.label}
                                                    </strong>
                                                    {' — '}
                                                    {document.description}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-upel-navy/10 p-4 text-xs leading-relaxed text-upel-slate">
                                        <input
                                            type="checkbox"
                                            checked={data.terms}
                                            onChange={(event) =>
                                                setData(
                                                    'terms',
                                                    event.target.checked,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                fieldError('terms'),
                                            )}
                                            className="mt-0.5 size-4 shrink-0 rounded border-upel-mist accent-upel-navy"
                                        />
                                        <span>
                                            Declaro que la información suministrada
                                            es veraz y acepto las condiciones del
                                            proceso de admisión de la UPEL, incluida
                                            la verificación de mis documentos.
                                        </span>
                                    </label>
                                    <InputError
                                        message={fieldError('terms')}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </section>
                        ) : null}

                        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-upel-navy/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-upel-navy/15 px-5 py-3 text-sm font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                                >
                                    <ArrowLeft
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Anterior
                                </button>
                            ) : (
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-upel-navy/15 px-5 py-3 text-sm font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                                >
                                    <ArrowLeft
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Volver al inicio
                                </Link>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-6 py-3 text-sm font-extrabold text-white transition-all duration-300 hover:bg-upel-navy-800"
                                >
                                    Continuar
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-6 py-3 text-sm font-extrabold text-upel-navy shadow-[0_14px_30px_-16px_rgba(201,162,39,0.9)] transition-all duration-300 hover:bg-upel-gold-light disabled:cursor-wait disabled:opacity-70"
                                >
                                    {processing ? (
                                        <Loader2
                                            className="size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <GraduationCap
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {processing
                                        ? 'Enviando solicitud...'
                                        : 'Enviar solicitud'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
