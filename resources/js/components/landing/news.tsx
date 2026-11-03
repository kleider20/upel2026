import {
    ArrowRight,
    CalendarDays,
    CalendarPlus,
    Globe2,
    GraduationCap,
    Handshake,
    Laptop,
    Trophy,
    type LucideIcon,
} from 'lucide-react';
import { news, type NewsIcon } from '@/data/news';
import { NewsArt } from '@/components/landing/brand';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

const newsIcons: Record<NewsIcon, LucideIcon> = {
    laptop: Laptop,
    graduation: GraduationCap,
    globe: Globe2,
    trophy: Trophy,
    handshake: Handshake,
    calendar: CalendarPlus,
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
 * Noticias institucionales. Cada tarjeta usa un gradiente único
 * y una ilustración SVG generada.
 */
export function News() {
    return (
        <section id="noticias" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Actualidad UPEL"
                            title="Noticias y novedades"
                            description="Conoce los avances académicos, científicos y comunitarios de nuestra universidad."
                            className="max-w-2xl"
                        />
                        <a
                            href="#noticias"
                            className="inline-flex shrink-0 items-center gap-2 rounded-[13px] border border-upel-mist bg-white px-5 py-3 text-sm font-bold text-upel-navy transition-colors hover:border-upel-navy/25 hover:bg-upel-cloud"
                        >
                            Ver todas las noticias
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </a>
                    </div>
                </Reveal>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {news.map((item, index) => {
                        const Icon = newsIcons[item.icon];

                        return (
                            <Reveal key={item.id} delay={index * 70}>
                                <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-upel-mist bg-white shadow-[0_10px_28px_-24px_rgba(10,37,64,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-32px_rgba(10,37,64,0.4)]">
                                    <div
                                        className="relative h-44 overflow-hidden"
                                        style={{ backgroundImage: item.gradient }}
                                    >
                                        <NewsArt />
                                        <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[0.6rem] font-extrabold tracking-wide text-upel-navy uppercase">
                                            {item.category}
                                        </span>
                                        <Icon
                                            className="absolute right-5 bottom-4 size-12 text-white/75 transition-transform duration-500 group-hover:scale-110 group-hover:text-white"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <p className="flex items-center gap-2 text-[0.68rem] font-bold text-upel-slate">
                                            <CalendarDays className="size-3.5 text-upel-blue" aria-hidden="true" />
                                            {formatDate(item.date)}
                                        </p>
                                        <h3 className="font-display mt-2 text-lg leading-snug font-bold text-upel-navy">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 flex-1 text-[0.8rem] leading-relaxed text-upel-slate">
                                            {item.excerpt}
                                        </p>
                                        <a
                                            href="#noticias"
                                            aria-label={`Leer más sobre ${item.title}`}
                                            className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-extrabold text-upel-blue transition-colors hover:text-upel-navy"
                                        >
                                            Leer más
                                            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                                        </a>
                                    </div>
                                </article>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
