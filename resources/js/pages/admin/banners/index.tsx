import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import {
    ToneBadge,
    type Tone,
    toneClasses,
} from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import { create as bannersCreate } from '@/routes/admin/banners';

type BannerRow = {
    id: number;
    tag: string;
    title_start: string;
    title_highlight: string;
    title_end: string | null;
    description: string;
    visual: string;
    visual_label: string;
    primary_label: string | null;
    primary_url: string | null;
    secondary_label: string | null;
    secondary_url: string | null;
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
    banners: BannerRow[];
    stats: Stat[];
    can_manage: boolean;
};

/**
 * Listado de las publicaciones del baner principal de la landing.
 */
export default function AdminBannersIndex({
    banners,
    stats,
    can_manage,
}: Props) {
    const deleteBanner = (banner: BannerRow) => {
        const confirmed = window.confirm(
            `¿Eliminar la publicación "${banner.tag}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(banner.delete_url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Publicaciones del baner" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Contenido de la landing"
                    title="Publicaciones del baner"
                    description="Crea, edita y ordena las diapositivas que aparecen en el inicio del portal web de la UPEL."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={bannersCreate()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Nueva publicación
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
                    aria-label="Resumen de publicaciones"
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
                                Diapositivas publicadas
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Se muestran en el baner en orden ascendente; las
                                inactivas no aparecen en la landing.
                            </p>
                        </div>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            {banners.length}{' '}
                            {banners.length === 1
                                ? 'publicación'
                                : 'publicaciones'}
                        </span>
                    </div>

                    {banners.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={Images}
                                title="Sin publicaciones"
                                description="Crea la primera diapositiva para mostrarla en el baner de la landing."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {[
                                            'Publicación',
                                            'Tarjeta',
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
                                    {banners.map((banner) => (
                                        <tr
                                            key={banner.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            <td className="max-w-[460px] px-5 py-3.5 align-top">
                                                <p className="text-upel-gold-dark text-[0.68rem] font-extrabold tracking-wide uppercase">
                                                    {banner.tag}
                                                </p>
                                                <p className="mt-1 text-xs font-bold text-foreground">
                                                    {banner.title_start}{' '}
                                                    <span className="text-upel-blue">
                                                        {banner.title_highlight}
                                                    </span>{' '}
                                                    {banner.title_end}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-[0.68rem] leading-relaxed text-muted-foreground">
                                                    {banner.description}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                <span className="inline-flex rounded-lg bg-upel-cloud px-2.5 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-foreground">
                                                    {banner.visual_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 align-top text-xs font-semibold text-muted-foreground">
                                                {banner.sort_order}
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                <ToneBadge
                                                    tone={
                                                        banner.is_active
                                                            ? 'green'
                                                            : 'slate'
                                                    }
                                                >
                                                    {banner.is_active
                                                        ? 'Activa'
                                                        : 'Inactiva'}
                                                </ToneBadge>
                                            </td>
                                            <td className="px-5 py-3.5 align-top">
                                                {can_manage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={
                                                                banner.edit_url
                                                            }
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
                                                                deleteBanner(
                                                                    banner,
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
                </section>
            </div>
        </>
    );
}
