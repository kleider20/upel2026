import { Award, BookOpen, CheckCircle2, ClipboardList, Download, TrendingUp } from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';

export function MisCalificaciones({ profile, summary, enrollments }: StudentDashboardProps) {
  const handleDownload = () => {
    alert('Generando constancia de notas en PDF (Demo)...');
  };

  function formatScore(score: number | null): string {
    if (score === null) return '—';
    return score.toFixed(1).replace('.', ',');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:bg-card">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-gold/15 px-3 py-1 text-[0.68rem] font-extrabold text-[#8a6c0d] dark:bg-upel-gold/20 dark:text-upel-gold-light">
            Escala 1–20 · Mín. aprobatoria 10
          </span>
          <h2 className="font-display mt-2 text-xl font-bold text-upel-navy dark:text-foreground">
            Mis Calificaciones y Récord Académico
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Expediente: {profile?.student_code ?? 'S/N'} · Carrera: {profile?.career ?? '—'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-upel-navy-800"
        >
          <Download className="h-4 w-4" />
          Descargar Récord Certificado
        </button>
      </div>

      {/* Stats superiores */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
          <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">Promedio general acumulado</p>
          <p className="font-display mt-2 text-3xl font-bold text-upel-navy dark:text-foreground">
            {summary.average !== null ? summary.average.toFixed(1).replace('.', ',') : '—'} <span className="text-sm font-semibold text-muted-foreground">/ 20</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
          <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">Materias Aprobadas</p>
          <p className="font-display mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.approved_count} <span className="text-sm font-semibold text-muted-foreground">/ {summary.subjects_count}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-card">
          <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">Créditos Aprobados</p>
          <p className="font-display mt-2 text-3xl font-bold text-upel-blue">
            {summary.credits_approved} <span className="text-sm font-semibold text-muted-foreground">U.C.</span>
          </p>
        </div>
      </div>

      {/* Tabla detallada de notas */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">Desglose por evaluaciones (Cortes 1, 2, 3 y Final)</h3>
          <p className="text-xs text-muted-foreground">El promedio de cada materia se calcula promediando los 4 cortes evaluativos.</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">No hay calificaciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider">Materia</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">Sem.</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">1er Corte</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">2do Corte</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">3er Corte</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">Final</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider text-center">Promedio</th>
                  <th className="px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider">Condición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-upel-cloud/40 dark:hover:bg-muted/30">
                    <td className="px-5 py-4 font-bold text-upel-navy dark:text-foreground">
                      {item.subject}
                      <span className="block text-[0.65rem] font-semibold text-muted-foreground">{item.code} · {item.credits ?? 3} U.C.</span>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-muted-foreground">{item.semester}°</td>
                    <td className="px-5 py-4 text-center font-semibold">{formatScore(item.n1)}</td>
                    <td className="px-5 py-4 text-center font-semibold">{formatScore(item.n2)}</td>
                    <td className="px-5 py-4 text-center font-semibold">{formatScore(item.n3)}</td>
                    <td className="px-5 py-4 text-center font-semibold">{formatScore(item.final)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-extrabold text-upel-navy dark:text-foreground text-sm">
                        {formatScore(item.grade)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ToneBadge tone={item.status_tone as Tone}>{item.status_label}</ToneBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
