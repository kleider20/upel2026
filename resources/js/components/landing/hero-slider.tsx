import { useCallback, useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    Laptop,
    LayoutDashboard,
    LogIn,
    MapPin,
    PlayCircle,
    Radio,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewsArt } from '@/components/landing/brand';
import { useCounter, formatNumber } from '@/hooks/use-counter';
import { pad, useCountdown } from '@/hooks/use-countdown';
import { create as admissionCreate } from '@/routes/admissions';

type SlideId =
    | 'institucional'
    | 'noticia'
    | 'congreso'
    | 'preinscripcion'
    | 'portal';

type Slide = {
    id: SlideId;
    tag: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd?: string;
    description: string;
};

const slides: Slide[] = [
    {
        id: 'institucional',
        tag: '🎓 Educación que transforma',
        titleStart: 'Formamos a los',
        titleHighlight: 'maestros',
        titleEnd: 'que construyen el futuro de Venezuela',
        description:
            'Más de 40 años de excelencia académica, investigación pedagógica y compromiso con la educación pública, ahora también en modalidad 100% online.',
    },
    {
        id: 'noticia',
        tag: '📰 Noticia del día',
        titleStart: 'La UPEL amplía su oferta',
        titleHighlight: '100% online',
        titleEnd: 'para el año 2027',
        description:
            'Cinco nuevas carreras de pregrado se suman al Campus Virtual, con acompañamiento docente, prácticas supervisadas y acceso desde cualquier lugar del país.',
    },
    {
        id: 'congreso',
        tag: '🌎 Evento internacional',
        titleStart: 'Congreso Internacional de',
        titleHighlight: 'Pedagogía',
        titleEnd: '2026',
        description:
            'Del 18 al 20 de noviembre, más de 40 países se reunirán en Caracas para compartir investigaciones sobre inclusión, tecnología y ciudadanía global.',
    },
    {
        id: 'preinscripcion',
        tag: '📝 Nuevo ingreso',
        titleStart: 'Preinscripciones',
        titleHighlight: '2027',
        titleEnd: 'abren el 2 de noviembre',
        description:
            'Prepara tus documentos y asegura tu cupo en la universidad de los educadores. El proceso será 100% en línea desde el portal de admisión.',
    },
    {
        id: 'portal',
        tag: '💻 Comunidad UPEL',
        titleStart: 'Tu',
        titleHighlight: 'portal estudiantil',
        titleEnd: 'en un solo lugar',
        description:
            'Consulta tus materias, notas, récord académico y servicios en línea. Los estudiantes regulares podrán inscribirse a partir del 12 de enero de 2027.',
    },
];

const COUNTDOWN_LABELS = ['Días', 'Horas', 'Min', 'Seg'] as const;

function CampusVirtualCard() {
    const students = useCounter(12_400, true, 1800);
    const subjects = useCounter(120, true, 1800);
    const satisfaction = useCounter(98, true, 1800);

    return (
        <div className="relative w-full max-w-[460px]">
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-upel-gold text-upel-navy">
                            <Laptop className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[0.68rem] font-extrabold tracking-[0.18em] text-upel-gold-light uppercase">
                                Campus Virtual
                            </p>
                            <p className="text-lg font-extrabold text-white">
                                UPEL en línea
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-green/20 px-2.5 py-1 text-[0.65rem] font-bold text-[#7ce3c8]">
                        <span className="size-1.5 animate-soft-pulse rounded-full bg-[#7ce3c8]" />
                        En vivo
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                        { value: students, suffix: '+', label: 'Conectados' },
                        { value: subjects, suffix: '+', label: 'Asignaturas' },
                        {
                            value: satisfaction,
                            suffix: '%',
                            label: 'Satisfacción',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl bg-white/8 px-3 py-3 text-center ring-1 ring-white/10"
                        >
                            <p className="text-xl font-extrabold text-white">
                                {formatNumber(stat.value)}
                                {stat.suffix}
                            </p>
                            <p className="mt-0.5 text-[0.62rem] font-semibold tracking-wide text-white/60 uppercase">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 space-y-3">
                    {[
                        { label: 'Clases en vivo', value: 78 },
                        { label: 'Aulas activas', value: 64 },
                    ].map((item) => (
                        <div key={item.label}>
                            <div className="mb-1.5 flex items-center justify-between text-[0.7rem] font-semibold text-white/70">
                                <span>{item.label}</span>
                                <span>{item.value}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-upel-gold to-upel-gold-light"
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-upel-navy/40 px-3.5 py-3 text-[0.72rem] text-white/70 ring-1 ring-white/10">
                    <CheckCircle2
                        className="size-4 shrink-0 text-upel-gold-light"
                        aria-hidden="true"
                    />
                    Títulos avalados por el Ministerio de Educación
                    Universitaria.
                </div>
            </div>

            <div className="absolute -top-5 -right-4 hidden animate-float rounded-2xl bg-white px-4 py-3 shadow-xl sm:block">
                <p className="flex items-center gap-2 text-[0.7rem] font-extrabold text-upel-navy">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-upel-green opacity-70" />
                        <span className="relative inline-flex size-2 rounded-full bg-upel-green" />
                    </span>
                    Clases en vivo ahora
                </p>
                <p className="mt-0.5 text-[0.62rem] text-upel-slate">
                    +1.200 estudiantes conectados
                </p>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden animate-float-slow rounded-2xl bg-upel-gold px-4 py-3 text-upel-navy shadow-xl sm:block">
                <p className="text-[0.68rem] font-extrabold tracking-wide uppercase">
                    8 núcleos
                </p>
                <p className="text-[0.62rem] font-semibold text-upel-navy/70">
                    en todo el país
                </p>
            </div>
        </div>
    );
}

function CountdownCard({
    target,
    label,
    caption,
}: {
    target: string;
    label: string;
    caption: string;
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
                {countdown.isPast
                    ? 'El período de inscripción está abierto.'
                    : 'El portal de admisión se habilita automáticamente.'}
            </div>
        </div>
    );
}

function PortalCard({ onLoginClick }: { onLoginClick: () => void }) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const user = auth?.user;

    return (
        <div className="w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/15 bg-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/10 bg-upel-navy/35 px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
                <span className="size-2.5 rounded-full bg-[#f5c451]" />
                <span className="size-2.5 rounded-full bg-[#4ecb8d]" />
                <span className="ml-3 flex-1 truncate rounded-md bg-white/10 px-2.5 py-1 text-[0.62rem] text-white/60">
                    campus.upel.edu.ve/estudiantes
                </span>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-upel-gold text-lg font-extrabold text-upel-navy">
                        {user ? user.name.slice(0, 2).toUpperCase() : 'MR'}
                    </span>
                    <div>
                        <p className="text-sm font-extrabold text-white">
                            {user ? user.name : 'María Rodríguez'}
                        </p>
                        <p className="text-[0.7rem] text-white/60">
                            {user
                                ? user.email
                                : 'Educación Integral · Semestre 6'}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                    {[
                        { label: 'Promedio', value: '18,4 / 20' },
                        { label: 'Materias', value: '6 activas' },
                        { label: 'Créditos', value: '148' },
                        { label: 'Estado', value: 'Regular' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10"
                        >
                            <p className="text-[0.58rem] font-bold tracking-widest text-white/45 uppercase">
                                {item.label}
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-white">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 space-y-2">
                    {[
                        { name: 'Didáctica General', progress: 82 },
                        { name: 'Evaluación Educativa', progress: 67 },
                    ].map((subject) => (
                        <div
                            key={subject.name}
                            className="rounded-xl bg-white/6 px-3 py-2.5"
                        >
                            <div className="flex items-center justify-between text-[0.68rem] font-semibold text-white/75">
                                <span>{subject.name}</span>
                                <span>{subject.progress}%</span>
                            </div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/12">
                                <div
                                    className="h-full rounded-full bg-upel-gold"
                                    style={{ width: `${subject.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (user) {
                            router.visit('/dashboard');
                        } else {
                            onLoginClick();
                        }
                    }}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-4 py-3 text-sm font-extrabold text-upel-navy transition-colors hover:bg-upel-gold-light"
                >
                    {user ? (
                        <LayoutDashboard
                            className="size-4"
                            aria-hidden="true"
                        />
                    ) : (
                        <LogIn className="size-4" aria-hidden="true" />
                    )}
                    {user ? 'Ir al Dashboard' : 'Ingresar al portal'}
                </button>
            </div>
        </div>
    );
}

function SlideVisual({
    id,
    onLoginClick,
    preEnrollmentOpensAt,
}: {
    id: SlideId;
    onLoginClick: () => void;
    preEnrollmentOpensAt: string;
}) {
    if (id === 'institucional') {
        return <CampusVirtualCard />;
    }

    if (id === 'noticia') {
        return (
            <div className="w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]">
                <div className="relative h-44 bg-[linear-gradient(135deg,#0a2540,#1e5fa8)]">
                    <NewsArt />
                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[0.62rem] font-extrabold tracking-wide text-upel-navy uppercase">
                        Académico
                    </span>
                    <Laptop
                        className="absolute right-6 bottom-5 size-14 text-white/85"
                        aria-hidden="true"
                    />
                </div>
                <div className="p-6">
                    <p className="flex items-center gap-2 text-[0.68rem] font-bold text-upel-slate">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        20 de octubre de 2026 · 4 min de lectura
                    </p>
                    <h3 className="mt-2 font-display text-xl leading-snug font-bold text-upel-navy">
                        Cinco carreras se suman al Campus Virtual en 2027
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-upel-slate">
                        Educación Inicial, Lengua y Literatura y Tecnología
                        Educativa estarán disponibles en modalidad 100% en
                        línea.
                    </p>
                    <a
                        href="#noticias"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-upel-blue hover:text-upel-navy"
                    >
                        Leer la noticia completa
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                </div>
            </div>
        );
    }

    if (id === 'congreso') {
        return (
            <div className="w-full max-w-[460px] rounded-[24px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[0.68rem] font-extrabold tracking-[0.18em] text-upel-gold-light uppercase">
                            Congreso Internacional
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold text-white">
                            Pedagogía 2026
                        </p>
                    </div>
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-upel-gold text-upel-navy">
                        <span className="text-[0.55rem] font-extrabold uppercase">
                            Nov
                        </span>
                        <span className="font-display text-xl leading-none font-bold">
                            18
                        </span>
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                        {
                            icon: MapPin,
                            label: 'Sede',
                            value: 'Caracas, Venezuela',
                        },
                        {
                            icon: Users,
                            label: 'Participantes',
                            value: '+3.500 docentes',
                        },
                        {
                            icon: GraduationCap,
                            label: 'Países',
                            value: '40 naciones',
                        },
                        { icon: Clock3, label: 'Duración', value: '3 días' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl bg-white/8 p-3 ring-1 ring-white/10"
                        >
                            <item.icon
                                className="size-4 text-upel-gold-light"
                                aria-hidden="true"
                            />
                            <p className="mt-2 text-[0.58rem] font-bold tracking-widest text-white/45 uppercase">
                                {item.label}
                            </p>
                            <p className="text-sm font-bold text-white">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-xl bg-upel-navy/40 px-4 py-3 text-[0.72rem] leading-relaxed text-white/70 ring-1 ring-white/10">
                    Conferencias magistrales, mesas de trabajo y talleres con
                    especialistas de América Latina y Europa.
                </div>
            </div>
        );
    }

    if (id === 'preinscripcion') {
        return (
            <CountdownCard
                target={preEnrollmentOpensAt}
                label="Apertura de preinscripciones"
                caption="2 de noviembre de 2026 · 8:00 AM (GMT-4). Ten a mano tu cédula, título de bachiller y notas certificadas."
            />
        );
    }

    return <PortalCard onLoginClick={onLoginClick} />;
}

export function HeroSlider({
    canRegister,
    preEnrollmentOpensAt,
    onLoginClick,
}: {
    canRegister: boolean;
    preEnrollmentOpensAt: string;
    onLoginClick: () => void;
}) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    const goTo = useCallback((next: number) => {
        setIndex((next + slides.length) % slides.length);
    }, []);

    const next = useCallback(() => {
        setIndex((current) => (current + 1) % slides.length);
    }, []);

    const previous = useCallback(() => {
        setIndex((current) => (current - 1 + slides.length) % slides.length);
    }, []);

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
                <div
                    key={slide.id}
                    className="grid animate-hero-in items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14"
                >
                    <div className="max-w-[640px]">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[0.7rem] font-extrabold tracking-[0.12em] text-upel-gold-light uppercase backdrop-blur-md">
                            {slide.tag}
                        </span>

                        <h1 className="mt-6 font-display text-[2.35rem] leading-[1.05] font-bold text-balance text-white sm:text-5xl lg:text-[3.65rem]">
                            {slide.titleStart}{' '}
                            <span className="relative inline-block text-upel-gold-light">
                                {slide.titleHighlight}
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
                            {slide.titleEnd}
                        </h1>

                        <p className="mt-6 max-w-[560px] text-base leading-relaxed text-pretty text-white/72 sm:text-lg">
                            {slide.description}
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            {slide.id === 'portal' ? (
                                <button
                                    type="button"
                                    onClick={onLoginClick}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-6 py-3.5 text-sm font-extrabold text-upel-navy shadow-[0_16px_36px_-16px_rgba(201,162,39,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                                >
                                    <LogIn
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Ingresar al portal
                                </button>
                            ) : slide.id === 'preinscripcion' ? (
                                <a
                                    href={
                                        canRegister
                                            ? admissionCreate.url()
                                            : '#carreras'
                                    }
                                    aria-disabled={!canRegister}
                                    onClick={(event) => {
                                        if (!canRegister) {
                                            event.preventDefault();
                                        }
                                    }}
                                    className={cn(
                                        'inline-flex items-center justify-center gap-2 rounded-[13px] px-6 py-3.5 text-sm font-extrabold transition-all duration-300',
                                        canRegister
                                            ? 'bg-upel-gold text-upel-navy shadow-[0_16px_36px_-16px_rgba(201,162,39,0.9)] hover:-translate-y-0.5 hover:bg-upel-gold-light'
                                            : 'cursor-not-allowed bg-white/12 text-white/45 ring-1 ring-white/12',
                                    )}
                                >
                                    {canRegister
                                        ? 'Preinscríbete ahora'
                                        : 'Preinscripciones cerradas'}
                                </a>
                            ) : (
                                <a
                                    href={
                                        slide.id === 'congreso'
                                            ? '#cursos'
                                            : '#carreras'
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-gold px-6 py-3.5 text-sm font-extrabold text-upel-navy shadow-[0_16px_36px_-16px_rgba(201,162,39,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                                >
                                    {slide.id === 'noticia'
                                        ? 'Leer la noticia'
                                        : slide.id === 'congreso'
                                          ? 'Ver programa académico'
                                          : 'Explora nuestras carreras'}
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </a>
                            )}

                            <a
                                href={
                                    slide.id === 'portal'
                                        ? '#graduaciones'
                                        : slide.id === 'preinscripcion'
                                          ? '#carreras'
                                          : '#nosotros'
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white/45 hover:bg-white/10"
                            >
                                {slide.id === 'portal' ? (
                                    <CalendarDays
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <PlayCircle
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                )}
                                {slide.id === 'portal'
                                    ? 'Ver calendario'
                                    : slide.id === 'preinscripcion'
                                      ? 'Requisitos de ingreso'
                                      : 'Conoce la UPEL'}
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
                        <SlideVisual
                            id={slide.id}
                            onLoginClick={onLoginClick}
                            preEnrollmentOpensAt={preEnrollmentOpensAt}
                        />
                    </div>
                </div>

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
