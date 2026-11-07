import {
    Award,
    BookOpen,
    Headphones,
    Video,
    type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

type OnlineFeature = {
    title: string;
    subtitle: string;
    description: string;
    icon: LucideIcon;
    items: string[];
};

const features: OnlineFeature[] = [
    {
        title: 'Materias en línea',
        subtitle: '120+ asignaturas',
        description:
            'Todo el currículo de tu carrera disponible en el campus virtual, con materiales interactivos y actividades autoevaluables.',
        icon: BookOpen,
        items: [
            'Contenidos actualizados',
            'Acceso 24/7',
            'Recursos multimedia',
        ],
    },
    {
        title: 'Cursos certificados',
        subtitle: 'Certificación digital',
        description:
            'Diplomados y cursos de extensión con certificados verificables, ideales para tu crecimiento profesional.',
        icon: Award,
        items: [
            'Certificado verificable',
            'Modalidad flexible',
            'Docentes expertos',
        ],
    },
    {
        title: 'Talleres interactivos',
        subtitle: 'Sesiones en vivo',
        description:
            'Encuentros sincrónicos con especialistas para practicar, debatir y construir aprendizaje en comunidad.',
        icon: Video,
        items: [
            'Clases en vivo',
            'Grabaciones disponibles',
            'Trabajo colaborativo',
        ],
    },
    {
        title: 'Acompañamiento total',
        subtitle: 'Soporte 7 días',
        description:
            'Tutorías académicas, orientación vocacional y soporte técnico para que nunca te sientas solo en tu proceso.',
        icon: Headphones,
        items: [
            'Tutorías personalizadas',
            'Soporte técnico',
            'Bienestar estudiantil',
        ],
    },
];

/**
 * Sección de modalidad online con estética glassmorphism sobre fondo navy.
 */
export function OnlineMode() {
    return (
        <section
            id="online"
            className="relative scroll-mt-24 overflow-hidden bg-[linear-gradient(135deg,#071b30_0%,#0a2540_45%,#113a63_100%)] py-20 sm:py-24 lg:py-28"
        >
            <div
                className="upel-grid absolute inset-0 opacity-60"
                aria-hidden="true"
            />
            <div
                className="absolute -top-32 left-1/4 size-[28rem] rounded-full bg-upel-blue/20 blur-[120px]"
                aria-hidden="true"
            />
            <div
                className="absolute -right-32 bottom-0 size-[26rem] rounded-full bg-upel-gold/10 blur-[110px]"
                aria-hidden="true"
            />

            <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionHeading
                        tone="light"
                        eyebrow="Modalidad Online"
                        title="La UPEL va contigo, estés donde estés"
                        description="Estudia desde cualquier lugar de Venezuela con una experiencia académica completa: clases en vivo, materiales digitales, tutorías y certificación oficial."
                    />
                </Reveal>

                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <Reveal key={feature.title} delay={index * 90}>
                            <article className="group h-full rounded-[20px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-upel-gold/45 hover:bg-white/[0.1]">
                                <span className="flex size-12 items-center justify-center rounded-2xl bg-upel-gold/15 text-upel-gold-light ring-1 ring-upel-gold/25 transition-colors duration-300 group-hover:bg-upel-gold group-hover:text-upel-navy">
                                    <feature.icon
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>

                                <p className="mt-5 text-[0.62rem] font-extrabold tracking-[0.16em] text-upel-gold-light uppercase">
                                    {feature.subtitle}
                                </p>
                                <h3 className="mt-1 font-display text-xl font-bold text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-[0.83rem] leading-relaxed text-white/62">
                                    {feature.description}
                                </p>

                                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                                    {feature.items.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-2 text-[0.73rem] font-semibold text-white/70"
                                        >
                                            <span
                                                className="size-1.5 rounded-full bg-upel-gold"
                                                aria-hidden="true"
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={200}>
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[20px] border border-white/12 bg-white/[0.06] px-6 py-5 backdrop-blur-md sm:flex-row">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-upel-green/20 text-[#7ce3c8]">
                                <span className="size-2 animate-soft-pulse rounded-full bg-[#7ce3c8]" />
                            </span>
                            <p className="text-sm font-semibold text-white/75">
                                <strong className="font-extrabold text-white">
                                    Campus activo:
                                </strong>{' '}
                                1.200 estudiantes conectados en este momento.
                            </p>
                        </div>
                        <a
                            href="#carreras"
                            className="inline-flex shrink-0 items-center gap-2 rounded-[13px] border border-white/25 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:border-upel-gold/60 hover:bg-white/10"
                        >
                            Ver carreras online
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
