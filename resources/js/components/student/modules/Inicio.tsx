import { Link } from '@inertiajs/react';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';
import type { StudentTab } from '../Sidebar';

type InicioProps = StudentDashboardProps & {
  userName: string;
  onSelectTab: (tab: StudentTab) => void;
};

export function Inicio({ userName, profile, admission, summary, enrollments, active_period, onSelectTab }: InicioProps) {
  const firstName = userName.split(' ')[0];
  const activeEnrollments = enrollments.filter((e) => e.status === 'cursando' || e.status === 'inscrito');

  return (
    <div className="space-y-6">
      {/* Banner de bienvenida */}
      <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-6 text-white shadow-xl sm:p-8">
        <div className="upel-grid absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-16 -right-16 h-60 w-60 rounded-full bg-upel-gold/20 blur-[70px]" aria-hidden="true" />
        
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[0.68rem] font-bold tracking-widest text-upel-gold-light uppercase backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Portal Estudiantil UPEL
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              ¡Hola, {firstName}! 👋
            </h2>
            <p className="mt-1.5 text-sm text-white/75 max-w-xl leading-relaxed">
              Expediente: <strong className="text-white">{profile?.student_code ?? 'S/N'}</strong> · {profile?.career ?? 'Carrera no asignada'} · Período {profile?.current_semester ?? '—'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('calificaciones')}
              className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-upel-gold-light"
            >
              <Award className="h-4 w-4" />
              Ver Calificaciones
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('tramites')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <FileText className="h-4 w-4" />
              Solicitar Trámite
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de la solicitud de admisión */}
      {admission ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-sm dark:bg-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-upel-cloud text-upel-blue dark:bg-muted">
              <FileSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                Mi solicitud de admisión
              </p>
              <p className="font-display mt-0.5 text-sm font-bold text-upel-navy dark:text-foreground">
                {admission.code} · {admission.career ?? 'Carrera no asignada'}
              </p>
              <p className="mt-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                Período {admission.period_year} · Enviada el {admission.submitted_at ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ToneBadge tone={admission.status_tone as Tone}>
              {admission.status_label}
            </ToneBadge>
            <button
              type="button"
              onClick={() => onSelectTab('solicitud')}
              className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Ver expediente
            </button>
          </div>
        </section>
      ) : null}

      {/* Tarjetas de estadísticas (4 cards) */}
      <section aria-label="Estadísticas académicas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Promedio general</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-upel-gold">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="font-display mt-4 text-3xl font-bold text-upel-navy dark:text-foreground">
            {summary.average !== null ? summary.average.toFixed(1).replace('.', ',') : '—'} <span className="text-sm font-semibold text-muted-foreground">/ 20</span>
          </p>
          <p className="mt-2 text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>Escala 1–20 · Mín. aprobatoria 10</span>
          </p>
        </div>

        <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Créditos aprobados</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="font-display mt-4 text-3xl font-bold text-upel-navy dark:text-foreground">
            {summary.credits_approved} <span className="text-sm font-semibold text-muted-foreground">/ {summary.credits_total} U.C.</span>
          </p>
          <p className="mt-2 text-[0.7rem] font-semibold text-muted-foreground">
            Progreso del pénsum acreditado
          </p>
        </div>

        <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Materias aprobadas</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <p className="font-display mt-4 text-3xl font-bold text-upel-navy dark:text-foreground">
            {summary.approved_count} <span className="text-sm font-semibold text-muted-foreground">/ {summary.subjects_count}</span>
          </p>
          <p className="mt-2 text-[0.7rem] font-semibold text-muted-foreground">
            {summary.pending_count} materias cursando en el período
          </p>
        </div>

        <div className="group rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Período actual</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </span>
          </div>
          <p className="font-display mt-4 text-3xl font-bold text-upel-navy dark:text-foreground">
            {profile?.current_semester ?? '—'}° <span className="text-sm font-semibold text-muted-foreground">Período</span>
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
                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Avance curricular</p>
                <h3 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">Progreso general del Pénsum</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-300">
                {summary.progress}% completado
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-upel-mist dark:bg-muted">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#12876f,#1e5fa8)] transition-all duration-1000"
                style={{ width: `${Math.min(summary.progress, 100)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span>Has aprobado {summary.credits_approved} de {summary.credits_total} unidades de crédito.</span>
              <button
                type="button"
                onClick={() => onSelectTab('pensum')}
                className="font-bold text-upel-blue hover:underline"
              >
                Ver mapa curricular →
              </button>
            </div>
          </div>

          {/* Mis materias del período actual */}
          <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Período {active_period ?? '2026-II'}</p>
                <h3 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">Mis materias en curso</h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('materias')}
                className="text-xs font-bold text-upel-blue hover:underline"
              >
                Ver todas ({activeEnrollments.length})
              </button>
            </div>

            <div className="mt-4 divide-y divide-border">
              {activeEnrollments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground font-semibold">No tienes materias registradas como cursando actualmente.</p>
              ) : (
                activeEnrollments.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-upel-navy dark:text-foreground">{item.subject}</p>
                      <p className="mt-0.5 text-[0.68rem] text-muted-foreground font-medium">{item.code} · {item.credits} U.C. · Prof. {item.professor ?? 'Por asignar'}</p>
                    </div>
                    <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground">
                      Cursando
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
            <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Timeline</p>
            <h3 className="font-display mt-1 text-lg font-bold text-upel-navy dark:text-foreground">Actividad reciente</h3>

            <div className="mt-5 space-y-4 border-l-2 border-upel-mist pl-4 dark:border-muted">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-upel-gold ring-4 ring-white dark:ring-card" />
                <p className="text-xs font-bold text-upel-navy dark:text-foreground">Notas de Didáctica Especial publicadas</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Hace 2 horas</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-upel-blue ring-4 ring-white dark:ring-card" />
                <p className="text-xs font-bold text-upel-navy dark:text-foreground">Nueva tarea en Tecnología Educativa</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Hace 1 día</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-card" />
                <p className="text-xs font-bold text-upel-navy dark:text-foreground">Acta de Pedagogía General cerrada</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Ayer</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-upel-gold/25 bg-upel-gold/5 p-6">
            <div className="flex items-center gap-2 text-upel-navy dark:text-foreground">
              <CalendarDays className="h-4 w-4 text-upel-gold" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Próximas evaluaciones</h4>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs">
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Evaluación 2 · Pedagogía</span>
                <span className="font-bold text-upel-navy dark:text-foreground">30 Oct</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Entrega Proyecto · T. Educativa</span>
                <span className="font-bold text-upel-navy dark:text-foreground">05 Nov</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
