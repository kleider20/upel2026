import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Filter,
    Library,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import {
    ToneBadge,
    type Tone,
    toneClasses,
} from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    create as careersCreate,
    index as careersIndex,
} from '@/routes/admin/careers';

type CareerOffering = {
    id: number;
    modality: string;
    modality_label: string;
    schedule: string;
    schedule_label: string;
    shift: string;
    shift_label: string;
    is_active: boolean;
};

type CareerRow = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    duration_semesters: number;
    is_active: boolean;
    subjects_count: number;
    students_count: number;
    offerings: CareerOffering[];
    edit_url: string;
    delete_url: string;
};

type Option = {
    value: string;
    label: string;
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

type PaginatedCareers = {
    data: CareerRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    careers: PaginatedCareers;
    filters: {
        search: string | null;
        modality: string | null;
        schedule: string | null;
    };
    modalities: Option[];
    schedules: Option[];
    stats: Stat[];
    can_manage: boolean;
};

const modalityTone: Record<string, Tone> = {
    online: 'blue',
    presencial: 'green',
    mixta: 'gold',
};

/**
 * Listado administrativo de carreras y sus ofertas académicas.
 */
export default function AdminCareersIndex({
    careers,
    filters,
    modalities,
    schedules,
    stats,
    can_manage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [modality, setModality] = useState(filters.modality ?? '');
    const [schedule, setSchedule] = useState(filters.schedule ?? '');

    const applyFilters = (
        nextSearch: string,
        nextModality: string,
        nextSchedule: string,
    ) => {
        const params: Record<string, string> = {};

        if (nextSearch.trim() !== '') {
            params.search = nextSearch.trim();
        }

        if (nextModality !== '') {
            params.modality = nextModality;
        }

        if (nextSchedule !== '') {
            params.schedule = nextSchedule;
        }

        router.get(careersIndex.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters(search, modality, schedule);
    };

    const clearFilters = () => {
        setSearch('');
        setModality('');
        setSchedule('');
        applyFilters('', '', '');
    };

    const deleteCareer = (career: CareerRow) => {
        const confirmed = window.confirm(
            `¿Eliminar la carrera ${career.name}? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(career.delete_url, { preserveScroll: true });
    };

    const hasFilters =
        search.trim() !== '' || modality !== '' || schedule !== '';

    return (
        <>
            <Head title="Carreras" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Carreras"
                    description="Administra la oferta académica y define en qué modalidades, horarios y turnos se imparte cada carrera."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={careersCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar carrera
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
                    aria-label="Resumen de carreras"
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
                                    htmlFor="career-search"
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
                                        id="career-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Nombre o código de la carrera"
                                        className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                </div>
                            </div>

                            <div className="lg:w-56">
                                <label
                                    htmlFor="career-modality"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Modalidad
                                </label>
                                <select
                                    id="career-modality"
                                    value={modality}
                                    onChange={(event) =>
                                        setModality(event.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                >
                                    <option value="">Todas</option>
                                    {modalities.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:w-52">
                                <label
                                    htmlFor="career-schedule"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Horario
                                </label>
                                <select
                                    id="career-schedule"
                                    value={schedule}
                                    onChange={(event) =>
                                        setSchedule(event.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                >
                                    <option value="">Todos</option>
                                    {schedules.map((option) => (
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
                            {careers.total === 0
                                ? 'Sin carreras'
                                : `Mostrando ${careers.from ?? 0}–${careers.to ?? 0} de ${careers.total} carreras`}
                        </p>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            Página {careers.current_page} de{' '}
                            {Math.max(1, careers.last_page)}
                        </span>
                    </div>

                    {careers.data.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={Library}
                                title="Sin carreras"
                                description="No hay carreras que coincidan con los filtros seleccionados."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Carrera',
                                            'Ofertas académicas',
                                            'Duración',
                                            'Materias',
                                            'Estudiantes',
                                            'Estado',
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
                                    {careers.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="max-w-[300px] px-5 py-3.5 align-top">
                                                <p className="text-xs font-bold text-foreground">
                                                    {row.name}
                                                </p>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.code}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                {row.offerings.length === 0 ? (
                                                    <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                                        Sin ofertas
                                                    </span>
                                                ) : (
                                                    <ul className="flex max-w-[420px] flex-wrap gap-1.5">
                                                        {row.offerings.map(
                                                            (offering) => (
                                                                <li
                                                                    key={
                                                                        offering.id
                                                                    }
                                                                    className={cn(
                                                                        'inline-flex flex-wrap items-center gap-1 rounded-lg px-2 py-1 text-[0.62rem] font-bold ring-1 ring-inset',
                                                                        offering.is_active
                                                                            ? (toneClasses[
                                                                                  modalityTone[
                                                                                      offering
                                                                                          .modality
                                                                                  ] ??
                                                                                      'blue'
                                                                              ] ??
                                                                                  toneClasses.blue)
                                                                            : 'bg-upel-cloud text-muted-foreground ring-border dark:bg-muted',
                                                                    )}
                                                                >
                                                                    <span>
                                                                        {
                                                                            offering.modality_label
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className="opacity-40"
                                                                    >
                                                                        ·
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            offering.schedule_label
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className="opacity-40"
                                                                    >
                                                                        ·
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            offering.shift_label
                                                                        }
                                                                    </span>
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-semibold text-foreground">
                                                {row.duration_semesters}{' '}
                                                periodos
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-medium text-muted-foreground">
                                                {row.subjects_count}
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-medium text-muted-foreground">
                                                {row.students_count}
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                <ToneBadge
                                                    tone={
                                                        row.is_active
                                                            ? 'green'
                                                            : 'slate'
                                                    }
                                                >
                                                    {row.is_active
                                                        ? 'Activa'
                                                        : 'Inactiva'}
                                                </ToneBadge>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                {can_manage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={row.edit_url}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                        >
                                                            <Pencil
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            Editar
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteCareer(
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
                                                    </div>
                                                ) : (
                                                    <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                                        Solo lectura
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {careers.links.length > 3 ? (
                        <nav
                            aria-label="Paginación de carreras"
                            className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border px-5 py-4"
                        >
                            {careers.links.map((link, index) =>
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
