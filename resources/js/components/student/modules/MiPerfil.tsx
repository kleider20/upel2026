import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    Download,
    Edit3,
    Eye,
    FileCheck2,
    FileText,
    History,
    Lock,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { Auth } from '@/types';
import type {
    StudentAdmissionDocument,
    StudentDashboardProps,
    StudentDocumentTypeOption,
} from '@/types/student';
import { update as updateProfile } from '@/routes/student/profile';

/**
 * Chip reutilizable para marcar información reservada.
 */
function PrivateChip() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-upel-cloud px-2.5 py-1 text-[0.6rem] font-extrabold tracking-[0.12em] text-upel-navy uppercase ring-1 ring-border dark:bg-muted dark:text-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Privada
        </span>
    );
}

type DocumentRowProps = {
    type: StudentDocumentTypeOption;
    document: StudentAdmissionDocument | null;
    isUploading: boolean;
    onUpload: (type: string, file: File, input: HTMLInputElement) => void;
};

/**
 * Fila del expediente con estado de revisión y opción de recarga.
 */
function DocumentRow({
    type,
    document,
    isUploading,
    onUpload,
}: DocumentRowProps) {
    return (
        <li className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <FileText
                    className="mt-0.5 size-4 shrink-0 text-upel-blue"
                    aria-hidden="true"
                />
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-foreground">
                            {type.label}
                        </p>
                        {document ? (
                            <ToneBadge tone={document.status_tone as Tone}>
                                {document.status_label}
                            </ToneBadge>
                        ) : (
                            <span className="rounded-full bg-upel-cloud px-2.5 py-1 text-[0.6rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                                Sin cargar
                            </span>
                        )}
                    </div>
                    <p className="text-[0.68rem] text-muted-foreground">
                        {type.description}
                    </p>
                    {document ? (
                        <p className="truncate text-[0.68rem] text-muted-foreground">
                            {document.original_name} · {document.size}
                            {document.uploaded_at
                                ? ` · Cargado el ${document.uploaded_at}`
                                : ''}
                        </p>
                    ) : null}
                    {document?.notes ? (
                        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.68rem] font-semibold text-amber-800">
                            Observación: {document.notes}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-7 lg:pl-0">
                {document?.is_previewable ? (
                    <a
                        href={document.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted"
                    >
                        <Eye className="size-3.5" aria-hidden="true" />
                        Ver archivo
                    </a>
                ) : null}
                {document ? (
                    <a
                        href={document.download_url}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                    >
                        <Download className="size-3.5" aria-hidden="true" />
                        Descargar
                    </a>
                ) : null}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-1.5 text-[0.65rem] font-bold text-white transition-colors hover:bg-upel-navy-800">
                    <Upload className="size-3.5" aria-hidden="true" />
                    {isUploading
                        ? 'Cargando...'
                        : document
                          ? 'Reemplazar'
                          : 'Cargar'}
                    <input
                        type="file"
                        accept={type.accept}
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                            const input = event.currentTarget;
                            const file = input.files?.[0];

                            if (file) {
                                onUpload(type.value, file, input);
                            }
                        }}
                    />
                </label>
            </div>
        </li>
    );
}

export function MiPerfil({
    profile,
    admission,
    photo_url,
    document_types,
    documents_upload_url,
    summary,
}: StudentDashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : 'UP';

    const photoDocument =
        admission?.documents.find((document) => document.type === 'foto') ??
        null;

    const documentsByType = new Map(
        (admission?.documents ?? []).map((document) => [
            document.type,
            document,
        ]),
    );

    const [isEditing, setIsEditing] = useState(false);
    const [uploadingType, setUploadingType] = useState<string | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        phone: profile?.phone ?? '',
        personal_email: profile?.personal_email ?? user?.email ?? '',
        address: profile?.address ?? '',
        birth_place: profile?.birth_place ?? '',
        emergency_contact: profile?.emergency_contact ?? '',
    });

    const documentForm = useForm<{
        type: string;
        document: File | null;
    }>({
        type: '',
        document: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(updateProfile.url(), {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const uploadDocument = (
        type: string,
        file: File,
        input: HTMLInputElement,
    ) => {
        documentForm.transform(() => ({ type, document: file }));
        documentForm.post(documents_upload_url, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setUploadingType(type),
            onSuccess: () => {
                input.value = '';
                documentForm.reset();
            },
            onFinish: () => setUploadingType(null),
        });
    };

    const handleDownloadConstancia = () => {
        alert('Generando constancia de estudios en PDF (Demo)...');
    };

    return (
        <div className="space-y-6">
            {/* Hero del perfil */}
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-6 text-white shadow-xl sm:p-8">
                <div
                    className="upel-grid pointer-events-none absolute inset-0 opacity-40"
                    aria-hidden="true"
                />
                <div
                    className="absolute -top-16 -right-16 h-60 w-60 rounded-full bg-upel-gold/20 blur-[70px]"
                    aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="relative">
                            {photo_url ? (
                                <img
                                    src={photo_url}
                                    alt={`Fotografía tipo carnet de ${user?.name ?? 'el estudiante'}`}
                                    className="h-24 w-24 rounded-3xl object-cover shadow-lg ring-4 ring-white/20"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-upel-gold font-display text-3xl font-extrabold text-upel-navy shadow-lg ring-4 ring-white/20">
                                    {initials}
                                </div>
                            )}
                            <span
                                className="absolute -right-2 -bottom-2 inline-flex items-center gap-1 rounded-full bg-upel-navy px-2 py-1 text-[0.55rem] font-bold text-white ring-2 ring-white/40"
                                title="Información privada"
                            >
                                <Lock className="size-2.5" aria-hidden="true" />
                                Privada
                            </span>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.62rem] font-bold text-upel-gold-light uppercase backdrop-blur-md">
                                    Estudiante activo
                                </span>
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[0.62rem] font-bold text-emerald-300 backdrop-blur-md">
                                    ✓ Verificado
                                </span>
                            </div>
                            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                {user?.name ?? 'María Fernández'}
                            </h2>
                            <p className="mt-1 text-xs text-white/75">
                                Expediente:{' '}
                                <strong className="text-white">
                                    {profile?.student_code ?? 'E-2024-00121'}
                                </strong>{' '}
                                · {profile?.career ?? 'Educación Integral'} ·
                                Semestre {profile?.current_semester ?? 5}°
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-upel-gold-light"
                        >
                            <Edit3 className="h-4 w-4" />
                            {isEditing ? 'Cancelar edición' : 'Editar perfil'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadConstancia}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                        >
                            <Download className="h-4 w-4" />
                            Constancia de estudios
                        </button>
                    </div>
                </div>
            </div>

            {/* Aviso de privacidad */}
            <div className="flex items-start gap-3 rounded-2xl border border-upel-blue/25 bg-upel-blue/5 p-4">
                <Lock
                    className="mt-0.5 size-4 shrink-0 text-upel-blue"
                    aria-hidden="true"
                />
                <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
                    <strong className="text-upel-navy dark:text-foreground">
                        Información privada.
                    </strong>{' '}
                    Estos datos solo son visibles para ti y para los roles
                    autorizados con el permiso de consultar información privada
                    de estudiantes. Del perfil solo son públicos tu nombre,
                    fotografía, carrera, período de ingreso, semestre actual,
                    turno y promedio general.
                </p>
            </div>

            {/* Stats chips (4) */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Promedio general
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        {summary.average !== null
                            ? summary.average.toFixed(1).replace('.', ',')
                            : '—'}{' '}
                        <span className="text-xs font-semibold text-muted-foreground">
                            / 20
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Créditos aprobados
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        {summary.credits_approved}{' '}
                        <span className="text-xs font-semibold text-muted-foreground">
                            U.C.
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Materias aprobadas
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        {summary.approved_count} / {summary.subjects_count}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Período de ingreso
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        {profile?.period_year ?? profile?.admission_year ?? '—'}
                    </p>
                </div>
            </div>

            {/* Documentos del expediente */}
            <section className="rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <h3 className="flex items-center gap-2 font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Documentos del Expediente
                            <PrivateChip />
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Revisa si cada archivo fue validado y cárgalo de
                            nuevo cuando lo necesites. La recarga deja el
                            documento pendiente de revisión.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-cloud px-3 py-1 text-[0.62rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                        <FileCheck2 className="size-3.5" aria-hidden="true" />
                        {admission?.documents.length ?? 0} de{' '}
                        {document_types.length} cargados
                    </span>
                </div>

                {documentForm.errors.document ? (
                    <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-[0.7rem] font-semibold text-red-700">
                        {documentForm.errors.document}
                    </p>
                ) : null}

                <ul className="divide-y divide-border">
                    {document_types.map((type) => (
                        <DocumentRow
                            key={type.value}
                            type={type}
                            document={documentsByType.get(type.value) ?? null}
                            isUploading={uploadingType === type.value}
                            onUpload={uploadDocument}
                        />
                    ))}
                </ul>
            </section>

            {/* Historial de la solicitud */}
            {admission?.code ? (
                <section className="rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <div>
                            <h3 className="flex items-center gap-2 font-display text-base font-bold text-upel-navy dark:text-foreground">
                                <History
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Historial de cambios y revisiones
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Seguimiento de tu solicitud {admission.code}:
                                altas, cambios de estado y observaciones sobre
                                tus archivos.
                            </p>
                        </div>
                        <PrivateChip />
                    </div>

                    {admission.history.length > 0 ? (
                        <ol className="m-5 space-y-4 border-l border-border pl-5">
                            {admission.history.map((item) => (
                                <li key={item.id} className="relative">
                                    <span
                                        className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-upel-blue ring-4 ring-white dark:ring-card"
                                        aria-hidden="true"
                                    />
                                    <p className="text-xs font-bold text-foreground">
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                        {item.date ?? '—'} · {item.changed_by}
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
                            Todavía no hay movimientos registrados en tu
                            solicitud.
                        </p>
                    )}
                </section>
            ) : null}

            {/* Grid paneles: Datos personales + Académico y seguridad */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Panel izquierdo: Datos personales (editable/vista) */}
                <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                        <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Datos Personales y de Contacto
                        </h3>
                        <span className="text-xs font-semibold text-muted-foreground">
                            {isEditing ? 'Modo edición' : 'Solo lectura'}
                        </span>
                    </div>

                    {isEditing ? (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                    Teléfono móvil
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                    Correo personal
                                </label>
                                <input
                                    type="email"
                                    value={data.personal_email}
                                    onChange={(e) =>
                                        setData(
                                            'personal_email',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                                />
                                {errors.personal_email && (
                                    <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                        {errors.personal_email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                    Dirección de habitación
                                </label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                                />
                                {errors.address && (
                                    <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                    Lugar de nacimiento
                                </label>
                                <input
                                    type="text"
                                    value={data.birth_place}
                                    onChange={(e) =>
                                        setData('birth_place', e.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                                />
                                {errors.birth_place && (
                                    <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                        {errors.birth_place}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                    Contacto de emergencia
                                </label>
                                <input
                                    type="text"
                                    value={data.emergency_contact}
                                    onChange={(e) =>
                                        setData(
                                            'emergency_contact',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                                />
                                {errors.emergency_contact && (
                                    <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                        {errors.emergency_contact}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl bg-upel-cloud p-3 text-[0.7rem] text-muted-foreground dark:bg-muted">
                                🔒 Por seguridad, los campos de identidad
                                (cédula, nombres, fecha de nacimiento y género)
                                no son editables desde el portal. Contacta a
                                control de estudios si requieres modificarlos.
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-upel-navy px-5 py-2 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Guardando...'
                                        : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <dl className="mt-5 space-y-4 text-xs">
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Nombre completo:
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {admission?.full_name ??
                                        user?.name ??
                                        'María Fernández'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Cédula de identidad:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.id_number ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Nacionalidad:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.nationality ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Fecha de nacimiento:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.birth_date ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Lugar de nacimiento:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {data.birth_place || '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Género:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.gender ?? 'No registrado'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Teléfono:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {data.phone || '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Correo personal:
                                </dt>
                                <dd className="text-right font-bold text-upel-blue">
                                    {data.personal_email || '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Correo institucional:
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {user?.email ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-border/60 pb-2.5">
                                <dt className="text-muted-foreground">
                                    Dirección:
                                </dt>
                                <dd className="max-w-[220px] text-right font-bold text-upel-navy dark:text-foreground">
                                    {data.address || '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Contacto de emergencia:
                                </dt>
                                <dd className="max-w-[220px] text-right font-bold text-upel-navy dark:text-foreground">
                                    {data.emergency_contact || '—'}
                                </dd>
                            </div>
                        </dl>
                    )}
                </div>

                {/* Panel derecho: Fotografía, información académica y seguridad */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                            <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">
                                Fotografía Tipo Carnet
                            </h3>
                            <PrivateChip />
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            {photo_url ? (
                                <img
                                    src={photo_url}
                                    alt={`Fotografía tipo carnet de ${user?.name ?? 'el estudiante'}`}
                                    className="h-28 w-24 shrink-0 rounded-2xl border border-border object-cover shadow-sm"
                                />
                            ) : (
                                <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border bg-upel-cloud/60 text-center text-[0.62rem] font-bold text-muted-foreground uppercase dark:bg-muted">
                                    Sin foto
                                </div>
                            )}
                            <div className="min-w-0 space-y-2 text-xs">
                                <p className="text-muted-foreground">
                                    {photo_url
                                        ? 'Imagen cargada en tu expediente de admisión; se usa como avatar del portal estudiantil.'
                                        : 'Aún no has cargado una fotografía tipo carnet en tu expediente de admisión.'}
                                </p>
                                {photoDocument && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ToneBadge
                                            tone={
                                                photoDocument.status_tone as Tone
                                            }
                                        >
                                            {photoDocument.status_label}
                                        </ToneBadge>
                                        {photoDocument.uploaded_at && (
                                            <span className="text-[0.68rem] font-semibold text-muted-foreground">
                                                Cargada el{' '}
                                                {photoDocument.uploaded_at}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-[0.68rem] text-muted-foreground">
                                    Puedes actualizarla desde la sección
                                    «Documentos del Expediente».
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <h3 className="border-b border-border pb-4 font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Información Académica
                        </h3>
                        <dl className="mt-4 space-y-3.5 text-xs">
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Expediente:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.student_code ?? 'E-2024-00121'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Carrera:
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {profile?.career ?? 'Educación Integral'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Período de ingreso:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.period_year ??
                                        profile?.admission_year ??
                                        '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Semestre actual:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.current_semester ?? '—'}°
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Turno:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.shift ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Modalidad:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.modality ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Horario de estudio:
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {admission?.schedule ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Estado académico:
                                </dt>
                                <dd>
                                    <ToneBadge
                                        tone={
                                            (profile?.status_tone ??
                                                'green') as Tone
                                        }
                                    >
                                        {profile?.status_label ?? 'Activo'}
                                    </ToneBadge>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Asesor académico:
                                </dt>
                                <dd className="text-right font-bold text-upel-blue">
                                    {profile?.advisor ?? 'Por asignar'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Solicitud de admisión:
                                </dt>
                                <dd className="font-bold text-upel-blue">
                                    {admission?.code ??
                                        profile?.admission_code ??
                                        '—'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <h3 className="border-b border-border pb-4 font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Datos de Preinscripción
                        </h3>
                        <dl className="mt-4 space-y-3.5 text-xs">
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Plantel de bachillerato:
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {admission?.high_school ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Año de graduación:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {admission?.high_school_year ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Promedio de bachillerato:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {admission?.high_school_average ?? '—'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Estado de la solicitud:
                                </dt>
                                <dd>
                                    {admission?.status_label ? (
                                        <ToneBadge
                                            tone={admission.status_tone as Tone}
                                        >
                                            {admission.status_label}
                                        </ToneBadge>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Fecha de postulación:
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {admission?.submitted_at ?? '—'}
                                </dd>
                            </div>
                        </dl>

                        {admission?.review_notes ? (
                            <p className="mt-4 rounded-xl bg-upel-cloud p-3 text-[0.7rem] text-muted-foreground dark:bg-muted">
                                <strong className="text-upel-navy dark:text-foreground">
                                    Observaciones de revisión:
                                </strong>{' '}
                                {admission.review_notes}
                            </p>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <h3 className="border-b border-border pb-4 font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Seguridad de la Cuenta
                        </h3>
                        <div className="mt-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Correo institucional:
                                </span>
                                <span className="font-bold text-upel-navy dark:text-foreground">
                                    {user?.email}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Rol de acceso:
                                </span>
                                <span className="font-bold text-upel-blue uppercase">
                                    Estudiante
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Estado de verificación:
                                </span>
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                    <ShieldCheck className="h-4 w-4" /> 2FA
                                    Activado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
