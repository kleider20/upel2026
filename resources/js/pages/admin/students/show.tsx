import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    FolderLock,
    History,
    Loader2,
    Lock,
    Pencil,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import InputError from '@/components/input-error';
import {
    DocumentReview,
    type DocumentStatusOption,
} from '@/components/admin/document-review';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import { module as adminModule } from '@/routes/admin';

type StudentPublic = {
    name: string;
    photo_url: string | null;
    career: string | null;
    period_year: number | null;
    semester: number;
    shift: string | null;
    average: number | null;
};

type StudentPrivate = {
    student_code: string;
    email: string;
    personal_email: string | null;
    phone: string | null;
    address: string | null;
    emergency_contact: string | null;
    birth_date: string | null;
    birth_place: string | null;
    id_number: string | null;
    nationality: string | null;
    gender: string | null;
    status: string;
    status_tone: string;
    advisor: string | null;
    modality: string | null;
    schedule: string | null;
    admission_code: string | null;
    admission_status: string | null;
    admission_status_tone: string | null;
    high_school: string | null;
    high_school_year: number | null;
    high_school_average: string | null;
    review_notes: string | null;
    admission_year: number | null;
    graduation_year: number | null;
};

type StudentDocument = {
    id: number;
    type_label: string;
    status: string;
    status_label: string;
    status_tone: string;
    original_name: string;
    size: string;
    uploaded_at: string | null;
    is_previewable: boolean;
    notes: string | null;
    reviewer: string | null;
    reviewed_at: string | null;
    review_requested: boolean;
    review_action_url: string;
    download_url: string;
    preview_url: string;
};

type StatusTransition = {
    value: string;
    label: string;
};

type StatusUpdate = {
    url: string;
    transitions: StatusTransition[];
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

type Props = {
    student: StudentPublic;
    private: StudentPrivate | null;
    can_view_private: boolean;
    can_manage: boolean;
    can_view_documents: boolean;
    can_update_status: boolean;
    can_review_documents: boolean;
    document_statuses: DocumentStatusOption[];
    status_update: StatusUpdate | null;
    status_description: string | null;
    status_reviewed_at: string | null;
    status_reviewer: string | null;
    history: HistoryRow[];
    document_folder: string | null;
    documents: StudentDocument[];
    edit_url?: string | null;
    delete_url?: string | null;
};

type DataItemProps = {
    label: string;
    value: string | number | null | undefined;
};

/**
 * Par etiqueta/valor de las fichas del expediente.
 */
function DataItem({ label, value }: DataItemProps) {
    return (
        <div>
            <dt className="font-bold text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold text-foreground">
                {value === null || value === undefined || value === ''
                    ? '—'
                    : value}
            </dd>
        </div>
    );
}

export default function StudentProfilePage({
    student,
    private: privateData,
    can_view_private,
    can_manage,
    can_view_documents,
    can_update_status,
    can_review_documents,
    document_statuses,
    status_update,
    status_description,
    status_reviewed_at,
    status_reviewer,
    history,
    document_folder,
    documents,
    edit_url,
    delete_url,
}: Props) {
    const [imageFailed, setImageFailed] = useState(false);

    const statusForm = useForm({
        status: status_update?.transitions[0]?.value ?? '',
        note: '',
    });

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!status_update) {
            return;
        }

        statusForm.patch(status_update.url, {
            preserveScroll: true,
            onSuccess: () => statusForm.reset('note'),
        });
    };

    const pendingReviews = documents.filter(
        (document) => document.review_requested,
    );

    const initials = student.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const deleteStudent = () => {
        if (!delete_url) {
            return;
        }

        if (
            !window.confirm(
                `¿Eliminar permanentemente la cuenta de ${student.name}? También se eliminarán su perfil, inscripciones y pagos. La solicitud de admisión permanecerá como registro histórico.`,
            )
        ) {
            return;
        }

        router.delete(delete_url);
    };

    return (
        <>
            <Head title={`Perfil de ${student.name}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Expediente estudiantil"
                    title={student.name}
                    description={[
                        student.career ?? 'Carrera no asignada',
                        `Semestre ${student.semester}`,
                    ].join(' · ')}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage && edit_url ? (
                                <Link
                                    href={edit_url}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                >
                                    <Pencil className="size-3.5" />
                                    Editar
                                </Link>
                            ) : null}
                            {can_manage && delete_url ? (
                                <button
                                    type="button"
                                    onClick={deleteStudent}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                                >
                                    <Trash2 className="size-3.5" />
                                    Eliminar
                                </button>
                            ) : null}
                            <Link
                                href={adminModule({ module: 'students' })}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Volver a estudiantes
                            </Link>
                        </div>
                    }
                />

                {can_view_documents && pendingReviews.length > 0 ? (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:bg-amber-950/20">
                        <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                <ClipboardCheck
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                    Solicitudes de revisión pendientes
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    El estudiante cargó o reemplazó{' '}
                                    {pendingReviews.length === 1
                                        ? 'un documento que espera'
                                        : `${pendingReviews.length} documentos que esperan`}{' '}
                                    aprobación. Revísalos en la carpeta
                                    documental de este perfil.
                                </p>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {pendingReviews.map((document) => (
                                        <li key={document.id}>
                                            <a
                                                href={`#documento-${document.id}`}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.65rem] font-bold text-amber-800 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 dark:bg-card dark:text-amber-200 dark:ring-amber-900"
                                            >
                                                Revisión {document.type_label}
                                                <ArrowUpRight
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Información pública */}
                <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            <UserRound
                                className="size-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            Perfil público
                        </h2>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-muted-foreground uppercase ring-1 ring-border dark:bg-muted">
                            Visible para todos
                        </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                        {student.photo_url && !imageFailed ? (
                            <img
                                src={student.photo_url}
                                alt={`Fotografía tipo carnet de ${student.name}`}
                                onError={() => setImageFailed(true)}
                                className="h-24 w-24 shrink-0 rounded-2xl border border-border object-cover shadow-sm"
                            />
                        ) : (
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-upel-gold font-display text-2xl font-extrabold text-upel-navy shadow-sm">
                                {initials}
                            </div>
                        )}

                        <dl className="grid flex-1 gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                            <DataItem
                                label="Nombre completo"
                                value={student.name}
                            />
                            <DataItem label="Carrera" value={student.career} />
                            <DataItem
                                label="Período de ingreso"
                                value={student.period_year}
                            />
                            <DataItem
                                label="Semestre actual"
                                value={student.semester}
                            />
                            <DataItem label="Turno" value={student.shift} />
                            <DataItem
                                label="Promedio general"
                                value={
                                    student.average !== null
                                        ? `${student.average.toFixed(1).replace('.', ',')} / 20`
                                        : null
                                }
                            />
                        </dl>
                    </div>
                </section>

                {/* Información privada */}
                {can_view_private && privateData ? (
                    <>
                        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                                <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                                    <Lock
                                        className="size-4 text-upel-blue"
                                        aria-hidden="true"
                                    />
                                    Identidad y contacto
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-upel-cloud px-3 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-upel-navy uppercase ring-1 ring-border dark:bg-muted dark:text-foreground">
                                    <Lock
                                        className="size-3"
                                        aria-hidden="true"
                                    />
                                    Privada
                                </span>
                            </div>
                            <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                                <DataItem
                                    label="Cédula de identidad"
                                    value={privateData.id_number}
                                />
                                <DataItem
                                    label="Nacionalidad"
                                    value={privateData.nationality}
                                />
                                <DataItem
                                    label="Género"
                                    value={privateData.gender}
                                />
                                <DataItem
                                    label="Fecha de nacimiento"
                                    value={privateData.birth_date}
                                />
                                <DataItem
                                    label="Lugar de nacimiento"
                                    value={privateData.birth_place}
                                />
                                <DataItem
                                    label="Correo institucional"
                                    value={privateData.email}
                                />
                                <DataItem
                                    label="Correo personal"
                                    value={privateData.personal_email}
                                />
                                <DataItem
                                    label="Teléfono"
                                    value={privateData.phone}
                                />
                                <DataItem
                                    label="Dirección"
                                    value={privateData.address}
                                />
                                <DataItem
                                    label="Contacto de emergencia"
                                    value={privateData.emergency_contact}
                                />
                            </dl>
                        </section>

                        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <h2 className="border-b border-border pb-4 text-sm font-bold text-upel-navy dark:text-foreground">
                                Datos académicos y de preinscripción
                            </h2>
                            <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                                <DataItem
                                    label="Código de expediente"
                                    value={privateData.student_code}
                                />
                                <div>
                                    <dt className="font-bold text-muted-foreground">
                                        Estado académico
                                    </dt>
                                    <dd className="mt-1">
                                        <ToneBadge
                                            tone={
                                                privateData.status_tone as Tone
                                            }
                                        >
                                            {privateData.status}
                                        </ToneBadge>
                                    </dd>
                                </div>
                                <DataItem
                                    label="Modalidad"
                                    value={privateData.modality}
                                />
                                <DataItem
                                    label="Horario de estudio"
                                    value={privateData.schedule}
                                />
                                <DataItem
                                    label="Asesor académico"
                                    value={privateData.advisor}
                                />
                                <DataItem
                                    label="Período de ingreso"
                                    value={
                                        privateData.admission_year ??
                                        student.period_year
                                    }
                                />
                                <DataItem
                                    label="Año de graduación"
                                    value={privateData.graduation_year}
                                />
                                <DataItem
                                    label="Solicitud de admisión"
                                    value={privateData.admission_code}
                                />
                                <DataItem
                                    label="Plantel de bachillerato"
                                    value={privateData.high_school}
                                />
                                <DataItem
                                    label="Año de bachillerato"
                                    value={privateData.high_school_year}
                                />
                                <DataItem
                                    label="Promedio de bachillerato"
                                    value={privateData.high_school_average}
                                />
                            </dl>

                            {privateData.review_notes ? (
                                <p className="mt-4 rounded-xl bg-upel-cloud p-3 text-[0.7rem] text-muted-foreground dark:bg-muted">
                                    <strong className="text-upel-navy dark:text-foreground">
                                        Observaciones de revisión:
                                    </strong>{' '}
                                    {privateData.review_notes}
                                </p>
                            ) : null}
                        </section>

                        {privateData.admission_code ? (
                            <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                                    <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                                        <CheckCircle2
                                            className="size-4 text-upel-green"
                                            aria-hidden="true"
                                        />
                                        Estado de la solicitud de admisión
                                    </h2>
                                    {privateData.admission_status ? (
                                        <ToneBadge
                                            tone={
                                                (privateData.admission_status_tone ??
                                                    'blue') as Tone
                                            }
                                        >
                                            {privateData.admission_status}
                                        </ToneBadge>
                                    ) : null}
                                </div>

                                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                    {status_description}
                                </p>
                                {status_reviewed_at ? (
                                    <p className="mt-2 text-[0.65rem] text-muted-foreground">
                                        Revisada el {status_reviewed_at}
                                        {status_reviewer
                                            ? ` por ${status_reviewer}`
                                            : ''}
                                    </p>
                                ) : null}

                                {status_update &&
                                status_update.transitions.length > 0 ? (
                                    <form
                                        onSubmit={submitStatus}
                                        className="mt-4 space-y-3 border-t border-border pt-4"
                                    >
                                        <div>
                                            <label
                                                htmlFor="student-status"
                                                className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                                            >
                                                Nuevo estado
                                            </label>
                                            <select
                                                id="student-status"
                                                value={statusForm.data.status}
                                                onChange={(event) =>
                                                    statusForm.setData(
                                                        'status',
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                            >
                                                {status_update.transitions.map(
                                                    (transition) => (
                                                        <option
                                                            key={
                                                                transition.value
                                                            }
                                                            value={
                                                                transition.value
                                                            }
                                                        >
                                                            {transition.label}
                                                        </option>
                                                    ),
                                                )}
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
                                                htmlFor="student-status-note"
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
                                                id="student-status-note"
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
                                                ].includes(
                                                    statusForm.data.status,
                                                )}
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
                                                <ShieldCheck
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            Actualizar estado
                                        </button>
                                    </form>
                                ) : (
                                    <p className="mt-3 rounded-xl bg-upel-cloud px-3 py-2 text-[0.68rem] text-muted-foreground dark:bg-muted/40">
                                        {can_update_status
                                            ? 'Esta solicitud no tiene más transiciones manuales.'
                                            : 'No tienes permiso para actualizar el estado de esta solicitud.'}
                                    </p>
                                )}
                            </section>
                        ) : null}
                    </>
                ) : (
                    <section className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-5 text-xs text-muted-foreground shadow-sm dark:bg-card">
                        <Lock
                            className="mt-0.5 size-4 shrink-0 text-upel-blue"
                            aria-hidden="true"
                        />
                        <p>
                            El resto de la información del estudiante es{' '}
                            <strong className="text-upel-navy dark:text-foreground">
                                privada
                            </strong>
                            . Solo el propio estudiante y los roles con el
                            permiso <strong>students.private.view</strong>{' '}
                            pueden consultarla.
                        </p>
                    </section>
                )}

                {can_view_documents ? (
                    <section
                        id="documentos"
                        className="rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                    >
                        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                            <FolderLock
                                className="size-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            <div>
                                <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    Carpeta documental privada
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {document_folder
                                        ? `Expediente asociado a la cédula ${document_folder}. Solo personal autorizado puede abrir los archivos.`
                                        : 'Este perfil no tiene una solicitud de preinscripción vinculada.'}
                                </p>
                            </div>
                        </div>

                        {document_folder && documents.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {documents.map((document) => (
                                    <li
                                        key={document.id}
                                        id={`documento-${document.id}`}
                                        className="scroll-mt-24 px-5 py-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <FileText
                                                    className="mt-0.5 size-4 shrink-0 text-upel-blue"
                                                    aria-hidden="true"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground">
                                                        {document.type_label}
                                                    </p>
                                                    <p className="mt-1 truncate text-[0.68rem] text-muted-foreground">
                                                        {document.original_name}{' '}
                                                        · {document.size}
                                                        {document.uploaded_at
                                                            ? ` · Cargado el ${document.uploaded_at}`
                                                            : ''}
                                                    </p>
                                                    {document.notes ||
                                                    document.reviewed_at ? (
                                                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                                            {document.reviewed_at
                                                                ? `Revisado el ${document.reviewed_at}`
                                                                : 'Sin revisar'}
                                                            {document.reviewer
                                                                ? ` por ${document.reviewer}`
                                                                : ''}
                                                            {document.notes
                                                                ? ` · ${document.notes}`
                                                                : ''}
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

                                            <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
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
                                                        className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted"
                                                    >
                                                        Ver archivo
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>

                                        {can_review_documents ? (
                                            <DocumentReview
                                                documentId={document.id}
                                                actionUrl={
                                                    document.review_action_url
                                                }
                                                statuses={document_statuses}
                                                defaultOpen={
                                                    document.review_requested
                                                }
                                            />
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : document_folder ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={FileText}
                                    title="Carpeta sin documentos"
                                    description="Todavía no se han cargado documentos para este expediente."
                                />
                            </div>
                        ) : null}
                    </section>
                ) : can_view_private ? (
                    <section className="rounded-2xl border border-border/70 bg-white p-5 text-xs text-muted-foreground shadow-sm dark:bg-card">
                        No tienes el permiso <strong>admissions.view</strong>{' '}
                        para consultar los documentos privados del expediente.
                    </section>
                ) : null}

                {can_view_private && privateData?.admission_code ? (
                    <section className="rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                            <History
                                className="size-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            <div>
                                <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    Historial de la solicitud
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Cambios de estado, cargas y revisiones
                                    registradas en el expediente{' '}
                                    {privateData.admission_code}.
                                </p>
                            </div>
                        </div>

                        {history.length > 0 ? (
                            <ol className="m-5 space-y-4 border-l border-border pl-5">
                                {history.map((item) => (
                                    <li key={item.id} className="relative">
                                        <span
                                            className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-upel-blue ring-4 ring-white dark:ring-card"
                                            aria-hidden="true"
                                        />
                                        <p className="text-xs font-bold text-foreground">
                                            {item.title}
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
                        ) : (
                            <p className="p-5 text-xs text-muted-foreground">
                                Esta solicitud todavía no registra movimientos.
                            </p>
                        )}
                    </section>
                ) : null}
            </div>
        </>
    );
}
