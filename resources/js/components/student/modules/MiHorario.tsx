import { Calendar, Clock, Download, Info, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentDashboardProps } from '@/types/student';

/**
 * Horario de actividades presenciales del período, transcrito del horario
 * oficial y filtrado por el horario de estudio elegido en la preinscripción.
 */
export function MiHorario({ schedule }: StudentDashboardProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (schedule === null) {
      return;
    }

    const header = [
      'Código',
      'Unidad / Eje Curricular',
      'Docente',
      ...schedule.weeks.map((week) => `${week.weekday} ${week.date}`),
    ];

    const rows = schedule.subjects.map((subject) => [
      subject.code,
      subject.name,
      subject.teacher,
      ...subject.hours.map((hour) => hour ?? ''),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `horario-${schedule.career}-${schedule.period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (schedule === null) {
    return (
      <div className="rounded-2xl border border-border/80 bg-white p-8 text-center shadow-sm dark:bg-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-upel-cloud text-upel-blue">
          <Calendar className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="font-display mt-4 text-lg font-bold text-upel-navy dark:text-foreground">
          Horario no disponible
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Todavía no se ha publicado el horario para tu carrera y período actual.
        </p>
      </div>
    );
  }

  const monthGroups = schedule.weeks.reduce<{ month: string; weeks: number }[]>(
    (groups, week) => {
      const last = groups[groups.length - 1];

      if (last !== undefined && last.month === week.month) {
        last.weeks += 1;
      } else {
        groups.push({ month: week.month, weeks: 1 });
      }

      return groups;
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center print:hidden dark:bg-card">
        <div>
          <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Horario de clases</p>
          <h2 className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            Mi Horario Académico · Período {schedule.period}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Actividades presenciales correspondientes a tu horario {schedule.schedule_label.toLowerCase()}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 dark:bg-upel-gold dark:text-upel-navy dark:hover:bg-upel-gold-light"
          >
            <Download className="h-4 w-4" />
            Descargar Horario
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none dark:bg-card">
        <div className="border-b border-border px-5 py-4 text-center">
          <p className="text-[0.68rem] font-bold tracking-wide text-upel-navy uppercase dark:text-foreground">
            Universidad Pedagógica Experimental Libertador
          </p>
          <p className="text-[0.62rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Instituto de Mejoramiento Profesional del Magisterio · Coordinación de Docencia
          </p>
          <h1 className="font-display mt-2 text-sm font-bold text-upel-navy sm:text-base dark:text-foreground">
            {schedule.title}
          </h1>

          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
            <span>
              Especialidad: <strong className="text-upel-navy dark:text-foreground">{schedule.career}</strong>
            </span>
            <span>
              Período: <strong className="text-upel-navy dark:text-foreground">{schedule.period}</strong>
            </span>
            <span>
              Cohorte: <strong className="text-upel-navy dark:text-foreground">{schedule.cohort}</strong>
            </span>
            <span>
              Horario: <strong className="text-upel-navy dark:text-foreground">{schedule.schedule_label}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[0.68rem]">
            <thead>
              <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                <th rowSpan={2} className="border border-border px-2 py-2 text-left font-extrabold text-upel-navy dark:text-foreground">
                  Código
                </th>
                <th rowSpan={2} className="border border-border px-2 py-2 text-left font-extrabold text-upel-navy dark:text-foreground">
                  Unidad / Eje Curricular
                </th>
                <th rowSpan={2} className="border border-border px-2 py-2 text-left font-extrabold text-upel-navy dark:text-foreground">
                  Docente
                </th>
                {monthGroups.map((group) => (
                  <th
                    key={group.month}
                    colSpan={group.weeks}
                    className="border border-border px-2 py-1.5 text-center font-extrabold text-upel-blue uppercase"
                  >
                    {group.month}
                  </th>
                ))}
              </tr>
              <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                {schedule.weeks.map((week) => (
                  <th key={week.week} className="border border-border px-2 py-1.5 text-center font-bold text-upel-navy dark:text-foreground">
                    <span className="block text-[0.56rem] font-semibold text-muted-foreground uppercase">Semana {week.week}</span>
                    <span className="block whitespace-nowrap">{week.weekday} {week.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.subjects.map((subject) => (
                <tr key={subject.code} className="odd:bg-white even:bg-upel-cloud/30 dark:odd:bg-card dark:even:bg-muted/20">
                  <td className="border border-border px-2 py-2 font-bold whitespace-nowrap text-upel-navy dark:text-foreground">
                    {subject.code}
                  </td>
                  <td className="border border-border px-2 py-2 font-semibold text-foreground">{subject.name}</td>
                  <td className="border border-border px-2 py-2 whitespace-nowrap text-muted-foreground">{subject.teacher}</td>
                  {subject.hours.map((hour, index) => (
                    <td
                      key={schedule.weeks[index].week}
                      className={cn(
                        'border border-border px-2 py-2 text-center font-bold',
                        hour === 'Virtual'
                          ? 'bg-upel-gold/20 text-[#8a6c0d] dark:text-upel-gold-light'
                          : 'text-upel-navy dark:text-foreground',
                      )}
                    >
                      {hour ?? <span className="font-normal text-muted-foreground/50">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 border-t border-border px-5 py-4 text-[0.68rem] font-semibold text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-upel-gold" />
            <span>
              <strong className="text-upel-navy dark:text-foreground">Horario presencial:</strong>{' '}
              {schedule.time_slots.join(' · ')}
            </span>
          </p>
          {schedule.distance_schedule !== null && <p className="pl-5">{schedule.distance_schedule}</p>}
          <p className="flex items-start gap-1.5 pl-0.5 pt-1">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-upel-blue" />
            <span>Solo se muestran las actividades correspondientes a tu horario {schedule.schedule_label.toLowerCase()}.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
