import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileSearch,
    FileText,
    GraduationCap,
    History,
    Loader2,
    LockKeyhole,
    LogIn,
    Mail,
    MapPin,
    Phone,
    Trash2,
    UploadCloud,
    UserRound,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import {
    create as admissionCreate,
    lookup as admissionLookup,
} from '@/routes/admissions';
import { submit as admissionLookupSubmit } from '@/routes/admissions/lookup';

type DocumentTypeOption = {
    value: string;
    label: string;
    description: string;
    required: boolean;
    accept: string;
};

type AdmissionDocumentRow = {
    id: number;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    status_tone: string;
    original_name: string;
    size: string;
    notes: string | null;
    uploaded_at: string | null;
    delete_url: string;
};

type HistoryRow = {
    id: number;
    from: string;
    to: string;
    title: string;
    tone: string;
    note: string | null;
    changed_by: string;
    date: string | null;
};

type StudentAccess = {
    name: string;
    email: string;
    student_code: string | null;
    career: string | null;
    period_year: number;
    converted_at: string | null;
    initial_password: string | null;
    login_url: string;
};

type AdmissionDetail = {
    code: string;
    status: string;
    status_label: string;
    status_tone: string;
    status_description: string;
    full_name: string;
    id_number: string;
    email: string;
    phone: string;
    birth_date: string;
    career: string | null;
    career_code: string | null;
    modality: string;
    schedule: string;
    shift: string;
    high_school: string;
    high_school_year: number;
    high_school_average: string;
    period_year: number;
    submitted_at: string | null;
    review_notes: string | null;
    can_upload: boolean;
    missing_documents: string[];
    documents: AdmissionDocumentRow[];
    history: HistoryRow[];
    upload_url: string;
    student: StudentAccess | null;
};

type Props = {
    admission: AdmissionDetail | null;
    documentTypes?: DocumentTypeOption[];
};

const labelClass =
    'text-[0.62rem] font-extrabold tracking-wide text-upel-slate uppercase';
const valueClass = 'mt-0.5 text-sm font-semibold text-upel-navy';

/**
 * Formulario público para consultar una solicitud con correo y cédula.
 */
function LookupForm() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        id_number: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(admissionLookupSubmit.url());
    };

    return (
        <>
            <Head title="Consultar solicitud de admisión" />

            <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
                <div className="overflow-hidden rounded-3xl border border-upel-navy/10 bg-white shadow-[0_30px_70px_-45px_rgba(10,37,64,0.45)]">
                    <div className="relative bg-[linear-gradient(125deg,#071b30_0%,#0a2540_45%,#113a63_100%)] px-6 py-9 text-center sm:px-10">
                        <div
                            className="upel-grid absolute inset-0 opacity-60"
                            aria-hidden="true"
                        />
                        <div className="relative">
                            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-upel-gold text-upel-navy">
                                <FileSearch
                                    className="size-7"
                                    aria-hidden="true"
                                />
                            </span>
                            <h1 className="mt-4 font-display text-3xl leading-tight font-bold text-white">
                                Consulta tu solicitud
                            </h1>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/70">
                                Ingresa el correo y la cédula con los que
                                registraste tu solicitud.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="space-y-5 px-6 py-8 sm:px-10"
                    >
                        <div>
                            <label
                                htmlFor="lookup_email"
                                className={labelClass}
                            >
                                Correo electrónico
                            </label>
                            <div className="relative mt-1.5">
                                <Mail
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-upel-slate"
                                    aria-hidden="true"
                                />
                                <input
                                    id="lookup_email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    aria-invalid={Boolean(errors.email)}
                                    className="h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:ring-2 focus:ring-upel-blue/15 focus:outline-none"
                                    placeholder="nombre@correo.com"
                                    autoComplete="email"
                                />
                            </div>
                            <InputError
                                message={errors.email}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lookup_id_number"
                                className={labelClass}
                            >
                                Cédula de identidad
                            </label>
                            <div className="relative mt-1.5">
                                <UserRound
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-upel-slate"
                                    aria-hidden="true"
                                />
                                <input
                                    id="lookup_id_number"
                                    type="text"
                                    inputMode="numeric"
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
                                    aria-invalid={Boolean(errors.id_number)}
                                    className="h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:ring-2 focus:ring-upel-blue/15 focus:outline-none"
                                    placeholder="12345678"
                                    autoComplete="off"
                                />
                            </div>
                            <InputError
                                message={errors.id_number}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                        >
                            {processing ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <FileSearch
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            )}
                            {processing ? 'Buscando...' : 'Consultar estado'}
                        </button>

                        <p className="rounded-xl bg-upel-cloud px-4 py-3 text-[0.7rem] leading-relaxed text-upel-slate">
                            También puedes abrir el enlace firmado que enviamos
                            a tu correo al registrar la solicitud. Ese enlace te
                            permite cargar documentos y ver el historial
                            completo.
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-upel-navy/10 pt-5 text-[0.7rem] font-bold">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-upel-slate transition-colors hover:text-upel-navy"
                            >
                                <ArrowLeft
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Volver al sitio
                            </Link>
                            <Link
                                href={admissionCreate()}
                                className="inline-flex items-center gap-1.5 text-upel-blue transition-colors hover:text-upel-navy"
                            >
                                <GraduationCap
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Iniciar una nueva preinscripción
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

/**
 * Expediente del aspirante con carga de documentos e historial.
 */
function AdmissionDetailView({
    admission,
    documentTypes,
}: {
    admission: AdmissionDetail;
    documentTypes: DocumentTypeOption[];
}) {
    const firstIncompleteType = documentTypes.find((type) => {
        const document = admission.documents.find(
            (uploadedDocument) => uploadedDocument.type === type.value,
        );

        return document === undefined || document.status === 'rechazado';
    });
    const [activeType, setActiveType] = useState<string | null>(
        firstIncompleteType?.value ?? null,
    );
    const [replacingType, setReplacingType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const advanceAfterUploadRef = useRef(false);

    const uploadForm = useForm<{ type: string; document: File | null }>({
        type: firstIncompleteType?.value ?? documentTypes[0]?.value ?? '',
        document: null,
    });

    useEffect(() => {
        if (advanceAfterUploadRef.current) {
            advanceAfterUploadRef.current = false;

            if (firstIncompleteType !== undefined) {
                setActiveType(firstIncompleteType.value);
                setReplacingType(null);
            }
        }
    }, [admission.documents, firstIncompleteType]);

    useEffect(() => {
        if (activeType !== null && uploadForm.data.type !== activeType) {
            uploadForm.setData('type', activeType);
        }
    }, [activeType, uploadForm.data.type]);

    const selectedType = documentTypes.find(
        (type) => type.value === activeType,
    );
    const activeStep = documentTypes.findIndex(
        (type) => type.value === activeType,
    );
    const uploadedCount = documentTypes.filter((type) =>
        admission.documents.some(
            (uploadedDocument) => uploadedDocument.type === type.value,
        ),
    ).length;
    const validatedCount = documentTypes.filter((type) =>
        admission.documents.some(
            (document) =>
                document.type === type.value && document.status === 'validado',
        ),
    ).length;
    const pendingCount = documentTypes.filter((type) =>
        admission.documents.some(
            (document) =>
                document.type === type.value && document.status === 'pendiente',
        ),
    ).length;
    const documentsToUploadCount =
        documentTypes.length - validatedCount - pendingCount;

    const selectDocumentType = (type: string) => {
        setActiveType(type);
        setReplacingType(null);
        uploadForm.setData('type', type);
        uploadForm.setData('document', null);
        uploadForm.clearErrors();

        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }

        window.requestAnimationFrame(() => {
            window.document
                .getElementById('selected-admission-document')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const cancelReplacement = () => {
        setReplacingType(null);
        uploadForm.setData('document', null);
        uploadForm.clearErrors();

        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    };

    const submitUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        advanceAfterUploadRef.current =
            firstIncompleteType?.value === uploadForm.data.type;

        uploadForm.post(admission.upload_url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                uploadForm.reset('document');
                setReplacingType(null);

                if (fileInputRef.current !== null) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const removeDocument = (document: AdmissionDocumentRow) => {
        if (
            !window.confirm(
                `¿Eliminar "${document.type_label}"? Podrás subirlo de nuevo mientras la solicitud esté abierta.`,
            )
        ) {
            return;
        }

        router.delete(document.delete_url, {
            preserveScroll: true,
            onSuccess: () => {
                setReplacingType(null);
                uploadForm.setData('document', null);
                uploadForm.clearErrors();

                if (fileInputRef.current !== null) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const selectedDocument = admission.documents.find(
        (document) => document.type === activeType,
    );

    return (
        <>
            <Head title={`Solicitud ${admission.code}`} />

            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[0.68rem] font-extrabold tracking-[0.18em] text-upel-blue uppercase">
                            Seguimiento de admisión {admission.period_year}
                        </p>
                        <h1 className="mt-1 font-display text-3xl leading-tight font-bold text-upel-navy sm:text-4xl">
                            Solicitud {admission.code}
                        </h1>
                        <p className="mt-2 text-sm text-upel-slate">
                            {admission.full_name} · {admission.id_number}
                        </p>
                    </div>
                    <ToneBadge
                        tone={admission.status_tone as Tone}
                        className="self-start"
                    >
                        {admission.status_label}
                    </ToneBadge>
                </div>

                <div className="mt-6 rounded-2xl border border-upel-navy/10 bg-white p-5 shadow-sm">
                    <p className="text-sm leading-relaxed font-semibold text-upel-navy">
                        {admission.status_description}
                    </p>
                    {admission.review_notes ? (
                        <div className="mt-3 rounded-xl border border-upel-gold/30 bg-upel-gold/8 px-4 py-3 text-xs leading-relaxed text-upel-navy">
                            <strong className="font-extrabold">
                                Observación del equipo de admisión:
                            </strong>{' '}
                            {admission.review_notes}
                        </div>
                    ) : null}
                    {admission.missing_documents.length > 0 ? (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                            <AlertTriangle
                                className="mt-0.5 size-4 shrink-0"
                                aria-hidden="true"
                            />
                            <span>
                                <strong className="font-extrabold">
                                    Documentos pendientes:
                                </strong>{' '}
                                {admission.missing_documents.join(', ')}.
                            </span>
                        </div>
                    ) : null}
                </div>

                {admission.student ? (
                    <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-50 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                                    <GraduationCap
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h2 className="text-sm font-extrabold text-emerald-950">
                                        ¡Ya eres estudiante UPEL!
                                    </h2>
                                    <p className="mt-0.5 text-[0.7rem] leading-relaxed text-emerald-900/80">
                                        Tu solicitud fue convertida en una
                                        cuenta del campus virtual.
                                    </p>
                                </div>
                            </div>

                            {admission.student.student_code ? (
                                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-center">
                                    <p className="text-[0.58rem] font-extrabold tracking-[0.14em] text-emerald-700 uppercase">
                                        Código de estudiante
                                    </p>
                                    <p className="font-display text-lg leading-tight font-bold text-upel-navy">
                                        {admission.student.student_code}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <dt className={labelClass}>Correo de acceso</dt>
                                <dd className={valueClass}>
                                    {admission.student.email}
                                </dd>
                            </div>
                            <div>
                                <dt className={labelClass}>
                                    Contraseña inicial
                                </dt>
                                <dd className={valueClass}>
                                    {admission.student.initial_password ?? (
                                        <span className="text-emerald-700">
                                            Ya definida
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className={labelClass}>Carrera</dt>
                                <dd className={valueClass}>
                                    {admission.student.career ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className={labelClass}>
                                    Período de ingreso
                                </dt>
                                <dd className={valueClass}>
                                    {admission.student.period_year}
                                </dd>
                            </div>
                        </dl>

                        <div className="flex flex-col gap-4 border-t border-emerald-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-xl text-[0.7rem] leading-relaxed text-upel-slate">
                                Ingresa con el mismo correo de tu solicitud. Tu
                                contraseña inicial es tu cédula de identidad sin
                                la letra V ni puntos; la primera vez te
                                pediremos definir una contraseña personal.{' '}
                                {admission.student.converted_at
                                    ? `Cuenta creada el ${admission.student.converted_at}.`
                                    : ''}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={admission.student.login_url}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700"
                                >
                                    <LogIn
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Ir al campus
                                </a>
                            </div>
                        </div>
                    </section>
                ) : null}

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-upel-navy/10 bg-white p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy">
                                <UserRound
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Datos de la solicitud
                            </h2>

                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className={labelClass}>Carrera</dt>
                                    <dd className={valueClass}>
                                        {admission.career ?? '—'}
                                        {admission.career_code
                                            ? ` (${admission.career_code})`
                                            : ''}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>Modalidad</dt>
                                    <dd className={valueClass}>
                                        {admission.modality} ·{' '}
                                        {admission.schedule} · {admission.shift}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Fecha de nacimiento
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.birth_date}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>Correo</dt>
                                    <dd className={valueClass}>
                                        {admission.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>Teléfono</dt>
                                    <dd className={valueClass}>
                                        {admission.phone}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Plantel de bachillerato
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.high_school} ·{' '}
                                        {admission.high_school_year}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Promedio de bachillerato
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.high_school_average} / 20
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Fecha de envío
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.submitted_at ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-2xl border border-upel-navy/10 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy">
                                    <FileText
                                        className="size-4 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    Documentos del expediente
                                </h2>
                                <span className="rounded-full bg-upel-cloud px-2.5 py-1 text-[0.62rem] font-bold text-upel-slate">
                                    {uploadedCount} de {documentTypes.length}{' '}
                                    cargados
                                </span>
                            </div>
                            <p className="mt-2 text-[0.65rem] font-semibold text-upel-slate">
                                Validado: {validatedCount} · Pendiente de
                                revisión: {pendingCount} · Por cargar o
                                corregir: {documentsToUploadCount}
                            </p>

                            <ol
                                role="tablist"
                                aria-label="Documentos del expediente"
                                className="mt-5 grid list-none grid-cols-2 gap-2 sm:grid-cols-4"
                            >
                                {documentTypes.map((type, index) => {
                                    const document = admission.documents.find(
                                        (uploadedDocument) =>
                                            uploadedDocument.type ===
                                            type.value,
                                    );
                                    const isValidated =
                                        document?.status === 'validado';
                                    const isPending =
                                        document?.status === 'pendiente';
                                    const isRejected =
                                        document?.status === 'rechazado';
                                    const isActive = activeType === type.value;
                                    const statusLabel = isRejected
                                        ? 'Rechazado · debes cargarlo de nuevo'
                                        : (document?.status_label ??
                                          'Por cargar');

                                    return (
                                        <li
                                            key={type.value}
                                            role="presentation"
                                        >
                                            <button
                                                id={`admission-document-tab-${type.value}`}
                                                type="button"
                                                role="tab"
                                                aria-selected={isActive}
                                                aria-controls="selected-admission-document"
                                                onClick={() =>
                                                    selectDocumentType(
                                                        type.value,
                                                    )
                                                }
                                                className={`flex h-full items-center gap-2 rounded-xl border px-3 py-2 ${
                                                    isActive
                                                        ? 'border-upel-blue bg-blue-50 text-upel-navy ring-2 ring-upel-blue/15'
                                                        : isValidated
                                                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                                                          : isPending
                                                            ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                                                            : isRejected
                                                              ? 'border-red-200 bg-red-50/70 text-red-900'
                                                              : 'border-upel-navy/10 bg-upel-cloud/50 text-upel-slate'
                                                }`}
                                            >
                                                {isValidated ? (
                                                    <CheckCircle2
                                                        className="size-5 shrink-0 text-emerald-600"
                                                        aria-hidden="true"
                                                    />
                                                ) : isPending ? (
                                                    <Clock3
                                                        className="size-5 shrink-0 text-amber-600"
                                                        aria-hidden="true"
                                                    />
                                                ) : isRejected ? (
                                                    <AlertTriangle
                                                        className="size-5 shrink-0 text-red-600"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <span
                                                        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-extrabold ${
                                                            isActive
                                                                ? 'bg-upel-blue text-white'
                                                                : 'bg-upel-navy/10 text-upel-slate'
                                                        }`}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                )}
                                                <span className="flex flex-col items-start gap-1 text-left">
                                                    <span className="text-[0.62rem] leading-tight font-bold">
                                                        {index + 1}.{' '}
                                                        {type.label}
                                                    </span>
                                                    <span
                                                        className={`text-[0.55rem] leading-tight font-semibold ${
                                                            isValidated
                                                                ? 'text-emerald-700'
                                                                : isPending
                                                                  ? 'text-amber-700'
                                                                  : isRejected
                                                                    ? 'text-red-700'
                                                                    : 'text-upel-slate'
                                                        }`}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>

                            {selectedType && activeType !== null ? (
                                <div
                                    id="selected-admission-document"
                                    role="tabpanel"
                                    aria-labelledby={`admission-document-tab-${selectedType.value}`}
                                    className="mt-4 rounded-xl border border-upel-navy/10 p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-extrabold text-upel-navy">
                                                {activeStep + 1}.{' '}
                                                {selectedType.label}
                                            </p>
                                            <p className="mt-1 text-[0.68rem] leading-relaxed text-upel-slate">
                                                {selectedType.description}
                                            </p>
                                        </div>
                                        {selectedDocument ? (
                                            <ToneBadge
                                                tone={
                                                    selectedDocument.status_tone as Tone
                                                }
                                            >
                                                {selectedDocument.status_label}
                                            </ToneBadge>
                                        ) : (
                                            <span className="rounded-full bg-upel-cloud px-2.5 py-1 text-[0.62rem] font-bold text-upel-slate">
                                                Pendiente de carga
                                            </span>
                                        )}
                                    </div>

                                    {selectedDocument ? (
                                        <div className="mt-3 rounded-lg bg-upel-cloud/60 px-3 py-2.5">
                                            <p className="truncate text-[0.7rem] font-bold text-upel-navy">
                                                {selectedDocument.original_name}
                                            </p>
                                            <p className="mt-0.5 text-[0.65rem] text-upel-slate">
                                                {selectedDocument.size}
                                                {selectedDocument.uploaded_at
                                                    ? ` · ${selectedDocument.uploaded_at}`
                                                    : ''}
                                            </p>
                                        </div>
                                    ) : null}

                                    {selectedDocument?.notes ? (
                                        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.68rem] leading-relaxed text-red-700">
                                            {selectedDocument.notes}
                                        </p>
                                    ) : null}

                                    {selectedDocument?.status ===
                                    'rechazado' ? (
                                        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.68rem] leading-relaxed font-semibold text-red-800">
                                            Debes cargar nuevamente este
                                            documento para que pueda ser
                                            revisado.
                                        </p>
                                    ) : null}

                                    {admission.can_upload ? (
                                        selectedDocument &&
                                        replacingType !== selectedType.value ? (
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReplacingType(
                                                            selectedType.value,
                                                        );
                                                        uploadForm.setData(
                                                            'document',
                                                            null,
                                                        );
                                                        uploadForm.clearErrors();

                                                        if (
                                                            fileInputRef.current !==
                                                            null
                                                        ) {
                                                            fileInputRef.current.value =
                                                                '';
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-extrabold text-white transition-colors hover:bg-upel-navy-800"
                                                >
                                                    <UploadCloud
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Cargar otro / reemplazar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDocument(
                                                            selectedDocument,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[0.68rem] font-bold text-red-600 transition-colors hover:bg-red-50"
                                                >
                                                    <Trash2
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Eliminar documento
                                                </button>
                                            </div>
                                        ) : (
                                            <form
                                                onSubmit={submitUpload}
                                                className="mt-4 space-y-3"
                                            >
                                                <p className="text-[0.68rem] leading-relaxed text-upel-slate">
                                                    {selectedDocument
                                                        ? 'El archivo nuevo sustituirá al anterior y deberá pasar por una nueva revisión.'
                                                        : 'Adjunta este documento para continuar.'}{' '}
                                                    Formato:{' '}
                                                    {selectedType.accept
                                                        .replaceAll('.', '')
                                                        .toUpperCase()}
                                                    . Tamaño máximo 5 MB.
                                                </p>
                                                <div>
                                                    <label
                                                        htmlFor="document_file"
                                                        className={labelClass}
                                                    >
                                                        Archivo
                                                    </label>
                                                    <input
                                                        ref={fileInputRef}
                                                        id="document_file"
                                                        type="file"
                                                        accept={
                                                            selectedType.accept
                                                        }
                                                        onChange={(event) =>
                                                            uploadForm.setData(
                                                                'document',
                                                                event.target
                                                                    .files?.[0] ??
                                                                    null,
                                                            )
                                                        }
                                                        className="mt-1.5 block w-full cursor-pointer rounded-[11px] border border-upel-mist bg-upel-cloud/50 px-3 py-2.5 text-xs font-semibold text-upel-slate file:mr-3 file:rounded-lg file:border-0 file:bg-upel-navy file:px-3 file:py-1.5 file:text-[0.68rem] file:font-bold file:text-white"
                                                    />
                                                    <InputError
                                                        message={
                                                            uploadForm.errors
                                                                .document as
                                                                | string
                                                                | undefined
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            uploadForm.processing ||
                                                            uploadForm.data
                                                                .document ===
                                                                null
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {uploadForm.processing ? (
                                                            <Loader2
                                                                className="size-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <UploadCloud
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        {uploadForm.processing
                                                            ? 'Cargando...'
                                                            : selectedDocument
                                                              ? 'Guardar reemplazo'
                                                              : 'Subir documento'}
                                                    </button>
                                                    {replacingType !== null ? (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                cancelReplacement
                                                            }
                                                            className="rounded-[13px] border border-upel-navy/10 px-4 py-2.5 text-xs font-bold text-upel-slate transition-colors hover:bg-upel-cloud"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </form>
                                        )
                                    ) : null}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                                    <CheckCircle2
                                        className="mx-auto size-6 text-emerald-600"
                                        aria-hidden="true"
                                    />
                                    <p className="mt-2 text-xs font-extrabold text-emerald-900">
                                        Todos los documentos están cargados
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-upel-navy/10 bg-white p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy">
                                <History
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Historial de la solicitud
                            </h2>

                            <ol className="mt-4 space-y-4 border-l border-upel-navy/10 pl-5">
                                {admission.history.map((item) => (
                                    <li key={item.id} className="relative">
                                        <span
                                            className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-upel-blue ring-4 ring-white"
                                            aria-hidden="true"
                                        />
                                        <p className="text-xs font-extrabold text-upel-navy">
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-[0.65rem] font-semibold text-upel-slate">
                                            {item.date ?? '—'} ·{' '}
                                            {item.changed_by}
                                        </p>
                                        {item.note ? (
                                            <p className="mt-1 text-[0.7rem] leading-relaxed text-upel-slate">
                                                {item.note}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        {!admission.can_upload ? (
                            <section className="rounded-2xl border border-upel-navy/10 bg-white p-6 text-center shadow-sm">
                                <LockKeyhole
                                    className="mx-auto size-6 text-upel-slate"
                                    aria-hidden="true"
                                />
                                <p className="mt-2 text-xs font-extrabold text-upel-navy">
                                    Expediente cerrado
                                </p>
                                <p className="mt-1 text-[0.7rem] leading-relaxed text-upel-slate">
                                    Esta solicitud ya no admite cambios en los
                                    documentos. Si necesitas corregir algo,
                                    escribe a admision@upel.edu.ve.
                                </p>
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-upel-navy/10 bg-white p-6 shadow-sm">
                            <h2 className="text-xs font-extrabold text-upel-navy">
                                ¿Necesitas ayuda?
                            </h2>
                            <ul className="mt-3 space-y-2.5 text-[0.7rem] text-upel-slate">
                                <li className="flex items-center gap-2">
                                    <Mail
                                        className="size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    admision@upel.edu.ve
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone
                                        className="size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    +58 212 000 0000
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin
                                        className="mt-0.5 size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    Caracas, Venezuela
                                </li>
                            </ul>
                        </section>

                        <div className="rounded-2xl border border-upel-navy/10 bg-white p-6 shadow-sm">
                            <p className="flex items-center gap-2 text-xs font-extrabold text-upel-navy">
                                <Clock3
                                    className="size-4 text-upel-gold"
                                    aria-hidden="true"
                                />
                                Guarda tu enlace
                            </p>
                            <p className="mt-1 text-[0.7rem] leading-relaxed text-upel-slate">
                                Este enlace firmado te da acceso directo a tu
                                solicitud. No lo compartas con terceros.
                            </p>
                            <Link
                                href={admissionLookup()}
                                className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-upel-blue transition-colors hover:text-upel-navy"
                            >
                                <FileSearch
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Consultar otra solicitud
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

/**
 * Página de seguimiento: muestra el buscador o el expediente firmado.
 */
export default function AdmissionStatus({
    admission,
    documentTypes = [],
}: Props) {
    if (admission === null) {
        return <LookupForm />;
    }

    return (
        <AdmissionDetailView
            admission={admission}
            documentTypes={documentTypes}
        />
    );
}
