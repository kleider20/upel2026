import { ArrowRight, Check, Landmark, Sparkles } from 'lucide-react';
import {
    CampusIllustration,
    ImpmSeal,
    UpelSeal,
} from '@/components/landing/brand';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

const benefits = [
    '8 núcleos e institutos en todo el territorio nacional',
    'Títulos acreditados y reconocidos por el Estado venezolano',
    'Investigación pedagógica con impacto en las comunidades',
    'Acompañamiento académico y bienestar estudiantil',
];

/**
 * Sección institucional: historia, beneficios y sellos UPEL / IMPM.
 */
export function About() {
    return (
        <section
            id="nosotros"
            className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                    <Reveal>
                        <SectionHeading
                            align="left"
                            eyebrow="Nosotros"
                            title="Una universidad que forma educadores desde 1983"
                            description="La UPEL nació para garantizar la formación de docentes en Venezuela. Hoy combina tradición, investigación y tecnología para llevar una educación de calidad a cada rincón del país."
                        />

                        <ul className="mt-8 space-y-4">
                            {benefits.map((benefit) => (
                                <li
                                    key={benefit}
                                    className="flex items-start gap-3"
                                >
                                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-upel-green/12 text-upel-green">
                                        <Check
                                            className="size-3.5"
                                            strokeWidth={3}
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="text-[0.95rem] leading-relaxed font-semibold text-upel-navy/85">
                                        {benefit}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <a
                                href="#carreras"
                                className="inline-flex items-center gap-2 rounded-[13px] bg-upel-navy px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_18px_36px_-18px_rgba(10,37,64,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-navy-800"
                            >
                                Explora nuestra oferta académica
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </a>

                            <span className="inline-flex items-center gap-2 text-xs font-bold text-upel-slate">
                                <Sparkles
                                    className="size-4 text-upel-gold"
                                    aria-hidden="true"
                                />
                                Más de 40 años de trayectoria
                            </span>
                        </div>
                    </Reveal>

                    <Reveal delay={120} className="relative">
                        <div className="relative overflow-hidden rounded-[28px] border border-upel-mist bg-upel-cloud p-3 shadow-[0_30px_70px_-38px_rgba(10,37,64,0.4)]">
                            <CampusIllustration />
                        </div>

                        <div className="absolute -top-5 -left-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_45px_-20px_rgba(10,37,64,0.5)] ring-1 ring-upel-mist sm:-left-5">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-upel-gold/15 text-upel-navy">
                                <Landmark
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <p className="font-display text-xl leading-none font-bold text-upel-navy">
                                    40+
                                </p>
                                <p className="text-[0.65rem] font-bold tracking-wide text-upel-slate uppercase">
                                    Años de excelencia
                                </p>
                            </div>
                        </div>

                        <div className="absolute -right-2 bottom-6 hidden rounded-2xl bg-upel-navy px-4 py-3 text-white shadow-xl sm:block lg:-right-4">
                            <p className="text-[0.62rem] font-bold tracking-widest text-upel-gold-light uppercase">
                                Sede central
                            </p>
                            <p className="mt-0.5 text-sm font-extrabold">
                                Caracas, Venezuela
                            </p>
                        </div>
                    </Reveal>
                </div>

                {/* Sellos institucionales */}
                <div className="mt-20 sm:mt-24">
                    <Reveal>
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <span className="text-[0.7rem] font-extrabold tracking-[0.18em] text-upel-gold uppercase">
                                    Sellos institucionales
                                </span>
                                <h3 className="mt-2 font-display text-2xl font-bold text-upel-navy sm:text-3xl">
                                    Dos instituciones, un mismo compromiso
                                </h3>
                            </div>
                            <p className="max-w-md text-sm leading-relaxed text-upel-slate">
                                La UPEL y el IMPM articulan esfuerzos para
                                fortalecer la formación inicial y permanente del
                                magisterio venezolano.
                            </p>
                        </div>
                    </Reveal>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <Reveal delay={80}>
                            <article className="group h-full rounded-[20px] border border-upel-mist bg-upel-cloud/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-upel-gold/35 hover:bg-white hover:shadow-[0_28px_60px_-32px_rgba(10,37,64,0.4)] sm:p-8">
                                <UpelSeal className="h-32 sm:h-40" />
                                <p className="mt-6 text-sm leading-relaxed text-upel-slate">
                                    <strong className="font-extrabold text-upel-navy">
                                        Universidad Pedagógica Experimental
                                        Libertador.
                                    </strong>{' '}
                                    Rectorado y red nacional de institutos
                                    pedagógicos dedicados a la formación
                                    docente, la investigación y la extensión
                                    universitaria.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {[
                                        'Pregrado',
                                        'Postgrado',
                                        'Investigación',
                                    ].map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-upel-mist"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        </Reveal>

                        <Reveal delay={160}>
                            <article className="group h-full rounded-[20px] border border-upel-mist bg-upel-cloud/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-upel-gold/35 hover:bg-white hover:shadow-[0_28px_60px_-32px_rgba(10,37,64,0.4)] sm:p-8">
                                <ImpmSeal className="h-32 sm:h-40" />
                                <p className="mt-6 text-sm leading-relaxed text-upel-slate">
                                    <strong className="font-extrabold text-upel-navy">
                                        Instituto de Mejoramiento Profesional
                                        del Magisterio.
                                    </strong>{' '}
                                    Formación permanente, actualización y
                                    especialización de docentes en servicio, con
                                    programas pertinentes a las necesidades del
                                    sistema educativo.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {[
                                        'Extensión',
                                        'Especializaciones',
                                        'Actualización',
                                    ].map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-upel-mist"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
