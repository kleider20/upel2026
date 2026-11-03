import { useState } from 'react';
import { BookOpen, GraduationCap, Search, UserRound } from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';

export function MisMaterias({ enrollments }: StudentDashboardProps) {
  const [semesterFilter, setSemesterFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const semesters = Array.from(new Set(enrollments.map((e) => e.semester).filter(Boolean))).sort(
    (a, b) => (a as number) - (b as number),
  );

  const filtered = enrollments.filter((item) => {
    const matchesSemester = semesterFilter === 'todos' || String(item.semester) === semesterFilter;
    const matchesSearch =
      !search ||
      (item.subject?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.professor?.toLowerCase() || '').includes(search.toLowerCase());

    return matchesSemester && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:bg-card">
        <div>
          <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Expediente académico</p>
          <h2 className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            Mis Materias Inscritas ({enrollments.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar materia o profesor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pl-9 pr-4 text-xs font-semibold text-upel-navy placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/50 dark:text-foreground sm:w-64"
            />
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-bold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted/50 dark:text-foreground"
          >
            <option value="todos">Todos los semestres</option>
            {semesters.map((sem) => (
              <option key={sem} value={String(sem)}>
                Semestre {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-white p-12 text-center dark:bg-card">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">No se encontraron materias</p>
            <p className="mt-1 text-xs text-muted-foreground">Intenta ajustar los filtros de búsqueda o semestre.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-lg bg-upel-cloud px-2.5 py-1 text-[0.65rem] font-extrabold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground">
                    {item.code}
                  </span>
                  <ToneBadge tone={item.status_tone as Tone}>{item.status_label}</ToneBadge>
                </div>

                <h3 className="font-display mt-3.5 text-base font-bold text-upel-navy dark:text-foreground">
                  {item.subject}
                </h3>

                <div className="mt-3 space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Semestre:</span>
                    <span className="font-bold text-upel-navy dark:text-foreground">{item.semester}°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Unidades de Crédito:</span>
                    <span className="font-bold text-upel-navy dark:text-foreground">{item.credits ?? 3} U.C.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Modalidad:</span>
                    <span className="font-bold text-upel-blue">{item.modality ?? 'Online'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Período:</span>
                    <span className="font-bold text-upel-navy dark:text-foreground">{item.period ?? '2026-II'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-upel-navy/10 text-upel-navy dark:bg-muted dark:text-foreground">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">Profesor</p>
                  <p className="truncate text-xs font-bold text-upel-navy dark:text-foreground">
                    {item.professor ?? 'Por asignar'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
