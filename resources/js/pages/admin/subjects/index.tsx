import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Filter,
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
    create as subjectsCreate,
    index as subjectsIndex,
} from '@/routes/admin/subjects';

type SubjectRow = {
    id: number;
    code: string;
    name: string;
    career: string;
    career_code: string | null;
    semester: number;
    modality: string;
    modality_label: string;
    credits: number;
    theory_hours: number;
    practice_hours: number;
    component: string | null;
    type: string | null;
    prerequisites: string | null;
    is_active: boolean;
    professors_count: number;
    enrollments_count: number;
    edit_url: string;
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

type PaginatedSubjects = {
    data: SubjectRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    subjects: PaginatedSubjects;
    filters: {
        search: string | null;
        career_id: number | null;
        semester: number | null;
        modality: string | null;
    };
    careers: { id: number; name: string; code: string }[];
    modalities: { value: string; label: string }[];
    semesters: number[];
    stats: Stat[];
    can_manage: boolean;
};

const modalityTone: Record<string, Tone> = {
    online: 'blue',
    presencial: 'green',
    mixta: 'gold',
};

/**
 * Listado administrativo de materias con filtros y acciones de gestión.
 */
export default function AdminSubjectsIndex({
    subjects,
    filters,
    careers,
    modalities,
    semesters,
    stats,
    can_manage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [careerId, setCareerId] = useState(
        filters.career_id !== null ? String(filters.career_id) : '',
    );
    const [semester, setSemester] = useState(
        filters.semester !== null ? String(filters.semester) : '',
    );
    const [modality, setModality] = useState(filters.modality ?? '');

    const applyFilters = (
        nextCareer: string,
        nextSemester: string,
        nextModality: string,
        nextSearch: string,
    ) => {
        const params: Record<string, string> = {};

        if (nextSearch.trim() !== '') {
            params.search = nextSearch.trim();
        }

        if (nextCareer !== '') {
            params.career_id = nextCareer;
        }

        if (nextSemester !== '') {
            params.semester = nextSemester;
        }

        if (nextModality !== '') {
            params.modality = nextModality;
        }

        router.get(subjectsIndex.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters(careerId, semester, modality, search);
    };

    const clearFilters = () => {
        setSearch('');
        setCareerId('');
        setSemester('');
        setModality('');
        applyFilters('', '', '', '');
    };

    const deleteSubject = (subject: SubjectRow) => {
        const confirmed = window.confirm(
            `¿Eliminar la materia ${subject.name}? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(subject.delete_url, { preserveScroll: true });
    };

    const hasFilters =
        search.trim() !== '' ||
        careerId !== '' ||
        semester !== '' ||
        modality !== '';

    return (
        <>
            <Head title="Materias" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Materias"
                    description="Lista, agrega, actualiza y elimina las unidades curriculares de cada carrera."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={subjectsCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar materia
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
                    aria-label="Resumen de materias"
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
                                    htmlFor="subject-search"
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
                                        id="subject-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Nombre o código de la materia"
                                        className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                </div>
                            </div>

                            <div className="lg:w-64">
                                <label
                                    htmlFor="subject-career"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Carrera
                                </label>
                                <select
                                    id="subject-career"
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

                            <div className="lg:w-40">
                                <label
                                    htmlFor="subject-semester"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Periodo
                                </label>
                                <select
                                    id="subject-semester"
                                    value={semester}
                                    onChange={(event) =>
                                        setSemester(event.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                >
                                    <option value="">Todos</option>
                                    {semesters.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:w-48">
                                <label
                                    htmlFor="subject-modality"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Modalidad
                                </label>
                                <select
                                    id="subject-modality"
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
                            {subjects.total === 0
                                ? 'Sin materias'
                                : `Mostrando ${subjects.from ?? 0}–${subjects.to ?? 0} de ${subjects.total} materias`}
                        </p>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            Página {subjects.current_page} de{' '}
                            {Math.max(1, subjects.last_page)}
                        </span>
                    </div>

                    {subjects.data.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={BookOpen}
                                title="Sin materias"
                                description="No hay materias que coincidan con los filtros seleccionados."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Materia',
                                            'Carrera',
                                            'Periodo',
                                            'Modalidad',
                                            'Créditos',
                                            'Horas',
                                            'Inscritos',
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
                                    {subjects.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={cn(
                                                'transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30',
                                                row.type === 'UNCLE' &&
                                                    'bg-upel-gold/5 hover:bg-upel-gold/10 dark:bg-upel-gold/5',
                                            )}
                                        >
                                            <td
                                                className={cn(
                                                    'max-w-[320px] border-l-2 px-5 py-3.5 align-middle',
                                                    row.type === 'UNCLE'
                                                        ? 'border-l-upel-gold'
                                                        : 'border-l-transparent',
                                                )}
                                            >
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-xs font-bold text-foreground">
                                                        {row.name}
                                                    </p>
                                                    {row.type === 'UNCLE' ? (
                                                        <ToneBadge tone="gold">
                                                            Libre elección
                                                        </ToneBadge>
                                                    ) : null}
                                                </div>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.code}
                                                    {row.prerequisites
                                                        ? ` · Requisito: ${row.prerequisites}`
                                                        : ''}
                                                </p>
                                            </td>
                                            <td className="max-w-[220px] px-5 py-3.5 align-middle">
                                                <p className="text-xs font-medium text-foreground">
                                                    {row.career}
                                                </p>
                                                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                                                    {row.career_code ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-semibold text-foreground">
                                                {row.semester}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
                                                <ToneBadge
                                                    tone={
                                                        modalityTone[
                                                            row.modality
                                                        ] ?? 'slate'
                                                    }
                                                >
                                                    {row.modality_label}
                                                </ToneBadge>
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-semibold text-foreground">
                                                {row.credits}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-medium text-muted-foreground">
                                                {row.theory_hours} T /{' '}
                                                {row.practice_hours} P
                                            </td>
                                            <td className="px-5 py-3.5 align-middle text-xs font-medium text-muted-foreground">
                                                {row.enrollments_count}
                                            </td>
                                            <td className="px-5 py-3.5 align-middle">
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
                                            <td className="px-5 py-3.5 align-middle">
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
                                                                deleteSubject(
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

                    {subjects.links.length > 3 ? (
                        <nav
                            aria-label="Paginación de materias"
                            className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border px-5 py-4"
                        >
                            {subjects.links.map((link, index) =>
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
