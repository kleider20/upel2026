import { Clock, TableProperties } from 'lucide-react';
import { ScheduleTable } from '@/components/student/modules/MiHorario';
import type { StudentScheduleData } from '@/types/student';

type Props = {
    schedule: StudentScheduleData;
};

/**
 * Vista previa del formato oficial del horario para el portal administrativo.
 */
export function SchedulePreview({ schedule }: Props) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
            <div className="border-b border-border px-5 py-4 text-center">
                <p className="text-[0.68rem] font-bold tracking-wide text-upel-navy uppercase dark:text-foreground">
                    Universidad Pedagógica Experimental Libertador
                </p>
                <p className="text-[0.62rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Instituto de Mejoramiento Profesional del Magisterio ·
                    Coordinación de Docencia
                </p>
                <p className="text-[0.62rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Extensión Académica La Guaira
                </p>
                <h1 className="mt-2 text-sm font-bold text-upel-navy sm:text-base dark:text-foreground">
                    {schedule.title}
                </h1>

                <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
                    <span>
                        Especialidad:{' '}
                        <strong className="text-upel-navy dark:text-foreground">
                            {schedule.career}
                        </strong>
                    </span>
                    <span>
                        Período:{' '}
                        <strong className="text-upel-navy dark:text-foreground">
                            {schedule.period}
                        </strong>
                    </span>
                    <span>
                        Cohorte:{' '}
                        <strong className="text-upel-navy dark:text-foreground">
                            {schedule.cohort}
                        </strong>
                    </span>
                    <span>
                        Horario:{' '}
                        <strong className="text-upel-navy dark:text-foreground">
                            {schedule.schedule_label}
                        </strong>
                    </span>
                </div>
            </div>

            <div className="space-y-6 px-4 py-5">
                {schedule.subjects.length === 0 ||
                schedule.weeks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-upel-cloud text-upel-blue dark:bg-muted">
                            <TableProperties
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </span>
                        <p className="mt-3 text-xs font-bold text-upel-navy dark:text-foreground">
                            La vista previa se construye con tus materias
                        </p>
                        <p className="mt-1 max-w-sm text-[0.68rem] text-muted-foreground">
                            {schedule.weeks.length === 0
                                ? 'Define la fecha de inicio y de finalización para generar los meses, las semanas y las fechas de clase.'
                                : 'Selecciona una carrera, un período y las materias del horario para verlas aparecer aquí.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <ScheduleTable
                            schedule={schedule}
                            subjects={schedule.subjects}
                        />
                        <ScheduleTable
                            schedule={schedule}
                            subjects={schedule.distance_subjects}
                        />
                    </>
                )}
            </div>

            <div className="space-y-1 border-t border-border px-5 py-4 text-[0.68rem] font-bold text-muted-foreground">
                <p className="flex items-start gap-1.5">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-upel-gold" />
                    <span>
                        <strong className="text-upel-navy dark:text-foreground">
                            Horario Presencial
                        </strong>{' '}
                        {schedule.time_slots.join(' ')}
                    </span>
                </p>
                {schedule.distance_schedule !== null && (
                    <p className="pl-5">
                        <span className="font-normal">
                            {schedule.distance_schedule}
                        </span>{' '}
                        {schedule.distance_time !== null && (
                            <strong>{schedule.distance_time}</strong>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}
