import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Layers,
    Plus,
    Search,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { type Tone, toneClasses } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import { create as subjectsCreate } from '@/routes/admin/subjects';

type Stat = {
    label: string;
    value: string;
    tone: string;
};

type CareerPensum = {
    id: number;
    name: string;
    code: string;
    icon: string;
    subjects_count: number;
    semesters_count: number;
    credits_total: number;
    show_url: string;
};

type Props = {
    careers: CareerPensum[];
    stats: Stat[];
    can_manage: boolean;
};

/**
 * Listado de carreras con el resumen de su pensum.
 */
export default function AdminPensumsIndex({
    careers,
    stats,
    can_manage,
}: Props) {
    const [search, setSearch] = useState('');

    const visibleCareers = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('es');

        if (term === '') {
            return careers;
        }

        return careers.filter((career) =>
            `${career.name} ${career.code}`
                .toLocaleLowerCase('es')
                .includes(term),
        );
    }, [careers, search]);

    return (
        <>
            <Head title="Pensums" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Pensums de las carreras"
                    description="Organiza las materias de cada carrera por período académico y controla sus créditos."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={adminDashboard()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                                Volver al panel
                            </Link>
                        </div>
                    }
                />

                <section
                    aria-label="Resumen de pensums"
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

                <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                                <Layers
                                    className="size-4 text-upel-blue"
                                    aria-hidden="true"
                                />
                                Carreras y su plan de estudios
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Selecciona una carrera para revisar o actualizar
                                su pensum.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <label htmlFor="pensum-search" className="sr-only">
                                Buscar carrera
                            </label>
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                id="pensum-search"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por nombre o código"
                                className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                            />
                        </div>
                    </div>

                    {visibleCareers.length === 0 ? (
                        <div className="mt-5">
                            <EmptyState
                                icon={BookOpen}
                                title="Sin carreras"
                                description="No hay carreras que coincidan con la búsqueda."
                            />
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleCareers.map((career) => (
                                <article
                                    key={career.id}
                                    className="flex flex-col justify-between rounded-2xl border border-border/70 bg-upel-cloud/30 p-5 transition-colors hover:border-upel-blue/30 dark:bg-muted/20"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="flex size-11 items-center justify-center rounded-xl bg-white text-xl ring-1 ring-border dark:bg-card">
                                                <span aria-hidden="true">
                                                    {career.icon}
                                                </span>
                                            </span>
                                            <span className="rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-card">
                                                {career.code}
                                            </span>
                                        </div>

                                        <h3 className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                                            {career.name}
                                        </h3>

                                        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-border dark:bg-card">
                                                <dt className="text-[0.58rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                    Materias
                                                </dt>
                                                <dd className="mt-0.5 text-sm font-bold text-upel-navy dark:text-foreground">
                                                    {career.subjects_count}
                                                </dd>
                                            </div>
                                            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-border dark:bg-card">
                                                <dt className="text-[0.58rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                    Períodos
                                                </dt>
                                                <dd className="mt-0.5 text-sm font-bold text-upel-navy dark:text-foreground">
                                                    {career.semesters_count}
                                                </dd>
                                            </div>
                                            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-border dark:bg-card">
                                                <dt className="text-[0.58rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                    Créditos
                                                </dt>
                                                <dd className="mt-0.5 text-sm font-bold text-upel-navy dark:text-foreground">
                                                    {career.credits_total}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={career.show_url}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-upel-navy px-3.5 py-2 text-[0.68rem] font-bold text-white transition-colors hover:bg-upel-navy-800"
                                        >
                                            Gestionar pensum
                                            <ArrowRight
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                        {can_manage ? (
                                            <Link
                                                href={subjectsCreate.url({
                                                    query: {
                                                        career_id: career.id,
                                                    },
                                                })}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[0.68rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                            >
                                                <Plus
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                                Agregar materia
                                            </Link>
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
