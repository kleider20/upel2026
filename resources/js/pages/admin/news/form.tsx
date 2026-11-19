import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { cn } from '@/lib/utils';
import { index as newsIndex } from '@/routes/admin/news';
import { store as newsStore, update as newsUpdate } from '@/routes/admin/news';

type NewsRecord = {
    id: number;
    category: string;
    date: string;
    title: string;
    excerpt: string;
    icon: string;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
};

type NewsFormData = {
    category: string;
    date: string;
    title: string;
    excerpt: string;
    icon: string;
    link_url: string;
    sort_order: string;
    is_active: boolean;
};

type Option = {
    value: string;
    label: string;
};

type Props = {
    post: NewsRecord | null;
    icon_options: Option[];
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/**
 * Formulario compartido para crear y editar noticias de la landing.
 */
export default function AdminNewsForm({ post, icon_options }: Props) {
    const isEditing = post !== null;

    const form = useForm<NewsFormData>({
        category: post?.category ?? '',
        date: post?.date ?? new Date().toISOString().slice(0, 10),
        title: post?.title ?? '',
        excerpt: post?.excerpt ?? '',
        icon: post?.icon ?? 'laptop',
        link_url: post?.link_url ?? '',
        sort_order: post ? String(post.sort_order) : '0',
        is_active: post?.is_active ?? true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (post !== null) {
            form.put(newsUpdate.url(post.id), { preserveScroll: true });

            return;
        }

        form.post(newsStore.url());
    };

    return (
        <>
            <Head title={isEditing ? 'Editar noticia' : 'Nueva noticia'} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Publicaciones"
                    title={isEditing ? 'Editar noticia' : 'Nueva noticia'}
                    description={
                        isEditing
                            ? 'Actualiza el contenido y la visibilidad de esta noticia.'
                            : 'Publica una noticia en la sección “Noticias y novedades” de la landing.'
                    }
                    actions={
                        <Link
                            href={newsIndex()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al listado
                        </Link>
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Contenido de la noticia
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Estos datos aparecen en la tarjeta de la sección
                            “Actualidad UPEL”.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="category"
                                    className={labelClass}
                                >
                                    Categoría
                                </label>
                                <input
                                    id="category"
                                    type="text"
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.category)}
                                    className={inputClass}
                                    placeholder="Académico"
                                />
                                <InputError
                                    message={form.errors.category}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label htmlFor="date" className={labelClass}>
                                    Fecha de publicación
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={form.data.date}
                                    onChange={(event) =>
                                        form.setData('date', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.date)}
                                    className={inputClass}
                                />
                                <InputError
                                    message={form.errors.date}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="title" className={labelClass}>
                                    Título
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.title)}
                                    className={inputClass}
                                    placeholder="UPEL amplía su oferta de carreras 100% online para 2027"
                                />
                                <InputError
                                    message={form.errors.title}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="excerpt" className={labelClass}>
                                    Resumen
                                </label>
                                <textarea
                                    id="excerpt"
                                    value={form.data.excerpt}
                                    onChange={(event) =>
                                        form.setData(
                                            'excerpt',
                                            event.target.value,
                                        )
                                    }
                                    rows={4}
                                    aria-invalid={Boolean(form.errors.excerpt)}
                                    className="w-full rounded-xl border border-border bg-upel-cloud/50 px-3 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    placeholder="Cinco nuevos programas de pregrado se suman al campus virtual..."
                                />
                                <InputError
                                    message={form.errors.excerpt}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Presentación y publicación
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            La ilustración define el color de la tarjeta. El
                            enlace de “Leer más” es opcional.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="icon" className={labelClass}>
                                    Ilustración
                                </label>
                                <select
                                    id="icon"
                                    value={form.data.icon}
                                    onChange={(event) =>
                                        form.setData('icon', event.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.icon)}
                                    className={inputClass}
                                >
                                    {icon_options.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.icon}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="link_url"
                                    className={labelClass}
                                >
                                    Enlace de “Leer más” (opcional)
                                </label>
                                <input
                                    id="link_url"
                                    type="text"
                                    value={form.data.link_url}
                                    onChange={(event) =>
                                        form.setData(
                                            'link_url',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.link_url)}
                                    className={inputClass}
                                    placeholder="/noticias/ejemplo o https://..."
                                />
                                <InputError
                                    message={form.errors.link_url}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="sort_order"
                                    className={labelClass}
                                >
                                    Orden de aparición
                                </label>
                                <input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    max={9999}
                                    value={form.data.sort_order}
                                    onChange={(event) =>
                                        form.setData(
                                            'sort_order',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.sort_order,
                                    )}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                    Menor número = aparece primero.
                                </p>
                                <InputError
                                    message={form.errors.sort_order}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div className="flex items-end">
                                <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground dark:bg-card">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(event) =>
                                            form.setData(
                                                'is_active',
                                                event.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-border text-upel-navy focus:ring-upel-blue"
                                    />
                                    Noticia publicada
                                </label>
                                <InputError
                                    message={form.errors.is_active}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                            href={newsIndex()}
                            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-xl bg-upel-navy px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800',
                                form.processing && 'opacity-70',
                            )}
                        >
                            {form.processing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {isEditing ? 'Guardar cambios' : 'Publicar noticia'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
