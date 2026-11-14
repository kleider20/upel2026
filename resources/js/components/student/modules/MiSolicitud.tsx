import {
    CheckCircle2,
    ExternalLink,
    FileSearch,
    FileText,
    GraduationCap,
    History,
    School,
    UserRound,
} from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';

/**
 * Expediente de admisión del estudiante: datos personales, récord de
 * bachillerato, documentos e historial de la solicitud que originó su cuenta.
 */
export function MiSolicitud({ admission, profile }: StudentDashboardProps) {
    if (admission === null) {
        return (
            <div className="rounded-2xl border border-border/80 bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-upel-cloud text-upel-blue">
                    <FileSearch className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-upel-navy">
                    Sin solicitud vinculada
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                    Tu cuenta no tiene una solicitud de admisión asociada. Si
                    crees que es un error, contacta a control de estudios.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado de la solicitud */}
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-6 text-white shadow-xl sm:p-8">
                <div
                    className="upel-grid pointer-events-none absolute inset-0 opacity-40"
                    aria-hidden="true"
                />
                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[0.68rem] font-bold tracking-widest text-upel-gold-light uppercase backdrop-blur-md">
                            <FileSearch
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            />
                            Expediente de admisión
                        </span>
                        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Solicitud {admission.code}
                        </h2>
                        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/75">
                            {admission.career ?? 'Carrera no asignada'} ·{' '}
                            {admission.modality} · Período{' '}
                            {admission.period_year}
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-gold px-4 py-1.5 text-xs font-extrabold tracking-widest text-upel-navy uppercase shadow-[0_10px_24px_-12px_rgba(201,162,39,0.9)] ring-2 ring-white/40">
                            <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            />
                            {admission.status_label}
                        </span>
                        <a
                            href={admission.tracking_url}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                        >
                            <ExternalLink
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Ver comprobante
                        </a>
                    </div>
                </div>
            </div>

            {/* Fechas clave */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Enviada
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-upel-navy">
                        {admission.submitted_at ?? '—'}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Revisada
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-upel-navy">
                        {admission.reviewed_at ?? '—'}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Estudiante desde
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-upel-navy">
                        {admission.converted_at ?? '—'}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                        Código de estudiante
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-upel-navy">
                        {profile?.student_code ?? '—'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Datos personales */}
                <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 border-b border-border pb-4 font-display text-base font-bold text-upel-navy">
                        <UserRound
                            className="h-4 w-4 text-upel-blue"
                            aria-hidden="true"
                        />
                        Datos personales
                    </h3>
                    <dl className="mt-4 space-y-3 text-xs">
                        <Row
                            label="Nombre completo"
                            value={admission.full_name}
                        />
                        <Row
                            label="Cédula de identidad"
                            value={admission.formatted_id_number}
                        />
                        <Row
                            label="Fecha de nacimiento"
                            value={`${admission.birth_date} · ${admission.age} años`}
                        />
                        <Row label="Género" value={admission.gender} />
                        <Row
                            label="Nacionalidad"
                            value={admission.nationality}
                        />
                        <Row label="Correo" value={admission.email} />
                        <Row label="Teléfono" value={admission.phone} />
                        <Row label="Dirección" value={admission.address} last />
                    </dl>
                </div>

                {/* Datos académicos */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
                        <h3 className="flex items-center gap-2 border-b border-border pb-4 font-display text-base font-bold text-upel-navy">
                            <GraduationCap
                                className="h-4 w-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            Datos académicos
                        </h3>
                        <dl className="mt-4 space-y-3 text-xs">
                            <Row label="Carrera" value={admission.career} />
                            <Row
                                label="Código de carrera"
                                value={admission.career_code}
                            />
                            <Row label="Modalidad" value={admission.modality} />
                            <Row label="Horario" value={admission.schedule} />
                            <Row label="Turno" value={admission.shift} />
                            <Row
                                label="Período de ingreso"
                                value={String(admission.period_year)}
                                last
                            />
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
                        <h3 className="flex items-center gap-2 border-b border-border pb-4 font-display text-base font-bold text-upel-navy">
                            <School
                                className="h-4 w-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            Récord de bachillerato
                        </h3>
                        <dl className="mt-4 space-y-3 text-xs">
                            <Row
                                label="Plantel"
                                value={admission.high_school}
                            />
                            <Row
                                label="Año de graduación"
                                value={
                                    admission.high_school_year !== null
                                        ? String(admission.high_school_year)
                                        : null
                                }
                            />
                            <Row
                                label="Promedio"
                                value={`${admission.high_school_average} pts.`}
                                last
                            />
                        </dl>
                    </div>
                </div>
            </div>

            {/* Documentos */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-upel-navy">
                        <FileText
                            className="h-4 w-4 text-upel-blue"
                            aria-hidden="true"
                        />
                        Documentos del expediente
                    </h3>
                    <span className="text-[0.68rem] font-bold text-muted-foreground">
                        {admission.documents.length} archivo
                        {admission.documents.length === 1 ? '' : 's'}
                    </span>
                </div>

                {admission.documents.length === 0 ? (
                    <p className="px-6 py-8 text-center text-xs font-semibold text-muted-foreground">
                        La solicitud no tiene documentos cargados.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {admission.documents.map((document) => (
                            <li
                                key={document.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-upel-cloud text-upel-blue">
                                        <FileText
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-upel-navy">
                                            {document.type_label}
                                        </p>
                                        <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                                            {document.original_name ??
                                                'Archivo'}{' '}
                                            · {document.size}
                                            {document.uploaded_at
                                                ? ` · ${document.uploaded_at}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <ToneBadge tone={document.status_tone as Tone}>
                                    {document.status_label}
                                </ToneBadge>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Historial */}
            <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 border-b border-border pb-4 font-display text-base font-bold text-upel-navy">
                    <History
                        className="h-4 w-4 text-upel-blue"
                        aria-hidden="true"
                    />
                    Historial de la solicitud
                </h3>

                {admission.history.length === 0 ? (
                    <p className="mt-4 text-xs font-semibold text-muted-foreground">
                        Todavía no hay cambios registrados.
                    </p>
                ) : (
                    <ol className="mt-5 space-y-4 border-l-2 border-upel-mist pl-4">
                        {admission.history.map((entry) => (
                            <li key={entry.id} className="relative">
                                <span
                                    className="absolute top-1 -left-[21px] h-3 w-3 rounded-full bg-upel-gold ring-4 ring-white"
                                    aria-hidden="true"
                                />
                                <p className="text-xs font-bold text-upel-navy">
                                    {entry.title}
                                </p>
                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                    {entry.date ?? '—'} · {entry.changed_by}
                                </p>
                                {entry.from !== entry.to ? (
                                    <p className="mt-0.5 text-[0.65rem] font-semibold text-upel-slate">
                                        {entry.from} → {entry.to}
                                    </p>
                                ) : null}
                                {entry.note ? (
                                    <p className="mt-1 rounded-lg bg-upel-cloud px-3 py-2 text-[0.68rem] leading-relaxed text-upel-slate">
                                        {entry.note}
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {admission.review_notes ? (
                <div className="rounded-2xl border border-upel-gold/30 bg-upel-gold/5 p-5">
                    <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-upel-navy uppercase">
                        Observaciones de admisión
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-upel-slate">
                        {admission.review_notes}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

function Row({
    label,
    value,
    last = false,
}: {
    label: string;
    value: string | null;
    last?: boolean;
}) {
    return (
        <div
            className={
                last
                    ? 'flex justify-between gap-4'
                    : 'flex justify-between gap-4 border-b border-border/60 pb-2.5'
            }
        >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="max-w-[60%] text-right font-bold text-upel-navy">
                {value ?? '—'}
            </dd>
        </div>
    );
}
