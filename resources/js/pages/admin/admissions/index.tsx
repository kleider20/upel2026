import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, Filter, Inbox, Search, X } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import {
    ToneBadge,
    type Tone,
    toneClasses,
} from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as admissionsIndex } from '@/routes/admin/admissions';

type AdmissionRow = {
    id: number;
    code: string;
    applicant: string;
    id_number: string;
    email: string;
    career: string;
    modality: string;
    average: string;
    status: string;
    status_label: string;
    status_tone: string;
    submitted_at: string | null;
    url: string;
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

type PaginatedAdmissions = {
    data: AdmissionRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    admissions: PaginatedAdmissions;
    filters: {
        status: string | null;
        search: string | null;
    };
    statuses: { value: string; label: string }[];
    stats: Stat[];
};

/**
 * Bandeja administrativa de solicitudes de preinscripción.
 */
export default function AdminAdmissionsIndex({
    admissions,
    filters,
    statuses,
    stats,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = (nextStatus: string, nextSearch: string) => {
        const params: Record<string, string> = {};

        if (nextSearch.trim() !== '') {
            params.search = nextSearch.trim();
        }

        if (nextStatus !== '') {
            params.status = nextStatus;
        }

        router.get(admissionsIndex.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters(status, search);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        applyFilters('', '');
    };

    const hasFilters = search.trim() !== '' || status !== '';

    return (
        <>
            <Head title="Admisiones" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Módulo administrativo"
                    title="Admisiones"
                    description="Revisa las solicitudes de preinscripción, valida documentos y convierte a los aspirantes aprobados en estudiantes."
                    actions={
                        <Link
                            href={adminDashboard()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al panel
                        </Link>
                    }
                />

                <section
                    aria-label="Resumen de admisiones"
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
                                    htmlFor="admission-search"
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
                                        id="admission-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Código, cédula, nombre o correo"
                                        className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                </div>
                            </div>

                            <div className="lg:w-56">
                                <label
                                    htmlFor="admission-status"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Estado
                                </label>
                                <select
                                    id="admission-status"
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        applyFilters(
                                            event.target.value,
                                            search,
                                        );
                                    }}
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                >
                                    <option value="">Todos los estados</option>
                                    {statuses.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
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
                            {admissions.total === 0
                                ? 'Sin solicitudes'
                                : `Mostrando ${admissions.from ?? 0}–${admissions.to ?? 0} de ${admissions.total} solicitudes`}
                        </p>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            Página {admissions.current_page} de{' '}
                            {Math.max(1, admissions.last_page)}
                        </span>
                    </div>

                    {admissions.data.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={Inbox}
                                title="Sin solicitudes"
                                description="No hay solicitudes que coincidan con los filtros seleccionados."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Código',
                                            'Aspirante',
                                            'Cédula',
                                            'Carrera',
                                            'Promedio',
                                            'Estado',
                                            'Recibida',
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
                                    {admissions.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-3.5 align-middle">
                                                <Link
                                                    href={row.url}
                                                    className="text-xs font-extrabold text-upel-blue hover:text-upel-navy"
                                                >
                                                    {row.code}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <p className="text-xs font-bold text-foreground">
                                                    {row.applicant}
                                                </p>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-medium text-foreground">
                                                {row.id_number}
                                            </td>
                                            <td className="max-w-[240px] px-5 py-3.5 align-middle">
                                                <p className="text-xs font-medium text-foreground">
                                                    {row.career}
                                                </p>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.modality}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-bold text-foreground">
                                                {row.average}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <ToneBadge
                                                    tone={
                                                        row.status_tone as Tone
                                                    }
                                                >
                                                    {row.status_label}
                                                </ToneBadge>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-medium text-muted-foreground">
                                                {row.submitted_at ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <Link
                                                    href={row.url}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                >
                                                    <Eye
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Ver
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {admissions.links.length > 3 ? (
                        <nav
                            aria-label="Paginación de solicitudes"
                            className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border px-5 py-4"
                        >
                            {admissions.links.map((link, index) =>
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
