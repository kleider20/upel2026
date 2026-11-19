import { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    PlayCircle,
    Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pad, useCountdown } from '@/hooks/use-countdown';

export type SlideVisualKey = 'imagen' | 'countdown';

export type HeroSlide = {
    id: number | string;
    tag: string;
    title_start: string;
    title_highlight: string;
    title_end?: string | null;
    description: string;
    visual: SlideVisualKey;
    image_url?: string | null;
    countdown_at?: string | null;
    countdown_label?: string | null;
    primary_label?: string | null;
    primary_url?: string | null;
    secondary_label?: string | null;
    secondary_url?: string | null;
};

/**
 * Diapositivas de respaldo mientras no haya publicaciones creadas en el panel.
 */
const fallbackSlides: HeroSlide[] = [
    {
        id: 'institucional',
        tag: '🎓 Educación que transforma',
        title_start: 'Formamos a los',
        title_highlight: 'maestros',
        title_end: 'que construyen el futuro de Venezuela',
        description:
            'Más de 40 años de excelencia académica, investigación pedagógica y compromiso con la educación pública, ahora también en modalidad 100% online.',
        visual: 'imagen',
    },
];

const PRIMARY_LABELS: Record<SlideVisualKey, string> = {
    imagen: 'Explora nuestras carreras',
    countdown: 'Ver más',
};

const SECONDARY_LABELS: Record<SlideVisualKey, string> = {
    imagen: 'Conoce la UPEL',
    countdown: 'Conoce la UPEL',
};

const PRIMARY_ANCHORS: Record<SlideVisualKey, string> = {
    imagen: '#carreras',
    countdown: '#carreras',
};

const SECONDARY_ANCHORS: Record<SlideVisualKey, string> = {
    imagen: '#nosotros',
    countdown: '#nosotros',
};

const COUNTDOWN_LABELS = ['Días', 'Horas', 'Min', 'Seg'] as const;

/** Formatea una fecha ISO con la zona horaria oficial de la UPEL. */
function formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-VE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Caracas',
    }).format(new Date(value));
}

/** Formatea la hora de una fecha ISO con la zona horaria oficial de la UPEL. */
function formatTime(value: string): string {
    return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Caracas',
    }).format(new Date(value));
}

/** Tarjeta de cuenta regresiva compartida por preinscripción e inscripciones. */
function CountdownCard({
    target,
    label,
    caption,
    footer,
}: {
    target: string;
    label: string;
    caption: string;
    footer: (isPast: boolean) => string;
}) {
    const countdown = useCountdown(target);

    return (
        <div className="w-full max-w-[460px] rounded-[24px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
            <p className="text-[0.68rem] font-extrabold tracking-[0.18em] text-upel-gold-light uppercase">
                {label}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                {[
                    countdown.days,
                    countdown.hours,
                    countdown.minutes,
                    countdown.seconds,
                ].map((value, index) => (
                    <div
                        key={COUNTDOWN_LABELS[index]}
                        className="rounded-xl bg-upel-navy/45 px-2 py-3 text-center ring-1 ring-white/12"
                    >
                        <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                            {pad(value)}
                        </p>
                        <p className="mt-0.5 text-[0.58rem] font-bold tracking-widest text-white/55 uppercase">
                            {COUNTDOWN_LABELS[index]}
                        </p>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
                {caption}
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-upel-gold/12 px-3.5 py-3 text-[0.72rem] font-semibold text-upel-gold-light ring-1 ring-upel-gold/25">
                <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                {footer(countdown.isPast)}
            </div>
        </div>
    );
}

/** Ilustración de la diapositiva: cuenta regresiva o imagen subida. */
function SlideVisual({ slide }: { slide: HeroSlide }) {
    if (slide.visual === 'countdown') {
        const fallback = new Date(Date.now() + 86_400_000).toISOString();
        const target = slide.countdown_at ?? fallback;

        return (
            <CountdownCard
                target={target}
                label={slide.countdown_label || 'Cuenta regresiva'}
                caption={`Tiempo restante hasta el ${formatDate(target)} · ${formatTime(target)} (GMT-4).`}
                footer={(isPast) =>
                    isPast
                        ? 'La fecha indicada ya pasó.'
                        : 'El sistema calcula el tiempo restante desde la fecha de publicación.'
                }
            />
        );
    }

    if (slide.image_url) {
        return (
            <img
                src={slide.image_url}
                alt={slide.tag}
                className="w-full max-w-[520px] rounded-[24px] border border-white/15 object-cover shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]"
            />
        );
    }

    return null;
}

/**
 * Contenido de una diapositiva del baner. Se comparte entre el slider público
 * y la vista previa del panel para que ambos muestren exactamente el mismo diseño.
 */
export function HeroSlideStage({
    slide,
    preview = false,
}: {
    slide: HeroSlide;
    preview?: boolean;
}) {
    return (
        <div
            key={slide.id}
            className={cn(
                'grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14',
                !preview && 'animate-hero-in',
            )}
        >
            <div className="max-w-[640px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[0.7rem] font-extrabold tracking-[0.12em] text-upel-gold-light uppercase backdrop-blur-md">
                    {slide.tag}
                </span>

                <h1 className="mt-6 font-display text-[2.35rem] leading-[1.05] font-bold text-balance text-white sm:text-5xl lg:text-[3.65rem]">
                    {slide.title_start}{' '}
                    <span className="relative inline-block text-upel-gold-light">
                        {slide.title_highlight}
                        <svg
                            viewBox="0 0 220 12"
                            className="absolute -bottom-2 left-0 h-2.5 w-full text-upel-gold/60"
                            aria-hidden="true"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M2 9c40-6 90-8 216-4"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>{' '}
                    {slide.title_end}
                </h1>

                <p className="mt-6 max-w-[560px] text-base leading-relaxed text-pretty text-white/72 sm:text-lg">
                    {slide.description}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {slide.primary_url ? (
                        <a
                            href={preview ? undefined : slide.primary_url}
                            onClick={(event) => {
                                if (preview) {
                                    event.preventDefault();
                                }
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-6 py-3.5 text-sm font-extrabold text-upel-navy shadow-[0_16px_36px_-16px_rgba(201,162,39,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                        >
                            {slide.primary_label ??
                                PRIMARY_LABELS[slide.visual]}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </a>
                    ) : (
                        <a
                            href={
                                preview
                                    ? undefined
                                    : PRIMARY_ANCHORS[slide.visual]
                            }
                            onClick={(event) => {
                                if (preview) {
                                    event.preventDefault();
                                }
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-6 py-3.5 text-sm font-extrabold text-upel-navy shadow-[0_16px_36px_-16px_rgba(201,162,39,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                        >
                            {slide.primary_label ??
                                PRIMARY_LABELS[slide.visual]}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </a>
                    )}

                    <a
                        href={
                            preview
                                ? undefined
                                : (slide.secondary_url ??
                                  SECONDARY_ANCHORS[slide.visual])
                        }
                        onClick={(event) => {
                            if (preview) {
                                event.preventDefault();
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white/45 hover:bg-white/10"
                    >
                        <PlayCircle className="size-4" aria-hidden="true" />
                        {slide.secondary_label ??
                            SECONDARY_LABELS[slide.visual]}
                    </a>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.7rem] font-semibold text-white/55">
                    <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2
                            className="size-3.5 text-upel-gold-light"
                            aria-hidden="true"
                        />
                        Títulos reconocidos
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2
                            className="size-3.5 text-upel-gold-light"
                            aria-hidden="true"
                        />
                        Docentes de excelencia
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2
                            className="size-3.5 text-upel-gold-light"
                            aria-hidden="true"
                        />
                        Modalidad flexible
                    </span>
                </div>
            </div>

            <div className="flex justify-center lg:justify-end">
                <SlideVisual slide={slide} />
            </div>
        </div>
    );
}

export function HeroSlider({
    slides: publishedSlides = [],
}: {
    slides?: HeroSlide[];
}) {
    const slides =
        publishedSlides.length > 0 ? publishedSlides : fallbackSlides;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    const goTo = useCallback(
        (nextSlide: number) => {
            setIndex((nextSlide + slides.length) % slides.length);
        },
        [slides.length],
    );

    const next = useCallback(() => {
        setIndex((current) => (current + 1) % slides.length);
    }, [slides.length]);

    const previous = useCallback(() => {
        setIndex((current) => (current - 1 + slides.length) % slides.length);
    }, [slides.length]);

    // Autoplay de 7 segundos, en pausa al pasar el cursor o al ocultar la pestaña.
    useEffect(() => {
        if (paused) {
            return;
        }

        const interval = window.setInterval(next, 7000);

        return () => window.clearInterval(interval);
    }, [paused, next, index]);

    useEffect(() => {
        const handleVisibility = () => setPaused(document.hidden);

        document.addEventListener('visibilitychange', handleVisibility);

        return () =>
            document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const slide = slides[index];

    return (
        <section
            id="inicio"
            aria-roledescription="carrusel"
            aria-label="Presentación institucional de la UPEL"
            tabIndex={0}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    next();
                }

                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    previous();
                }
            }}
            className="relative isolate overflow-hidden bg-[linear-gradient(125deg,#071b30_0%,#0a2540_42%,#113a63_100%)] pt-[74px] outline-none"
        >
            {/* Fondo decorativo */}
            <div
                className="upel-grid absolute inset-0 -z-10 opacity-70"
                aria-hidden="true"
            />
            <div
                className="absolute -top-24 -left-32 -z-10 size-[30rem] rounded-full bg-upel-blue/25 blur-[120px]"
                aria-hidden="true"
            />
            <div
                className="absolute top-1/3 -right-40 -z-10 size-[34rem] rounded-full bg-upel-gold/12 blur-[130px]"
                aria-hidden="true"
            />
            <div
                className="absolute bottom-0 left-1/3 -z-10 h-64 w-64 rounded-full bg-upel-green/10 blur-[100px]"
                aria-hidden="true"
            />

            <div className="mx-auto flex min-h-[calc(100svh-74px)] w-full max-w-[1280px] flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <HeroSlideStage slide={slide} />

                {/* Controles del slider */}
                <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
                    <div
                        className="flex items-center gap-2"
                        role="tablist"
                        aria-label="Seleccionar diapositiva"
                    >
                        {slides.map((item, slideIndex) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={index === slideIndex}
                                aria-label={`Ir a la diapositiva ${slideIndex + 1}: ${item.tag}`}
                                onClick={() => goTo(slideIndex)}
                                className={cn(
                                    'h-2 rounded-full transition-all duration-300',
                                    index === slideIndex
                                        ? 'w-9 bg-upel-gold'
                                        : 'w-2 bg-white/25 hover:bg-white/50',
                                )}
                            />
                        ))}
                        <span className="ml-3 text-[0.68rem] font-bold text-white/40">
                            {String(index + 1).padStart(2, '0')} /{' '}
                            {String(slides.length).padStart(2, '0')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-1.5 text-[0.66rem] font-semibold text-white/40 sm:flex">
                            <Radio className="size-3.5" aria-hidden="true" />
                            {paused ? 'Pausado' : 'Reproducción automática'}
                        </div>
                        <button
                            type="button"
                            onClick={previous}
                            aria-label="Diapositiva anterior"
                            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/45 hover:bg-white/10"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Siguiente diapositiva"
                            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/45 hover:bg-white/10"
                        >
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
