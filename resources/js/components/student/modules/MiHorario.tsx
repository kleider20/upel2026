import { Calendar, Clock, Download, Info, Printer } from 'lucide-react';
import { pdf as schedulePdf } from '@/routes/student/schedule';
import type { StudentDashboardProps, StudentScheduleData, StudentScheduleSubject } from '@/types/student';

const MONTH_COLORS: Record<string, string> = {
  octubre: '#c0e6f5',
  noviembre: '#fbe2d5',
  diciembre: '#f2ceef',
  enero: '#daf2d0',
  febrero: '#caedfb',
};

const CELL_GRAY = '#808080';
const CELL_RED = '#ff0000';
const CELL_YELLOW = '#ffff00';
const CELL_ORANGE = '#ffc000';

function monthGroups(schedule: StudentScheduleData) {
  return schedule.weeks.reduce<{ month: string; tone: string; weeks: number }[]>((groups, week) => {
    const last = groups[groups.length - 1];

    if (last !== undefined && last.month === week.month) {
      last.weeks += 1;
    } else {
      groups.push({ month: week.month, tone: week.tone, weeks: 1 });
    }

    return groups;
  }, []);
}

function weekHeaderColor(schedule: StudentScheduleData, index: number, row: 'number' | 'date') {
  const week = schedule.weeks[index];

  if (row === 'number') {
    return week.highlight === 'red' ? CELL_RED : CELL_GRAY;
  }

  if (week.highlight === 'red') {
    return CELL_RED;
  }

  if (week.highlight === 'yellow') {
    return CELL_YELLOW;
  }

  return CELL_GRAY;
}

function bodyCellColor(schedule: StudentScheduleData, index: number, presencial: boolean) {
  const week = schedule.weeks[index];

  if (!presencial) {
    return MONTH_COLORS[week.tone] ?? '#ffffff';
  }

  if (week.highlight === 'red') {
    return CELL_RED;
  }

  if (week.highlight === 'yellow') {
    return MONTH_COLORS.febrero;
  }

  return CELL_GRAY;
}

type ScheduleTableProps = {
  schedule: StudentScheduleData;
  subjects: StudentScheduleSubject[];
  presencial: boolean;
};

function ScheduleTable({ schedule, subjects, presencial }: ScheduleTableProps) {
  const splitIndex = schedule.weeks.length >= 8 ? 7 : schedule.weeks.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-[0.62rem] text-black">
        <thead>
          <tr>
            <th colSpan={3} className="border-0 bg-transparent" aria-hidden="true" />
            {monthGroups(schedule).map((group) => (
              <th
                key={`${group.month}-${group.weeks}`}
                colSpan={group.weeks}
                className="border border-black px-1 py-1 text-center font-bold"
                style={{ backgroundColor: MONTH_COLORS[group.tone] ?? '#ffffff' }}
              >
                {group.month}
              </th>
            ))}
          </tr>
          <tr>
            <th
              rowSpan={2}
              className="border border-black bg-white px-1 py-1 text-center font-bold uppercase"
            >
              Código
            </th>
            <th
              rowSpan={2}
              className="border border-black bg-white px-1 py-1 text-center font-bold uppercase"
            >
              Unidad / Eje Curricular
            </th>
            <th className="border border-black bg-white px-1 py-1 text-center font-bold uppercase">Semana</th>
            {schedule.weeks.map((week, index) => (
              <th
                key={`number-${week.week}`}
                className="border border-black px-0.5 py-1 text-center font-normal"
                style={{ backgroundColor: weekHeaderColor(schedule, index, 'number') }}
              >
                {week.week}
              </th>
            ))}
          </tr>
          <tr>
            <th className="border border-black bg-white px-1 py-1 text-center font-bold">Docente / Fecha</th>
            {schedule.weeks.map((week, index) => (
              <th
                key={`date-${week.week}`}
                className="border border-black px-0.5 py-1 text-center font-normal"
                style={{ backgroundColor: weekHeaderColor(schedule, index, 'date') }}
              >
                {week.date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => {
            const isVirtualRow =
              subject.hours.length > 0 && subject.hours.every((hour) => hour === 'Virtual');

            return (
              <tr key={subject.code}>
                <td className="border border-black bg-white px-1 py-1 text-center font-bold whitespace-nowrap">
                  {subject.code}
                </td>
                <td className="border border-black bg-white px-1 py-1 text-center">{subject.name}</td>
                <td className="border border-black bg-white px-1 py-1 text-center whitespace-nowrap">
                  {subject.teacher}
                </td>
                {isVirtualRow ? (
                  <>
                    <td
                      colSpan={splitIndex}
                      className="border border-black px-1 py-1 text-center font-semibold"
                      style={{ backgroundColor: CELL_ORANGE }}
                    >
                      Virtual
                    </td>
                    {splitIndex < schedule.weeks.length && (
                      <td
                        colSpan={schedule.weeks.length - splitIndex}
                        className="border border-black px-1 py-1 text-center font-semibold"
                        style={{ backgroundColor: CELL_ORANGE }}
                      >
                        Virtual
                      </td>
                    )}
                  </>
                ) : (
                  schedule.weeks.map((week, index) => (
                    <td
                      key={`${subject.code}-${week.week}`}
                      className="border border-black px-0.5 py-1 text-center"
                      style={{ backgroundColor: bodyCellColor(schedule, index, presencial) }}
                    >
                      {subject.hours[index] ?? ''}
                    </td>
                  ))
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Horario oficial del período, transcrito del documento de la Coordinación de
 * Docencia y filtrado por el horario de estudio elegido en la preinscripción.
 */
export function MiHorario({ schedule }: StudentDashboardProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center print:hidden dark:bg-card">
        <div>
          <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">Horario de clases</p>
          <h2 className="mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            Mi Horario Académico · Período {schedule.period}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {schedule.weeks.length} semanas · actividades correspondientes a tu horario{' '}
            {schedule.schedule_label.toLowerCase()}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={schedulePdf.url()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Imprimir PDF
          </a>
          <a
            href={`${schedulePdf.url()}?download=1`}
            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 dark:bg-upel-gold dark:text-upel-navy dark:hover:bg-upel-gold-light"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
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
          <p className="text-[0.62rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Extensión Académica La Guaira
          </p>
          <h1 className="mt-2 text-sm font-bold text-upel-navy sm:text-base dark:text-foreground">
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

        <div className="space-y-6 px-4 py-5">
          <ScheduleTable schedule={schedule} subjects={schedule.subjects} presencial />
          <ScheduleTable schedule={schedule} subjects={schedule.distance_subjects} presencial={false} />
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
            <span>
              Solo se muestran las actividades correspondientes a tu horario{' '}
              {schedule.schedule_label.toLowerCase()}. El PDF conserva el formato oficial del horario.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
