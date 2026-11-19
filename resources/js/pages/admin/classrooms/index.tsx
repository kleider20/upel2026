import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { DoorOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import {
    create as classroomsCreate,
    index as classroomsIndex,
} from '@/routes/admin/classrooms';

type ClassroomRow = {
    id: number;
    code: string;
    name: string;
    capacity: number | null;
    is_active: boolean;
    edit_url: string;
    delete_url: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedClassrooms = {
    data: ClassroomRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    classrooms: PaginatedClassrooms;
    filters: { search: string | null };
    can_manage: boolean;
};

/** Catálogo de aulas disponibles para asignar en los horarios. */
export default function AdminClassroomsIndex({
    classrooms,
    filters,
    can_manage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(classroomsIndex.url(), { search }, { preserveState: true });
    };

    return (
        <>
            <Head title="Aulas" />

            <PageHeader
                eyebrow="Gestión de horarios"
                title="Aulas"
                description="Catálogo de espacios físicos que se asignan a cada materia del horario por período."
                actions={
                    can_manage ? (
                        <Link
                            href={classroomsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90"
                        >
                            <Plus className="size-4" />
                            Registrar aula
                        </Link>
                    ) : undefined
                }
            />

            <section className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por código o nombre"
                            className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-muted/40"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 rounded-xl bg-upel-navy px-4 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90"
                    >
                        Buscar
                    </button>
                </form>

                {classrooms.data.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={DoorOpen}
                            title="No hay aulas registradas"
                            description="Registra las aulas del núcleo para poder asignarlas en los horarios."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-upel-cloud/70 text-[0.62rem] font-bold tracking-[0.14em] text-muted-foreground uppercase dark:bg-muted/50">
                                    <th className="px-5 py-3">Código</th>
                                    <th className="px-5 py-3">Nombre</th>
                                    <th className="px-5 py-3">Capacidad</th>
                                    <th className="px-5 py-3">Estado</th>
                                    {can_manage ? (
                                        <th className="px-5 py-3">Acciones</th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {classrooms.data.map((classroom) => (
                                    <tr
                                        key={classroom.id}
                                        className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                    >
                                        <td className="px-5 py-4 font-mono text-xs font-extrabold text-upel-navy dark:text-foreground">
                                            {classroom.code}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-semibold text-foreground">
                                            {classroom.name}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                            {classroom.capacity ?? '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <ToneBadge
                                                tone={
                                                    (classroom.is_active
                                                        ? 'green'
                                                        : 'slate') as Tone
                                                }
                                            >
                                                {classroom.is_active
                                                    ? 'Activa'
                                                    : 'Inactiva'}
                                            </ToneBadge>
                                        </td>
                                        {can_manage ? (
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={
                                                            classroom.edit_url
                                                        }
                                                        aria-label={`Editar ${classroom.code}`}
                                                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.delete(
                                                                classroom.delete_url,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                        aria-label={`Eliminar ${classroom.code}`}
                                                        className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">
                    {classrooms.links.map((link) => (
                        <button
                            key={`${link.label}-${link.url ?? 'none'}`}
                            type="button"
                            disabled={link.url === null}
                            onClick={() =>
                                link.url !== null &&
                                router.get(
                                    link.url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                link.active
                                    ? 'bg-upel-navy text-white'
                                    : 'border border-border text-muted-foreground hover:text-upel-navy disabled:opacity-40'
                            }`}
                        >
                            {link.label
                                .replace('&laquo;', '«')
                                .replace('&raquo;', '»')
                                .replace('Previous', 'Anterior')
                                .replace('Next', 'Siguiente')}
                        </button>
                    ))}
                </div>
            </section>
        </>
    );
}
