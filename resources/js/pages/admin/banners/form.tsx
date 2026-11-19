import { useEffect, useState, type FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { BannerPreview } from '@/components/admin/banner-preview';
import type { HeroSlide } from '@/components/landing/hero-slider';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { cn } from '@/lib/utils';
import { index as bannersIndex } from '@/routes/admin/banners';
import {
    store as bannersStore,
    update as bannersUpdate,
} from '@/routes/admin/banners';

type BannerRecord = {
    id: number;
    tag: string;
    title_start: string;
    title_highlight: string;
    title_end: string | null;
    description: string;
    visual: string;
    image_url: string | null;
    countdown_at: string | null;
    countdown_label: string | null;
    primary_label: string | null;
    primary_url: string | null;
    secondary_label: string | null;
    secondary_url: string | null;
    sort_order: number;
    is_active: boolean;
};

type BannerFormData = {
    tag: string;
    title_start: string;
    title_highlight: string;
    title_end: string;
    description: string;
    visual: string;
    image: File | null;
    remove_image: boolean;
    countdown_at: string;
    countdown_label: string;
    primary_label: string;
    primary_url: string;
    secondary_label: string;
    secondary_url: string;
    sort_order: string;
    is_active: boolean;
};

type Option = {
    value: string;
    label: string;
};

type Props = {
    banner: BannerRecord | null;
    visual_options: Option[];
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/** Convierte un ISO a `datetime-local` en la zona horaria de Venezuela. */
function toDateTimeLocal(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const parts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Caracas',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date(iso));

    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';

    return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

/** Convierte el valor de `datetime-local` a ISO con el offset de Venezuela. */
function toIsoDateTime(value: string): string {
    const normalized = value.length === 16 ? `${value}:00` : value;

    return new Date(`${normalized}-04:00`).toISOString();
}

/**
 * Formulario compartido para crear y editar publicaciones del baner.
 */
export default function AdminBannerForm({ banner, visual_options }: Props) {
    const isEditing = banner !== null;

    const form = useForm<BannerFormData>({
        tag: banner?.tag ?? '',
        title_start: banner?.title_start ?? '',
        title_highlight: banner?.title_highlight ?? '',
        title_end: banner?.title_end ?? '',
        description: banner?.description ?? '',
        visual: banner?.visual ?? 'imagen',
        image: null,
        remove_image: false,
        countdown_at: toDateTimeLocal(banner?.countdown_at ?? null),
        countdown_label: banner?.countdown_label ?? 'Cuenta regresiva',
        primary_label: banner?.primary_label ?? '',
        primary_url: banner?.primary_url ?? '',
        secondary_label: banner?.secondary_label ?? '',
        secondary_url: banner?.secondary_url ?? '',
        sort_order: banner ? String(banner.sort_order) : '0',
        is_active: banner?.is_active ?? true,
    });

    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const image = form.data.image;

        if (!image) {
            setUploadedImageUrl(null);

            return;
        }

        const url = URL.createObjectURL(image);
        setUploadedImageUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [form.data.image]);

    const previewSlide: HeroSlide = {
        id: banner?.id ?? 'preview',
        tag: form.data.tag,
        title_start: form.data.title_start,
        title_highlight: form.data.title_highlight,
        title_end: form.data.title_end,
        description: form.data.description,
        visual: form.data.visual as HeroSlide['visual'],
        image_url: form.data.remove_image
            ? null
            : (uploadedImageUrl ?? banner?.image_url ?? null),
        countdown_at: form.data.countdown_at
            ? toIsoDateTime(form.data.countdown_at)
            : null,
        countdown_label: form.data.countdown_label,
        primary_label: form.data.primary_label,
        primary_url: form.data.primary_url,
        secondary_label: form.data.secondary_label,
        secondary_url: form.data.secondary_url,
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (banner !== null) {
            form.put(bannersUpdate.url(banner.id), { preserveScroll: true });

            return;
        }

        form.post(bannersStore.url());
    };

    return (
        <>
            <Head
                title={isEditing ? 'Editar publicación' : 'Nueva publicación'}
            />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Contenido de la landing"
                    title={
                        isEditing
                            ? 'Editar publicación del baner'
                            : 'Nueva publicación del baner'
                    }
                    description={
                        isEditing
                            ? 'Actualiza el texto, la tarjeta y el orden de esta diapositiva.'
                            : 'Registra una diapositiva para mostrarla en el inicio del portal web.'
                    }
                    actions={
                        <Link
                            href={bannersIndex()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al listado
                        </Link>
                    }
                />

                <form onSubmit={submit}>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
                        <div className="min-w-0 space-y-6">
                            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    Contenido de la diapositiva
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    El texto destacado se resalta en dorado
                                    dentro del título principal del baner.
                                </p>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="tag"
                                            className={labelClass}
                                        >
                                            Etiqueta
                                        </label>
                                        <input
                                            id="tag"
                                            type="text"
                                            value={form.data.tag}
                                            onChange={(event) =>
                                                form.setData(
                                                    'tag',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.tag,
                                            )}
                                            className={inputClass}
                                            placeholder="🎓 Educación que transforma"
                                        />
                                        <InputError
                                            message={form.errors.tag}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="title_start"
                                            className={labelClass}
                                        >
                                            Inicio del título
                                        </label>
                                        <input
                                            id="title_start"
                                            type="text"
                                            value={form.data.title_start}
                                            onChange={(event) =>
                                                form.setData(
                                                    'title_start',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.title_start,
                                            )}
                                            className={inputClass}
                                            placeholder="Formamos a los"
                                        />
                                        <InputError
                                            message={form.errors.title_start}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="title_highlight"
                                            className={labelClass}
                                        >
                                            Texto destacado
                                        </label>
                                        <input
                                            id="title_highlight"
                                            type="text"
                                            value={form.data.title_highlight}
                                            onChange={(event) =>
                                                form.setData(
                                                    'title_highlight',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.title_highlight,
                                            )}
                                            className={inputClass}
                                            placeholder="maestros"
                                        />
                                        <InputError
                                            message={
                                                form.errors.title_highlight
                                            }
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="title_end"
                                            className={labelClass}
                                        >
                                            Final del título (opcional)
                                        </label>
                                        <input
                                            id="title_end"
                                            type="text"
                                            value={form.data.title_end}
                                            onChange={(event) =>
                                                form.setData(
                                                    'title_end',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.title_end,
                                            )}
                                            className={inputClass}
                                            placeholder="que construyen el futuro de Venezuela"
                                        />
                                        <InputError
                                            message={form.errors.title_end}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="description"
                                            className={labelClass}
                                        >
                                            Descripción
                                        </label>
                                        <textarea
                                            id="description"
                                            value={form.data.description}
                                            onChange={(event) =>
                                                form.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            rows={4}
                                            aria-invalid={Boolean(
                                                form.errors.description,
                                            )}
                                            className="w-full rounded-xl border border-border bg-upel-cloud/50 px-3 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                            placeholder="Más de 40 años de excelencia académica, investigación pedagógica y compromiso con la educación pública..."
                                        />
                                        <InputError
                                            message={form.errors.description}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                                <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                                    Presentación y botones
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Elige entre una imagen para el lateral del
                                    baner o una cuenta regresiva hasta la fecha
                                    que indiques. Los enlaces opcionales
                                    reemplazan el destino por defecto.
                                </p>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="visual"
                                            className={labelClass}
                                        >
                                            Presentación del lateral
                                        </label>
                                        <select
                                            id="visual"
                                            value={form.data.visual}
                                            onChange={(event) =>
                                                form.setData(
                                                    'visual',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.visual,
                                            )}
                                            className={inputClass}
                                        >
                                            {visual_options.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={form.errors.visual}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="image"
                                            className={labelClass}
                                        >
                                            Imagen del banner
                                        </label>
                                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                                            {uploadedImageUrl &&
                                            !form.data.remove_image ? (
                                                <img
                                                    src={uploadedImageUrl}
                                                    alt="Vista previa de la imagen"
                                                    className="h-24 w-40 rounded-xl object-cover ring-1 ring-border"
                                                />
                                            ) : null}

                                            {form.data.image ? (
                                                <span className="inline-flex max-w-full items-center rounded-xl border border-border bg-upel-cloud/40 px-3 py-2 text-[0.68rem] font-semibold text-foreground">
                                                    {form.data.image.name}
                                                </span>
                                            ) : null}

                                            <div className="flex-1">
                                                <input
                                                    id="image"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={(event) => {
                                                        form.setData(
                                                            'image',
                                                            event.target
                                                                .files?.[0] ??
                                                                null,
                                                        );
                                                        form.setData(
                                                            'remove_image',
                                                            false,
                                                        );
                                                    }}
                                                    className="block w-full cursor-pointer rounded-xl border border-border bg-upel-cloud/50 px-3 py-2 text-xs font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-upel-navy file:px-3 file:py-1.5 file:text-[0.68rem] file:font-bold file:text-white dark:bg-muted/40"
                                                />
                                                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                                    JPG, PNG o WEBP. Máximo 2
                                                    MB.
                                                </p>
                                            </div>

                                            {banner?.image_url &&
                                            !form.data.remove_image ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        form.setData(
                                                            'remove_image',
                                                            true,
                                                        );
                                                        form.setData(
                                                            'image',
                                                            null,
                                                        );
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-[0.68rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    Quitar imagen
                                                </button>
                                            ) : null}

                                            {form.data.remove_image ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        form.setData(
                                                            'remove_image',
                                                            false,
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-[0.68rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                >
                                                    Deshacer
                                                </button>
                                            ) : null}
                                        </div>
                                        <InputError
                                            message={form.errors.image}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    {form.data.visual === 'countdown' ? (
                                        <>
                                            <div>
                                                <label
                                                    htmlFor="countdown_at"
                                                    className={labelClass}
                                                >
                                                    Fecha y hora de la cuenta
                                                    regresiva
                                                </label>
                                                <input
                                                    id="countdown_at"
                                                    type="datetime-local"
                                                    value={
                                                        form.data.countdown_at
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'countdown_at',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                                    El tiempo restante se
                                                    calcula desde hoy hasta esta
                                                    fecha.
                                                </p>
                                                <InputError
                                                    message={
                                                        form.errors.countdown_at
                                                    }
                                                    className="mt-1 text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="countdown_label"
                                                    className={labelClass}
                                                >
                                                    Etiqueta de la cuenta
                                                    regresiva
                                                </label>
                                                <input
                                                    id="countdown_label"
                                                    type="text"
                                                    value={
                                                        form.data
                                                            .countdown_label
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'countdown_label',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                    placeholder="Cuenta regresiva"
                                                />
                                                <InputError
                                                    message={
                                                        form.errors
                                                            .countdown_label
                                                    }
                                                    className="mt-1 text-xs"
                                                />
                                            </div>
                                        </>
                                    ) : null}

                                    <div>
                                        <label
                                            htmlFor="primary_label"
                                            className={labelClass}
                                        >
                                            Texto del botón principal (opcional)
                                        </label>
                                        <input
                                            id="primary_label"
                                            type="text"
                                            value={form.data.primary_label}
                                            onChange={(event) =>
                                                form.setData(
                                                    'primary_label',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.primary_label,
                                            )}
                                            className={inputClass}
                                            placeholder="Explora nuestras carreras"
                                        />
                                        <InputError
                                            message={form.errors.primary_label}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="primary_url"
                                            className={labelClass}
                                        >
                                            Enlace del botón principal
                                            (opcional)
                                        </label>
                                        <input
                                            id="primary_url"
                                            type="text"
                                            value={form.data.primary_url}
                                            onChange={(event) =>
                                                form.setData(
                                                    'primary_url',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.primary_url,
                                            )}
                                            className={inputClass}
                                            placeholder="#carreras o https://..."
                                        />
                                        <InputError
                                            message={form.errors.primary_url}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="secondary_label"
                                            className={labelClass}
                                        >
                                            Texto del botón secundario
                                            (opcional)
                                        </label>
                                        <input
                                            id="secondary_label"
                                            type="text"
                                            value={form.data.secondary_label}
                                            onChange={(event) =>
                                                form.setData(
                                                    'secondary_label',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.secondary_label,
                                            )}
                                            className={inputClass}
                                            placeholder="Conoce la UPEL"
                                        />
                                        <InputError
                                            message={
                                                form.errors.secondary_label
                                            }
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="secondary_url"
                                            className={labelClass}
                                        >
                                            Enlace del botón secundario
                                            (opcional)
                                        </label>
                                        <input
                                            id="secondary_url"
                                            type="text"
                                            value={form.data.secondary_url}
                                            onChange={(event) =>
                                                form.setData(
                                                    'secondary_url',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.secondary_url,
                                            )}
                                            className={inputClass}
                                            placeholder="#nosotros o https://..."
                                        />
                                        <InputError
                                            message={form.errors.secondary_url}
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
                                            Publicación activa
                                        </label>
                                        <InputError
                                            message={form.errors.is_active}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section
                            aria-label="Vista previa del baner"
                            className="min-w-0 space-y-3 xl:sticky xl:top-6 xl:self-start"
                        >
                            <div>
                                <p className="text-[0.68rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                    Vista previa
                                </p>
                                <h2 className="mt-1 text-lg font-bold text-upel-navy dark:text-foreground">
                                    Aspecto en la landing
                                </h2>
                                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                                    Los cambios se reflejan al instante. Los
                                    botones de la vista previa no navegan.
                                </p>
                            </div>
                            <BannerPreview slide={previewSlide} />
                        </section>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                        <Link
                            href={bannersIndex()}
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
                            {isEditing
                                ? 'Guardar cambios'
                                : 'Publicar en el baner'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
