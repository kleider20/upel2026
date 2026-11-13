import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Clock3, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    modalityLabels,
    modalityStyles,
    type CareerModality,
    type LandingCareer,
} from '@/data/careers';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

type Filter = 'todas' | CareerModality;

const filters: { value: Filter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'online', label: 'Online' },
    { value: 'mixta', label: 'Semipresencial' },
    { value: 'presencial', label: 'Presencial' },
];

/**
 * Catálogo de carreras ofertadas con filtro por modalidad.
 * Los datos llegan desde la base de datos a través de LandingController.
 */
export function Careers({ careers }: { careers: LandingCareer[] }) {
    const [filter, setFilter] = useState<Filter>('todas');

    const visibleCareers =
        filter === 'todas'
            ? careers
            : careers.filter((career) => career.modality === filter);

    return (
        <section
            id="carreras"
            className="scroll-mt-24 bg-upel-cloud py-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="Oferta académica"
                        title="Carreras que transforman vidas"
                        description="Programas de pregrado diseñados para formar profesionales de la educación con visión crítica, sensibilidad social y dominio de las nuevas tecnologías."
                    />
                </Reveal>

                <Reveal delay={80}>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
                        {filters.map((item) => {
                            const count =
                                item.value === 'todas'
                                    ? careers.length
                                    : careers.filter(
                                          (career) =>
                                              career.modality === item.value,
                                      ).length;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setFilter(item.value)}
                                    aria-pressed={filter === item.value}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-[50px] border px-4 py-2.5 text-[0.8rem] font-extrabold transition-all duration-300',
                                        filter === item.value
                                            ? 'border-upel-navy bg-upel-navy text-white shadow-[0_12px_24px_-14px_rgba(10,37,64,0.7)]'
                                            : 'border-upel-mist bg-white text-upel-navy hover:border-upel-navy/25 hover:bg-upel-cloud',
                                    )}
                                >
                                    {item.label}
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold',
                                            filter === item.value
                                                ? 'bg-white/15 text-white'
                                                : 'bg-upel-navy/6 text-upel-slate',
                                        )}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Reveal>

                {visibleCareers.length === 0 ? (
                    <Reveal delay={120}>
                        <div className="mt-10 rounded-[20px] border border-dashed border-upel-mist bg-white px-6 py-12 text-center">
                            <p className="text-sm font-bold text-upel-navy">
                                No hay carreras disponibles en esta modalidad.
                            </p>
                            <p className="mt-1 text-xs text-upel-slate">
                                Cambia el filtro para consultar la oferta
                                académica vigente.
                            </p>
                        </div>
                    </Reveal>
                ) : (
                    <div
                        key={filter}
                        className="mt-10 grid animate-fade-up gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {visibleCareers.map((career, index) => (
                            <article
                                key={career.id}
                                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-upel-mist bg-white shadow-[0_8px_24px_-18px_rgba(10,37,64,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-upel-gold/30 hover:shadow-[0_28px_50px_-28px_rgba(10,37,64,0.35)]"
                                style={{
                                    animationDelay: `${Math.min(index * 45, 360)}ms`,
                                }}
                            >
                                <span
                                    className="absolute inset-x-0 top-0 z-10 h-[3px] w-0 bg-gradient-to-r from-upel-gold to-upel-gold-light transition-all duration-500 group-hover:w-full"
                                    aria-hidden="true"
                                />

                                {career.image_url ? (
                                    <div className="aspect-[16/9] w-full overflow-hidden bg-upel-cloud">
                                        <img
                                            src={career.image_url}
                                            alt={`Imagen de la carrera ${career.name}`}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    </div>
                                ) : null}

                                <div className="flex flex-1 flex-col p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="flex size-12 items-center justify-center rounded-2xl bg-upel-cloud text-2xl ring-1 ring-upel-mist">
                                            <span aria-hidden="true">
                                                {career.icon}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold tracking-wide uppercase',
                                                modalityStyles[career.modality],
                                            )}
                                        >
                                            {modalityLabels[career.modality]}
                                        </span>
                                    </div>

                                    <h3 className="mt-5 font-display text-xl leading-snug font-bold text-upel-navy">
                                        {career.name}
                                    </h3>
                                    <p className="mt-2 flex-1 text-[0.83rem] leading-relaxed text-upel-slate">
                                        {career.description ??
                                            'Consulta el plan de estudios y las modalidades disponibles para esta carrera.'}
                                    </p>

                                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-upel-mist pt-4 text-[0.7rem] font-bold text-upel-slate">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock3
                                                className="size-3.5 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            {career.duration}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <GraduationCap
                                                className="size-3.5 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            {career.degree}
                                        </span>
                                    </div>

                                    <Link
                                        href={career.show_url}
                                        className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-extrabold text-upel-blue transition-colors hover:text-upel-navy"
                                    >
                                        Conocer más
                                        <ArrowRight
                                            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <Reveal delay={120}>
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[20px] border border-upel-mist bg-white px-6 py-5 sm:flex-row">
                        <p className="text-sm font-semibold text-upel-slate">
                            ¿Necesitas orientación para elegir tu carrera?
                            Nuestro equipo de admisión puede ayudarte.
                        </p>
                        <a
                            href="#contacto"
                            className="inline-flex shrink-0 items-center gap-2 rounded-[13px] bg-upel-gold px-5 py-3 text-sm font-extrabold text-upel-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                        >
                            Solicitar orientación
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
