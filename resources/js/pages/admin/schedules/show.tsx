import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Download,
    FileDown,
    Printer,
    Trash2,
} from 'lucide-react';
import { SchedulePreview } from '@/components/admin/schedule-preview';
import { PageHeader } from '@/components/portal/page-header';
import { index as schedulesIndex } from '@/routes/admin/schedules';
import type { StudentScheduleData } from '@/types/student';

type ScheduleMeta = {
    id: number;
    career: string;
    career_code: string;
    period_label: string;
    cohort: string;
    starts_on: string | null;
    ends_on: string | null;
    schedule_label: string;
    created_at: string | null;
};

type Props = {
    schedule: StudentScheduleData;
    meta: ScheduleMeta;
    pdf_url: string;
    delete_url: string;
    can_manage: boolean;
};

/**
 * Detalle de un horario publicado, con el formato oficial y sus descargas.
 */
export default function AdminScheduleShow({
    schedule,
    meta,
    pdf_url,
    delete_url,
    can_manage,
}: Props) {
    const deleteSchedule = () => {
        const confirmed = window.confirm(
            `¿Eliminar el horario ${meta.cohort} de ${meta.career}? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(delete_url);
    };

    return (
        <>
            <Head title={`Horario ${meta.career} ${meta.period_label}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title={`Horario ${meta.period_label} · ${meta.cohort}`}
                    description={`${meta.career} (${meta.career_code}) · ${meta.schedule_label}. Del ${meta.starts_on ?? '—'} al ${meta.ends_on ?? '—'}. Publicado el ${meta.created_at ?? '—'}.`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Imprimir PDF
                            </a>
                            <a
                                href={`${pdf_url}?download=1`}
                                className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Descargar PDF
                            </a>
                            <Link
                                href={schedulesIndex()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver al listado
                            </Link>
                        </div>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            Carrera
                        </p>
                        <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            {meta.career}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            {meta.career_code}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            Período
                        </p>
                        <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            {meta.period_label}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            Período académico
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            Cohorte
                        </p>
                        <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            {meta.cohort}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            Año y momento
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            Actividades
                        </p>
                        <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            {schedule.weeks.length} semanas
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            {schedule.subjects.length} unidades curriculares
                        </p>
                    </div>
                </section>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-upel-blue" />
                        Las dos cuadrículas conservan el formato oficial del
                        documento.
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={`${pdf_url}?download=1`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                        >
                            <FileDown className="size-3.5" aria-hidden="true" />
                            Descargar PDF
                        </a>
                        {can_manage ? (
                            <button
                                type="button"
                                onClick={deleteSchedule}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[0.65rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                            >
                                <Trash2
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Eliminar horario
                            </button>
                        ) : null}
                    </div>
                </div>

                <SchedulePreview schedule={schedule} />
            </div>
        </>
    );
}
