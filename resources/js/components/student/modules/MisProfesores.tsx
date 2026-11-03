import { Mail, UserRound, Users } from 'lucide-react';
import type { StudentDashboardProps } from '@/types/student';

export function MisProfesores({ teachers }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
        <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Cuerpo docente asignado</p>
        <h2 className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
          Mis Profesores ({teachers.length})
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Lista exclusiva de los profesores que dictan las asignaturas en las que te encuentras inscrito.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-white p-12 text-center dark:bg-card">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">No hay profesores asignados</p>
          </div>
        ) : (
          teachers.map((prof) => (
            <div
              key={prof.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-card"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-upel-navy text-sm font-extrabold text-upel-gold shadow-sm">
                    {prof.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">{prof.name}</h3>
                    <p className="text-[0.7rem] font-semibold text-muted-foreground">{prof.academic_title}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <div>
                    <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">Departamento</p>
                    <p className="font-semibold text-upel-navy dark:text-foreground">{prof.department}</p>
                  </div>

                  <div>
                    <p className="text-[0.62rem] font-bold text-muted-foreground uppercase mb-1">Materias que te dicta</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prof.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-full bg-upel-cloud px-2.5 py-0.5 text-[0.650rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <a
                  href={`mailto:${prof.email}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800"
                >
                  <Mail className="h-4 w-4" />
                  Enviar correo institucional
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
