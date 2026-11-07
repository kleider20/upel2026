import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Eye,
    FileDown,
    Filter,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { type Tone, toneClasses } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    create as schedulesCreate,
    index as schedulesIndex,
} from '@/routes/admin/schedules';

type ScheduleRow = {
    id: number;
    career: string;
    career_code: string;
    period: number;
    period_label: string;
    cohort: string;
    modality_label: string;
    schedule_label: string;
    created_at: string | null;
    show_url: string;
    pdf_url: string;
    delete_url: string;
};

type Stat = {
    label: string;
    value: string;
    tone: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedSchedules = {
    data: ScheduleRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    schedules: PaginatedSchedules;
    filters: {
        search: string | null;
        career_id: number | null;
    };
    careers: { id: number; name: string; code: string }[];
    stats: Stat[];
    can_manage: boolean;
};

/**
 * Listado administrativo de horarios publicados.
 */
export default function AdminSchedulesIndex({
    schedules,
    filters,
    careers,
    stats,
    can_manage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [careerId, setCareerId] = useState(
        filters.career_id !== null ? String(filters.career_id) : '',
    );

    const applyFilters = (nextCareer: string, nextSearch: string) => {
        const params: Record<string, string> = {};

        if (nextSearch.trim() !== '') {
            params.search = nextSearch.trim();
        }

        if (nextCareer !== '') {
            params.career_id = nextCareer;
        }

        router.get(schedulesIndex.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters(careerId, search);
    };

    const clearFilters = () => {
        setSearch('');
        setCareerId('');
        applyFilters('', '');
    };

    const deleteSchedule = (schedule: ScheduleRow) => {
        const confirmed = window.confirm(
            `¿Eliminar el horario ${schedule.cohort} de ${schedule.career}? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(schedule.delete_url, { preserveScroll: true });
    };

    const hasFilters = search.trim() !== '' || careerId !== '';

    return (
        <>
            <Head title="Horarios" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Horarios"
                    description="Publica y consulta los horarios oficiales por carrera, período y cohorte."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={schedulesCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Nuevo horario
                                </Link>
                            ) : null}
                            <Link
                                href={adminDashboard()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver al panel
                            </Link>
                        </div>
                    }
                />

                <section
                    aria-label="Resumen de horarios"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card"
                        >
                            <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                {stat.label}
                            </p>
                            <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                                {stat.value}
                            </p>
                            <span
                                className={cn(
                                    'mt-3 inline-flex h-1.5 w-10 rounded-full',
                                    toneClasses[stat.tone as Tone] ??
                                        toneClasses.blue,
                                )}
                                aria-hidden="true"
                            />
                        </div>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <form
                            onSubmit={submitSearch}
                            className="flex flex-col gap-3 lg:flex-row lg:items-end"
                        >
                            <div className="flex-1">
                                <label
                                    htmlFor="schedule-search"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Buscar
                                </label>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="schedule-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Carrera, código o cohorte"
                                        className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                </div>
                            </div>

                            <div className="lg:w-64">
                                <label
                                    htmlFor="schedule-career"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Carrera
                                </label>
                                <select
                                    id="schedule-career"
                                    value={careerId}
                                    onChange={(event) =>
                                        setCareerId(event.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                >
                                    <option value="">Todas las carreras</option>
                                    {careers.map((career) => (
                                        <option
                                            key={career.id}
                                            value={career.id}
                                        >
                                            {career.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-upel-navy px-4 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800"
                                >
                                    <Filter
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    Filtrar
                                </button>
                                {hasFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-upel-cloud hover:text-upel-navy dark:hover:bg-muted"
                                    >
                                        <X
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        Limpiar
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                        <p className="text-xs text-muted-foreground">
                            {schedules.total === 0
                                ? 'Sin horarios'
                                : `Mostrando ${schedules.from ?? 0}–${schedules.to ?? 0} de ${schedules.total} horarios`}
                        </p>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            Página {schedules.current_page} de{' '}
                            {Math.max(1, schedules.last_page)}
                        </span>
                    </div>

                    {schedules.data.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={CalendarDays}
                                title="Sin horarios"
                                description="Todavía no hay horarios publicados que coincidan con los filtros."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Carrera',
                                            'Período',
                                            'Cohorte',
                                            'Modalidad',
                                            'Tipo',
                                            'Publicado',
                                            'Acciones',
                                        ].map((column) => (
                                            <th
                                                key={column}
                                                scope="col"
                                                className="px-5 py-3 text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
                                            >
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {schedules.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="max-w-[280px] px-5 py-3.5 align-middle">
                                                <p className="text-xs font-bold text-foreground">
                                                    {row.career}
                                                </p>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.career_code}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-upel-navy/5 px-2 py-1 text-xs font-bold text-upel-navy dark:bg-white/10 dark:text-foreground">
                                                    {row.period_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-semibold text-foreground">
                                                {row.cohort}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-upel-blue/5 px-2 py-1 text-xs font-bold text-upel-blue dark:bg-white/10 dark:text-foreground">
                                                    {row.modality_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-upel-navy/5 px-2 py-1 text-xs font-bold text-upel-navy dark:bg-white/10 dark:text-foreground">
                                                    {row.schedule_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-medium text-muted-foreground">
                                                {row.created_at ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={row.show_url}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                    >
                                                        <Eye
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        Ver
                                                    </Link>
                                                    <a
                                                        href={row.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                    >
                                                        <FileDown
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        PDF
                                                    </a>
                                                    {can_manage ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteSchedule(
                                                                    row,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[0.65rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                                        >
                                                            <Trash2
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            Eliminar
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {schedules.links.length > 3 ? (
                        <nav
                            aria-label="Paginación de horarios"
                            className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border px-5 py-4"
                        >
                            {schedules.links.map((link, index) =>
                                link.url === null ? (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[0.68rem] font-bold text-muted-foreground/40"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={cn(
                                            'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[0.68rem] font-bold transition-colors',
                                            link.active
                                                ? 'bg-upel-navy text-white'
                                                : 'border border-border text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted',
                                        )}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </nav>
                    ) : null}
                </section>
            </div>
        </>
    );
}
