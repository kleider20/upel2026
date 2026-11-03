import { Award, BookOpen, CheckCircle2, Clock3, GraduationCap } from 'lucide-react';
import { ToneBadge } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';

export function MiCarreraPensum({ profile, summary, pensum }: StudentDashboardProps) {
  const durationSemesters = profile?.duration_semesters ?? pensum.length;
  const durationYears = durationSemesters / 2;
  const durationLabel = `${durationYears % 1 === 0 ? durationYears : durationYears.toFixed(1)} ${
    durationYears === 1 ? 'año' : 'años'
  } (${durationSemesters} ${durationSemesters === 1 ? 'período' : 'períodos'})`;

  return (
    <div className="space-y-6">
      {/* Información de la carrera */}
      <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-blue/10 px-3 py-1 text-[0.68rem] font-extrabold text-upel-blue uppercase">
              Carrera Activa
            </span>
            <h2 className="font-display mt-2 text-2xl font-bold text-upel-navy dark:text-foreground">
              {profile?.career ?? 'Educación Integral'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Código: {profile?.career_code ?? 'EDPRI'} · Modalidad: <strong className="text-upel-navy dark:text-foreground">{profile?.modality ?? 'Semipresencial'}</strong> · Título: <strong className="text-upel-navy dark:text-foreground">Licenciatura</strong> · Duración: {durationLabel}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-upel-cloud/50 p-4 text-right dark:bg-muted/50">
            <p className="text-[0.65rem] font-bold text-muted-foreground uppercase">Avance del Pénsum</p>
            <p className="font-display text-2xl font-bold text-upel-navy dark:text-foreground">{summary.progress}%</p>
            <p className="text-[0.65rem] font-semibold text-emerald-600">{summary.credits_approved} / {summary.credits_total} U.C.</p>
          </div>
        </div>
      </div>

      {/* Mapa curricular por semestre */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">Mapa Curricular del Pénsum (2019)</h3>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Aprobada</span>
            <span className="flex items-center gap-1.5 text-amber-600"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Cursando</span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-border" /> Pendiente</span>
          </div>
        </div>

        {pensum.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center dark:bg-card">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">No hay materias en el pénsum para esta carrera</p>
          </div>
        ) : (
          pensum.map((group) => (
            <div key={group.semester} className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
              <h4 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-upel-navy uppercase dark:text-foreground border-b border-border pb-3">
                <GraduationCap className="h-4 w-4 text-upel-gold" />
                Período {group.semester}
              </h4>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.subjects.map((sub) => {
                  const isAprobado = sub.status === 'aprobado';
                  const isCursando = sub.status === 'cursando';

                  return (
                    <div
                      key={sub.id}
                      className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        isAprobado
                          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                          : isCursando
                            ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
                            : 'border-border bg-upel-cloud/30 dark:bg-muted/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[0.62rem] font-bold text-muted-foreground">{sub.code}</span>
                          <span className="text-[0.65rem] font-extrabold text-upel-navy dark:text-foreground">{sub.credits} U.C.</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-bold text-upel-navy dark:text-foreground">{sub.name}</p>
                          {sub.is_elective && (
                            <ToneBadge tone="gold" className="px-1.5 py-0.5 text-[0.55rem]">
                              Libre elección
                            </ToneBadge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-2.5 text-[0.68rem] font-semibold">
                        <span className={isAprobado ? 'text-emerald-700 dark:text-emerald-400 font-bold' : isCursando ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-muted-foreground'}>
                          {isAprobado ? `Aprobada (${sub.grade?.toFixed(1)})` : isCursando ? 'Cursando actualmente' : 'Pendiente'}
                        </span>
                        {isAprobado && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {isCursando && <Clock3 className="h-4 w-4 text-amber-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
