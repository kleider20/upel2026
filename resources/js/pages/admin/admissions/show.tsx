import type { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Download,
    FileText,
    GraduationCap,
    History,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ShieldCheck,
    UserCheck,
    UserRound,
    XCircle,
    Trash2,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { index as admissionsIndex } from '@/routes/admin/admissions';
import {
    convert as convertAdmission,
    status as updateAdmissionStatus,
} from '@/routes/admin/admissions';

type AdminDocument = {
    id: number;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    status_tone: string;
    original_name: string;
    size: string;
    mime_type: string | null;
    is_previewable: boolean;
    notes: string | null;
    reviewer: string | null;
    uploaded_at: string | null;
    download_url: string;
    preview_url: string;
    review_url: string;
};

type HistoryRow = {
    id: number;
    from: string;
    to: string;
    tone: string;
    note: string | null;
    changed_by: string;
    date: string | null;
};

type AdmissionDetail = {
    id: number;
    code: string;
    status: string;
    status_label: string;
    status_tone: string;
    status_description: string;
    full_name: string;
    first_name: string;
    last_name: string;
    nationality: string;
    id_number: string;
    formatted_id_number: string;
    birth_date: string;
    age: number;
    gender: string | null;
    email: string;
    phone: string;
    address: string | null;
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
    reviewed_at: string | null;
    reviewer: string | null;
    review_notes: string | null;
    missing_documents: string[];
    has_complete_documents: boolean;
    can_convert: boolean;
    converted_user: string | null;
    converted_at: string | null;
    edit_url: string;
    delete_url: string;
    documents: AdminDocument[];
    history: HistoryRow[];
};

type Transition = {
    value: string;
    label: string;
};

type DocumentStatusOption = {
    value: string;
    label: string;
};

type Props = {
    admission: AdmissionDetail;
    transitions: Transition[];
    documentStatuses: DocumentStatusOption[];
    can_edit: boolean;
    can_delete: boolean;
};

const labelClass =
    'text-[0.62rem] font-extrabold tracking-wide text-muted-foreground uppercase';
const valueClass = 'mt-0.5 text-sm font-semibold text-foreground';

/**
 * Formulario de revisión de un documento del expediente.
 */
function DocumentReview({
    document,
    statuses,
}: {
    document: AdminDocument;
    statuses: DocumentStatusOption[];
}) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        status: statuses[0]?.value ?? 'validado',
        notes: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch(document.review_url, {
            preserveScroll: true,
            onSuccess: () => reset('notes'),
        });
    };

    return (
        <details className="group mt-3">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Revisar documento
            </summary>

            <form
                onSubmit={submit}
                className="mt-3 space-y-3 rounded-xl bg-upel-cloud/60 p-4 dark:bg-muted/40"
            >
                <div>
                    <label
                        htmlFor={`review-status-${document.id}`}
                        className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                    >
                        Resultado
                    </label>
                    <select
                        id={`review-status-${document.id}`}
                        value={data.status}
                        onChange={(event) =>
                            setData('status', event.target.value)
                        }
                        className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-card"
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor={`review-notes-${document.id}`}
                        className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                    >
                        Observación{' '}
                        {data.status === 'rechazado' ? (
                            <span className="text-red-600">(obligatoria)</span>
                        ) : (
                            <span className="font-medium text-muted-foreground">
                                (opcional)
                            </span>
                        )}
                    </label>
                    <textarea
                        id={`review-notes-${document.id}`}
                        rows={2}
                        value={data.notes}
                        onChange={(event) =>
                            setData('notes', event.target.value)
                        }
                        required={data.status === 'rechazado'}
                        className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-medium text-foreground focus:border-upel-blue focus:outline-none dark:bg-card"
                        placeholder="Explica el motivo del rechazo o deja una nota interna."
                    />
                    <InputError
                        message={errors.notes as string | undefined}
                        className="mt-1 text-[0.68rem]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                >
                    {processing ? (
                        <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                        />
                    ) : (
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                    )}
                    Guardar revisión
                </button>
            </form>
        </details>
    );
}

/**
 * Expediente administrativo de una solicitud de preinscripción.
 */
export default function AdminAdmissionsShow({
    admission,
    transitions,
    documentStatuses,
    can_edit,
    can_delete,
}: Props) {
    const statusForm = useForm({
        status: transitions[0]?.value ?? '',
        note: '',
    });

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        statusForm.patch(
            updateAdmissionStatus.url({ admission: admission.code }),
            {
                preserveScroll: true,
                onSuccess: () => statusForm.reset('note'),
            },
        );
    };

    const handleConvert = () => {
        if (
            !window.confirm(
                `¿Crear la cuenta de estudiante para ${admission.full_name}? Se generará su código y se enviará el correo de acceso.`,
            )
        ) {
            return;
        }

        router.post(
            convertAdmission.url({ admission: admission.code }),
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = () => {
        if (
            !window.confirm(
                `¿Eliminar la solicitud ${admission.code} de ${admission.full_name}? También se borrarán sus documentos privados.`,
            )
        ) {
            return;
        }

        router.delete(admission.delete_url);
    };

    return (
        <>
            <Head title={`Solicitud ${admission.code}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow={`Admisión ${admission.period_year}`}
                    title={admission.full_name}
                    description={`Solicitud ${admission.code} · ${admission.formatted_id_number} · ${admission.career ?? 'Sin carrera'}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <ToneBadge tone={admission.status_tone as Tone}>
                                {admission.status_label}
                            </ToneBadge>
                            {can_edit && admission.converted_user === null ? (
                                <Link
                                    href={admission.edit_url}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                >
                                    <Pencil className="size-3.5" />
                                    Editar
                                </Link>
                            ) : null}
                            {can_delete && admission.converted_user === null ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                                >
                                    <Trash2 className="size-3.5" />
                                    Eliminar
                                </button>
                            ) : null}
                            <Link
                                href={admissionsIndex()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver a la bandeja
                            </Link>
                        </div>
                    }
                />

                {admission.missing_documents.length > 0 ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-relaxed text-amber-900">
                        <AlertTriangle
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            <strong className="font-extrabold">
                                Expediente incompleto:
                            </strong>{' '}
                            falta {admission.missing_documents.join(', ')}. No
                            se puede aprobar hasta recibir todos los documentos
                            obligatorios.
                        </span>
                    </div>
                ) : null}

                {admission.review_notes ? (
                    <div className="rounded-2xl border border-upel-gold/30 bg-upel-gold/8 px-5 py-4 text-xs leading-relaxed text-upel-navy">
                        <strong className="font-extrabold">
                            Última observación:
                        </strong>{' '}
                        {admission.review_notes}
                    </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                <UserRound
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Datos del aspirante
                            </h2>

                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className={labelClass}>Cédula</dt>
                                    <dd className={valueClass}>
                                        {admission.formatted_id_number}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Fecha de nacimiento
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.birth_date} · {admission.age}{' '}
                                        años
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>Género</dt>
                                    <dd className={valueClass}>
                                        {admission.gender ?? 'No indicado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Correo electrónico
                                    </dt>
                                    <dd className={cn(valueClass, 'break-all')}>
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
                                    <dt className={labelClass}>Dirección</dt>
                                    <dd className={valueClass}>
                                        {admission.address ?? '—'}
                                    </dd>
                                </div>
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
                                    <dt className={labelClass}>
                                        Modalidad, horario y turno
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.modality} ·{' '}
                                        {admission.schedule} · {admission.shift}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Plantel de bachillerato
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.high_school}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={labelClass}>
                                        Año de graduación
                                    </dt>
                                    <dd className={valueClass}>
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
                                        Fecha de recepción
                                    </dt>
                                    <dd className={valueClass}>
                                        {admission.submitted_at ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    <FileText
                                        className="size-4 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    Documentos
                                </h2>
                                <span className="rounded-full bg-upel-cloud px-2.5 py-1 text-[0.62rem] font-bold text-muted-foreground dark:bg-muted">
                                    {admission.documents.length} cargados
                                </span>
                            </div>

                            {admission.documents.length === 0 ? (
                                <p className="mt-4 rounded-xl border border-dashed border-border bg-upel-cloud/50 px-4 py-8 text-center text-xs text-muted-foreground dark:bg-muted/30">
                                    El aspirante todavía no ha cargado
                                    documentos.
                                </p>
                            ) : (
                                <ul className="mt-4 space-y-3">
                                    {admission.documents.map((document) => (
                                        <li
                                            key={document.id}
                                            className="rounded-xl border border-border p-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-extrabold text-foreground">
                                                        {document.type_label}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                                                        {document.original_name}{' '}
                                                        · {document.size}
                                                        {document.uploaded_at
                                                            ? ` · ${document.uploaded_at}`
                                                            : ''}
                                                    </p>
                                                    {document.reviewer ? (
                                                        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                            Revisado por{' '}
                                                            {document.reviewer}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <ToneBadge
                                                    tone={
                                                        document.status_tone as Tone
                                                    }
                                                >
                                                    {document.status_label}
                                                </ToneBadge>
                                            </div>

                                            {document.notes ? (
                                                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[0.68rem] leading-relaxed text-red-700">
                                                    {document.notes}
                                                </p>
                                            ) : null}

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <a
                                                    href={document.download_url}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                >
                                                    <Download
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Descargar
                                                </a>

                                                {document.is_previewable ? (
                                                    <a
                                                        href={
                                                            document.preview_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted"
                                                    >
                                                        Abrir en pestaña
                                                    </a>
                                                ) : null}
                                            </div>

                                            <DocumentReview
                                                document={document}
                                                statuses={documentStatuses}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                <History
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Historial
                            </h2>

                            <ol className="mt-4 space-y-4 border-l border-border pl-5">
                                {admission.history.map((item) => (
                                    <li key={item.id} className="relative">
                                        <span
                                            className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-upel-blue ring-4 ring-white dark:ring-card"
                                            aria-hidden="true"
                                        />
                                        <p className="text-xs font-extrabold text-foreground">
                                            {item.to}
                                        </p>
                                        <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                            {item.date ?? '—'} ·{' '}
                                            {item.changed_by}
                                        </p>
                                        {item.note ? (
                                            <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                                                {item.note}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                <CheckCircle2
                                    className="size-4 text-upel-green"
                                    aria-hidden="true"
                                />
                                Estado de la solicitud
                            </h2>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                {admission.status_description}
                            </p>
                            {admission.reviewed_at ? (
                                <p className="mt-2 text-[0.65rem] text-muted-foreground">
                                    Revisada el {admission.reviewed_at}
                                    {admission.reviewer
                                        ? ` por ${admission.reviewer}`
                                        : ''}
                                </p>
                            ) : null}

                            {transitions.length > 0 ? (
                                <form
                                    onSubmit={submitStatus}
                                    className="mt-4 space-y-3 border-t border-border pt-4"
                                >
                                    <div>
                                        <label
                                            htmlFor="new-status"
                                            className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                                        >
                                            Nuevo estado
                                        </label>
                                        <select
                                            id="new-status"
                                            value={statusForm.data.status}
                                            onChange={(event) =>
                                                statusForm.setData(
                                                    'status',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                        >
                                            {transitions.map((transition) => (
                                                <option
                                                    key={transition.value}
                                                    value={transition.value}
                                                >
                                                    {transition.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                statusForm.errors.status as
                                                    | string
                                                    | undefined
                                            }
                                            className="mt-1 text-[0.68rem]"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="status-note"
                                            className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                                        >
                                            Nota{' '}
                                            {[
                                                'observada',
                                                'rechazada',
                                            ].includes(
                                                statusForm.data.status,
                                            ) ? (
                                                <span className="text-red-600">
                                                    (obligatoria)
                                                </span>
                                            ) : (
                                                <span className="font-medium text-muted-foreground">
                                                    (opcional)
                                                </span>
                                            )}
                                        </label>
                                        <textarea
                                            id="status-note"
                                            rows={3}
                                            value={statusForm.data.note}
                                            onChange={(event) =>
                                                statusForm.setData(
                                                    'note',
                                                    event.target.value,
                                                )
                                            }
                                            required={[
                                                'observada',
                                                'rechazada',
                                            ].includes(statusForm.data.status)}
                                            className="w-full rounded-xl border border-border bg-upel-cloud/50 px-3 py-2.5 text-xs font-medium text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                            placeholder="Explica el motivo del cambio. El aspirante recibirá esta nota por correo."
                                        />
                                        <InputError
                                            message={
                                                statusForm.errors.note as
                                                    | string
                                                    | undefined
                                            }
                                            className="mt-1 text-[0.68rem]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={statusForm.processing}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {statusForm.processing ? (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                        Actualizar estado
                                    </button>
                                </form>
                            ) : (
                                <p className="mt-3 rounded-xl bg-upel-cloud px-3 py-2 text-[0.68rem] text-muted-foreground dark:bg-muted/40">
                                    Esta solicitud no tiene más transiciones
                                    manuales.
                                </p>
                            )}
                        </section>

                        {admission.can_convert ? (
                            <section className="rounded-2xl border border-upel-green/30 bg-upel-green/5 p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    <UserCheck
                                        className="size-4 text-upel-green"
                                        aria-hidden="true"
                                    />
                                    Convertir en estudiante
                                </h2>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    Se creará la cuenta con el correo{' '}
                                    <strong className="font-bold text-foreground">
                                        {admission.email}
                                    </strong>
                                    , el rol Estudiante y su expediente
                                    académico. También se enviará el enlace para
                                    definir la contraseña.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleConvert}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-upel-green px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-green/90"
                                >
                                    <GraduationCap
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Crear cuenta de estudiante
                                </button>
                            </section>
                        ) : null}

                        {admission.converted_user ? (
                            <section className="rounded-2xl border border-upel-blue/20 bg-upel-blue/5 p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    <UserCheck
                                        className="size-4 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    Estudiante generado
                                </h2>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {admission.converted_user}
                                    {admission.converted_at
                                        ? ` · ${admission.converted_at}`
                                        : ''}
                                </p>
                            </section>
                        ) : null}

                        {admission.status === 'rechazada' ? (
                            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-red-800">
                                    <XCircle
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Solicitud rechazada
                                </h2>
                                <p className="mt-2 text-xs leading-relaxed text-red-700">
                                    El aspirante fue notificado. No se puede
                                    convertir en estudiante.
                                </p>
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <h2 className="text-xs font-extrabold text-foreground">
                                Contacto rápido
                            </h2>
                            <ul className="mt-3 space-y-2.5 text-[0.7rem] text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <Mail
                                        className="size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    <a
                                        href={`mailto:${admission.email}`}
                                        className="break-all hover:text-upel-navy"
                                    >
                                        {admission.email}
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone
                                        className="size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    {admission.phone}
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin
                                        className="mt-0.5 size-3.5 shrink-0 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    {admission.address ?? 'Sin dirección'}
                                </li>
                            </ul>
                        </section>
                    </aside>
                </div>
            </div>
        </>
    );
}
