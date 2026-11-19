import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    FileSearch,
    FileText,
    GraduationCap,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type {
    StudentDashboardProps,
    StudentEnrollmentNotice,
} from '@/types/student';
import { studentTabHrefs } from '../Sidebar';

type InicioProps = StudentDashboardProps & {
    userName: string;
};

const activityDotClasses: Record<string, string> = {
    green: 'bg-emerald-600',
    blue: 'bg-upel-blue',
    gold: 'bg-upel-gold',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    navy: 'bg-upel-navy',
    slate: 'bg-slate-400',
};

export function Inicio({
    userName,
    profile,
    admission,
    summary,
    enrollments,
    recent_activity,
    upcoming_evaluations,
    active_period,
}: InicioProps) {
    const firstName = userName.split(' ')[0];
    const activeEnrollments = enrollments.filter(
        (enrollment) => enrollment.status !== 'retirado',
    );
    const { studentEnrollment } = usePage<{
        studentEnrollment: StudentEnrollmentNotice;
    }>().props;

    return (
        <div className="space-y-6">
            {/* Banner de bienvenida */}
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-6 text-white shadow-xl sm:p-8">
                <div
                    className="upel-grid pointer-events-none absolute inset-0 opacity-40"
                    aria-hidden="true"
                />
                <div
                    className="absolute -top-16 -right-16 h-60 w-60 rounded-full bg-upel-gold/20 blur-[70px]"
                    aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[0.68rem] font-bold tracking-widest text-upel-gold-light uppercase backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5" />
                            Portal Estudiantil UPEL
                        </span>
                        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            ¡Hola, {firstName}! 👋
                        </h2>
                        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/75">
                            Expediente:{' '}
                            <strong className="text-white">
                                {profile?.student_code ?? 'S/N'}
                            </strong>{' '}
                            · {profile?.career ?? 'Carrera no asignada'} ·{' '}
                            Período {profile?.current_semester ?? '—'} ·
                            Cohorte: {profile?.cohort || active_period || '—'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={studentTabHrefs.calificaciones}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-upel-gold-light"
                        >
                            <Award className="h-4 w-4" />
                            Ver Calificaciones
                        </Link>
                        <Link
                            href={studentTabHrefs.tramites}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                        >
                            <FileText className="h-4 w-4" />
                            Solicitar Trámite
                        </Link>
                    </div>
                </div>
            </div>

            {/* Ventana de inscripción de materias */}
            {studentEnrollment.is_open || studentEnrollment.submitted ? (
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[linear-gradient(120deg,#0a2540_0%,#164b7d_100%)] p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-upel-gold-light">
                            <ClipboardCheck
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </span>
                        <div>
                            <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-upel-gold-light uppercase">
                                Inscripción de materias
                            </p>
                            <p className="mt-0.5 font-display text-sm font-bold">
                                {studentEnrollment.is_open
                                    ? `La ventana está abierta hasta el ${studentEnrollment.closes_at}`
                                    : 'Tu inscripción ya fue registrada'}
                            </p>
                            <p className="mt-0.5 text-[0.68rem] font-semibold text-white/70">
                                {studentEnrollment.is_open
                                    ? 'Selecciona las materias de tu siguiente período según tus unidades de crédito.'
                                    : 'Consulta la planilla con las materias inscritas en tu período.'}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={studentTabHrefs.inscripciones}
                        className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy transition-transform hover:-translate-y-0.5 hover:bg-upel-gold-light"
                    >
                        <ClipboardCheck
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                        {studentEnrollment.is_open
                            ? 'Inscribir materias'
                            : 'Ver mi planilla'}
                    </Link>
                </section>
            ) : null}

            {/* Resumen de la solicitud de admisión */}
            {admission ? (
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-upel-cloud text-upel-blue dark:bg-muted">
                            <FileSearch
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </span>
                        <div>
                            <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                                Mi solicitud de admisión
                            </p>
                            <p className="mt-0.5 font-display text-sm font-bold text-upel-navy dark:text-foreground">
                                {admission.code} ·{' '}
                                {admission.career ?? 'Carrera no asignada'}
                            </p>
                            <p className="mt-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                                Período {admission.period_year} · Enviada el{' '}
                                {admission.submitted_at ?? '—'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ToneBadge tone={admission.status_tone as Tone}>
                            {admission.status_label}
                        </ToneBadge>
                        <Link
                            href={studentTabHrefs.solicitud}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800"
                        >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Ver expediente
                        </Link>
                    </div>
                </section>
            ) : null}

            {/* Tarjetas de estadísticas (4 cards) */}
            <section
                aria-label="Estadísticas académicas"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
                    <div className="flex items-center justify-between">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                            Promedio general
                        </p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-upel-gold">
                            <TrendingUp className="h-5 w-5" />
                        </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                        {summary.average !== null
                            ? summary.average.toFixed(1).replace('.', ',')
                            : '—'}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            / 10
                        </span>
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span>Promedio sobre 10 · aprueba con 6 o más</span>
                    </p>
                </div>

                <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
                    <div className="flex items-center justify-between">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                            Créditos aprobados
                        </p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                            <BookOpen className="h-5 w-5" />
                        </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                        {summary.credits_approved}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            / {summary.credits_total} U.C.
                        </span>
                    </p>
                    <p className="mt-2 text-[0.7rem] font-semibold text-muted-foreground">
                        Progreso del pénsum acreditado
                    </p>
                </div>

                <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
                    <div className="flex items-center justify-between">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                            Materias aprobadas
                        </p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                        {summary.approved_count}{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            / {summary.subjects_count}
                        </span>
                    </p>
                    <p className="mt-2 text-[0.7rem] font-semibold text-muted-foreground">
                        {summary.pending_count} materias cursando en el período
                    </p>
                </div>

                <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
                    <div className="flex items-center justify-between">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                            Período actual
                        </p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                        {profile?.current_semester ?? '—'}°{' '}
                        <span className="text-sm font-semibold text-muted-foreground">
                            Período
                        </span>
                    </p>
                    <p className="mt-2 text-[0.7rem] font-semibold text-upel-blue">
                        Período activo: {active_period ?? '2026-II'}
                    </p>
                </div>
            </section>

            {/* Grid inferior: Progreso pénsum + Materias actuales + Actividad reciente */}
            <div className="grid gap-6 xl:grid-cols-3">
                {/* Progreso y materias actuales */}
                <div className="space-y-6 xl:col-span-2">
                    {/* Panel Progreso del pénsum */}
                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                                    Avance curricular
                                </p>
                                <h3 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                    Progreso general del Pénsum
                                </h3>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-300">
                                {summary.progress}% completado
                            </span>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-upel-mist dark:bg-muted">
                            <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#12876f,#1e5fa8)] transition-all duration-1000"
                                style={{
                                    width: `${Math.min(summary.progress, 100)}%`,
                                }}
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>
                                Has aprobado {summary.credits_approved} de{' '}
                                {summary.credits_total} unidades de crédito.
                            </span>
                            <Link
                                href={studentTabHrefs.pensum}
                                className="font-bold text-upel-blue hover:underline"
                            >
                                Ver mapa curricular →
                            </Link>
                        </div>
                    </div>

                    {/* Mis materias del período actual */}
                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                                    Período {active_period ?? '2026-II'}
                                </p>
                                <h3 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                    Mis materias en curso
                                </h3>
                            </div>
                            <Link
                                href={studentTabHrefs.materias}
                                className="text-xs font-bold text-upel-blue hover:underline"
                            >
                                Ver todas ({activeEnrollments.length})
                            </Link>
                        </div>

                        <div className="mt-4 divide-y divide-border">
                            {activeEnrollments.length === 0 ? (
                                <p className="py-6 text-center text-xs font-semibold text-muted-foreground">
                                    No tienes materias registradas como cursando
                                    actualmente.
                                </p>
                            ) : (
                                activeEnrollments.slice(0, 3).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                                {item.subject}
                                            </p>
                                            <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">
                                                {item.code} · {item.credits}{' '}
                                                U.C. · Prof.{' '}
                                                {item.professor ??
                                                    'Por asignar'}
                                            </p>
                                        </div>
                                        <span className="flex shrink-0 items-center gap-2">
                                            {item.definitive !== null ? (
                                                <span className="text-[0.68rem] font-extrabold text-upel-navy dark:text-foreground">
                                                    {item.definitive
                                                        .toFixed(1)
                                                        .replace('.', ',')}{' '}
                                                    / 10
                                                </span>
                                            ) : null}
                                            <ToneBadge
                                                tone={item.status_tone as Tone}
                                            >
                                                {item.status_label}
                                            </ToneBadge>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Actividad reciente y Próximas entregas */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                            Timeline
                        </p>
                        <h3 className="mt-1 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                            Actividad reciente
                        </h3>

                        <div className="mt-5 space-y-4 border-l-2 border-upel-mist pl-4 dark:border-muted">
                            {recent_activity.length === 0 ? (
                                <p className="text-[0.68rem] font-semibold text-muted-foreground">
                                    Todavía no hay actividad registrada en tu
                                    expediente.
                                </p>
                            ) : (
                                recent_activity.map((item) => (
                                    <div key={item.id} className="relative">
                                        <span
                                            className={`absolute top-1 -left-[21px] h-3 w-3 rounded-full ring-4 ring-white dark:ring-card ${
                                                activityDotClasses[item.tone] ??
                                                'bg-upel-blue'
                                            }`}
                                        />
                                        <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                            {item.detail
                                                ? `${item.detail} · `
                                                : ''}
                                            {item.when}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-upel-gold/25 bg-upel-gold/5 p-6">
                        <div className="flex items-center gap-2 text-upel-navy dark:text-foreground">
                            <CalendarDays className="h-4 w-4 text-upel-gold" />
                            <h4 className="text-xs font-bold tracking-wider uppercase">
                                Próximas evaluaciones
                            </h4>
                        </div>
                        {upcoming_evaluations.length === 0 ? (
                            <p className="mt-3 text-[0.68rem] font-semibold text-muted-foreground">
                                No hay evaluaciones pendientes en los planes de
                                tus materias.
                            </p>
                        ) : (
                            <ul className="mt-3 space-y-2.5 text-xs">
                                {upcoming_evaluations.map((evaluation) => (
                                    <li
                                        key={evaluation.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold text-muted-foreground">
                                                {evaluation.title}
                                                {evaluation.code
                                                    ? ` · ${evaluation.code}`
                                                    : ''}
                                            </span>
                                            <span className="block truncate text-[0.62rem] font-medium text-muted-foreground/80">
                                                {evaluation.subject ?? '—'}
                                            </span>
                                        </span>
                                        <span className="shrink-0 font-bold text-upel-navy dark:text-foreground">
                                            {evaluation.scheduled_on}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
