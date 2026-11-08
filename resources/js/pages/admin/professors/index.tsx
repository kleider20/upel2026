import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Eye,
    GraduationCap,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { type Tone, toneClasses } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    create as professorsCreate,
    index as professorsIndex,
} from '@/routes/admin/professors';

type ProfessorSubject = {
    id: number;
    name: string;
    code: string;
    career: string;
    career_code: string;
    semester: number;
};

type ProfessorRow = {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    department: string | null;
    academic_title: string | null;
    subjects_count: number;
    subjects: ProfessorSubject[];
    show_url: string;
    edit_url: string | null;
    delete_url: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedProfessors = {
    data: ProfessorRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Stat = {
    label: string;
    value: string;
    tone: Tone;
};

type Props = {
    professors: PaginatedProfessors;
    filters: { search: string | null };
    stats: Stat[];
    can_manage: boolean;
    can_delete: boolean;
};

/**
 * Listado de profesores y materias asignadas.
 */
export default function AdminProfessorsIndex({
    professors,
    filters,
    stats,
    can_manage,
    can_delete,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const query = search.trim();
        router.get(
            professorsIndex.url(),
            query === '' ? {} : { search: query },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const deleteProfessor = (professor: ProfessorRow) => {
        if (!professor.delete_url) {
            return;
        }

        if (
            !window.confirm(
                `¿Eliminar permanentemente la cuenta de ${professor.name}? También se eliminará su perfil docente y sus materias asignadas. Los horarios publicados conservarán el registro sin docente asignado.`,
            )
        ) {
            return;
        }

        router.delete(professor.delete_url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Profesores" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Gestión académica"
                    title="Profesores"
                    description="Administra las cuentas docentes y asigna las materias que podrán seleccionarse al crear horarios."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={professorsCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="size-3.5" />
                                    Registrar profesor
                                </Link>
                            ) : null}
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
                    aria-label="Resumen de profesores"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
                                    toneClasses[stat.tone],
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
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="flex-1">
                                <label
                                    htmlFor="professor-search"
                                    className="mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase"
                                >
                                    Buscar profesor
                                </label>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="professor-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Nombre, correo, código, departamento o materia"
                                        className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                            >
                                <Search className="size-3.5" />
                                Buscar
                            </button>
                        </form>
                    </div>

                    {professors.data.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={GraduationCap}
                                title="Sin profesores"
                                description={
                                    filters.search
                                        ? 'No hay profesores que coincidan con la búsqueda.'
                                        : 'Todavía no hay perfiles docentes registrados.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Profesor',
                                            'Código',
                                            'Departamento',
                                            'Título académico',
                                            'Materias asignadas',
                                            'Acciones',
                                        ].map((label) => (
                                            <th
                                                key={label}
                                                scope="col"
                                                className="px-5 py-3 text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {professors.data.map((professor) => (
                                        <tr
                                            key={professor.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="text-xs font-bold text-foreground">
                                                    {professor.name}
                                                </p>
                                                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                                                    {professor.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-semibold text-foreground">
                                                {professor.employee_code}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-foreground">
                                                {professor.department ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-foreground">
                                                {professor.academic_title ??
                                                    '—'}
                                            </td>
                                            <td className="max-w-[360px] px-5 py-3.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {professor.subjects
                                                        .length === 0 ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Sin materias
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {professor.subjects
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        subject,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                subject.id
                                                                            }
                                                                            title={`${subject.career} · período ${subject.semester}`}
                                                                            className="inline-flex items-center gap-1 rounded-full bg-upel-cloud px-2.5 py-1 text-[0.64rem] font-semibold text-upel-navy dark:bg-muted dark:text-foreground"
                                                                        >
                                                                            <BookOpen className="size-3" />
                                                                            {
                                                                                subject.name
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            {professor.subjects_count >
                                                            3 ? (
                                                                <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.64rem] font-bold text-muted-foreground">
                                                                    +
                                                                    {professor.subjects_count -
                                                                        3}
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Link
                                                        href={
                                                            professor.show_url
                                                        }
                                                        aria-label={`Ver perfil de ${professor.name}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-[0.66rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                    >
                                                        <Eye className="size-3.5" />
                                                        Ver
                                                    </Link>
                                                    {professor.edit_url ? (
                                                        <Link
                                                            href={
                                                                professor.edit_url
                                                            }
                                                            aria-label={`Editar ${professor.name} y asignar materias`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-[0.66rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Editar
                                                        </Link>
                                                    ) : null}
                                                    {can_delete &&
                                                    professor.delete_url ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteProfessor(
                                                                    professor,
                                                                )
                                                            }
                                                            aria-label={`Eliminar profesor ${professor.name}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-2 text-[0.66rem] font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 className="size-3.5" />
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

                    {professors.links.length > 3 ? (
                        <nav
                            aria-label="Paginación de profesores"
                            className="flex flex-wrap justify-center gap-1 border-t border-border px-4 py-3"
                        >
                            {professors.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={cn(
                                            'rounded-lg px-3 py-2 text-xs font-bold',
                                            link.active
                                                ? 'bg-upel-navy text-white'
                                                : 'text-muted-foreground hover:bg-upel-cloud dark:hover:bg-muted',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ) : (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground/50"
                                    >
                                        {link.label}
                                    </span>
                                ),
                            )}
                        </nav>
                    ) : null}
                </section>
            </div>
        </>
    );
}
