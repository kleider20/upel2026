import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import {
    ToneBadge,
    type Tone,
    toneClasses,
} from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import { create as newsCreate } from '@/routes/admin/news';

type NewsRow = {
    id: number;
    category: string;
    date: string;
    title: string;
    excerpt: string;
    icon: string;
    icon_label: string;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
    edit_url: string;
    delete_url: string;
};

type Stat = {
    label: string;
    value: string;
    tone: string;
};

type Props = {
    posts: NewsRow[];
    stats: Stat[];
    can_manage: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function formatDate(value: string): string {
    return dateFormatter.format(new Date(`${value}T12:00:00`));
}

/**
 * Listado de las noticias publicadas en la sección "Noticias y novedades".
 */
export default function AdminNewsIndex({ posts, stats, can_manage }: Props) {
    const deletePost = (post: NewsRow) => {
        const confirmed = window.confirm(
            `¿Eliminar la noticia "${post.title}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(post.delete_url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Noticias y novedades" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Publicaciones"
                    title="Noticias y novedades"
                    description="Administra las noticias de la sección “Actualidad UPEL” del portal web de la UPEL."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={newsCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Nueva noticia
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
                    aria-label="Resumen de noticias"
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <div>
                            <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                Noticias publicadas
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Se muestran en la landing en orden ascendente;
                                las inactivas no aparecen.
                            </p>
                        </div>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            {posts.length}{' '}
                            {posts.length === 1 ? 'noticia' : 'noticias'}
                        </span>
                    </div>

                    {posts.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={Newspaper}
                                title="Sin noticias"
                                description="Crea la primera noticia para mostrarla en la sección “Noticias y novedades”."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Noticia',
                                            'Categoría',
                                            'Fecha',
                                            'Orden',
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
                                    {posts.map((post) => (
                                        <tr
                                            key={post.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="max-w-[420px] px-5 py-3.5 align-top">
                                                <p className="text-xs font-bold text-foreground">
                                                    {post.title}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-[0.68rem] leading-relaxed text-muted-foreground">
                                                    {post.excerpt}
                                                </p>
                                                <p className="mt-1 text-[0.62rem] font-semibold text-upel-blue">
                                                    {post.icon_label}
                                                    {post.link_url
                                                        ? ` · ${post.link_url}`
                                                        : ''}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                <span className="inline-flex rounded-lg bg-upel-cloud px-2.5 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-foreground">
                                                    {post.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-semibold text-muted-foreground">
                                                {formatDate(post.date)}
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-semibold text-muted-foreground">
                                                {post.sort_order}
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                <ToneBadge
                                                    tone={
                                                        post.is_active
                                                            ? 'green'
                                                            : 'slate'
                                                    }
                                                >
                                                    {post.is_active
                                                        ? 'Publicada'
                                                        : 'Borrador'}
                                                </ToneBadge>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                {can_manage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={post.edit_url}
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
                                                                deletePost(post)
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
                </section>
            </div>
        </>
    );
}
