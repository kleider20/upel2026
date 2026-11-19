import { Head } from '@inertiajs/react';
import { CalendarDays, Clock3, Download, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { formatTimeRange } from '@/lib/schedule-calendar';

type ScheduleSession = {
    date: string;
    label: string;
    weekday: string;
    starts_at: string;
    ends_at: string;
};

type ScheduleSubject = {
    id: number;
    code: string;
    name: string;
    classroom: string | null;
    sessions: ScheduleSession[];
};

type ProfessorSchedule = {
    id: number;
    career: string;
    career_code: string;
    period: number;
    period_label: string;
    cohort: string;
    study_schedule_label: string;
    modality_label: string;
    subjects: ScheduleSubject[];
};

type Props = {
    schedules: ProfessorSchedule[];
    ics_url: string;
};

/** Horario del docente con fechas, horas y aulas de sus materias asignadas. */
export default function ProfessorSchedulePage({ schedules, ics_url }: Props) {
    const hasSessions = schedules.some((schedule) =>
        schedule.subjects.some((subject) => subject.sessions.length > 0),
    );

    return (
        <>
            <Head title="Mi horario" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Portal Docente"
                    title="Mi horario"
                    description="Fechas, horas y aulas de las materias que tienes asignadas en los horarios publicados."
                    actions={
                        hasSessions ? (
                            <a
                                href={ics_url}
                                className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90"
                            >
                                <Download className="size-3.5" />
                                Descargar calendario (.ics)
                            </a>
                        ) : undefined
                    }
                />

                {!hasSessions ? (
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <EmptyState
                            icon={CalendarDays}
                            title="Sin fechas asignadas"
                            description="Cuando la coordinación publique un horario con tus materias y fechas, aparecerán aquí."
                        />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {schedules.map((schedule) => (
                            <section
                                key={schedule.id}
                                className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                                    <div>
                                        <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                            {schedule.career} ·{' '}
                                            {schedule.career_code}
                                        </p>
                                        <h2 className="mt-1 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                            Período {schedule.period_label} ·
                                            Cohorte {schedule.cohort}
                                        </h2>
                                    </div>
                                    <p className="text-[0.68rem] font-semibold text-muted-foreground">
                                        {schedule.study_schedule_label} ·{' '}
                                        {schedule.modality_label}
                                    </p>
                                </div>

                                <div className="divide-y divide-border">
                                    {schedule.subjects.map((subject) => (
                                        <div key={subject.id} className="p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                                        {subject.name}
                                                    </h3>
                                                    <p className="mt-0.5 font-mono text-[0.65rem] font-bold text-muted-foreground">
                                                        {subject.code}
                                                    </p>
                                                </div>
                                                {subject.classroom ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-foreground">
                                                        <MapPin className="size-3" />
                                                        {subject.classroom}
                                                    </span>
                                                ) : null}
                                            </div>

                                            {subject.sessions.length === 0 ? (
                                                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                                                    Sin fechas registradas.
                                                </p>
                                            ) : (
                                                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {subject.sessions.map(
                                                        (session) => (
                                                            <div
                                                                key={`${subject.id}-${session.date}-${session.starts_at}`}
                                                                className="rounded-xl border border-border/70 bg-upel-cloud/50 p-3 dark:bg-muted/30"
                                                            >
                                                                <p className="text-[0.7rem] font-extrabold text-upel-navy dark:text-foreground">
                                                                    {
                                                                        session.weekday
                                                                    }{' '}
                                                                    {
                                                                        session.label
                                                                    }
                                                                </p>
                                                                <p className="mt-1 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground">
                                                                    <Clock3 className="size-3" />
                                                                    {formatTimeRange(
                                                                        session.starts_at,
                                                                        session.ends_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
