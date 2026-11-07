import { CalendarDays, Clock3, MapPin, PartyPopper, Users } from 'lucide-react';
import { formatNumber, useCounter } from '@/hooks/use-counter';
import { pad, useCountdown } from '@/hooks/use-countdown';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import {
    DiplomaArt,
    GraduationCapArt,
    GraduationScene,
} from '@/components/landing/brand';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

const graduationStats = [
    { label: 'Graduandos 2026', value: 1_200, suffix: '' },
    { label: 'Egresados históricos', value: 98_500, suffix: '+' },
    { label: 'Núcleos e institutos', value: 8, suffix: '' },
    { label: 'Años de trayectoria', value: 40, suffix: '+' },
];

function GraduationStat({
    stat,
    active,
}: {
    stat: (typeof graduationStats)[number];
    active: boolean;
}) {
    const value = useCounter(stat.value, active);

    return (
        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-[0_8px_24px_-20px_rgba(10,37,64,0.35)] backdrop-blur-sm">
            <p className="font-display text-2xl leading-none font-bold text-upel-navy tabular-nums">
                {formatNumber(value)}
                {stat.suffix}
            </p>
            <p className="mt-1 text-[0.62rem] font-extrabold tracking-wide text-upel-slate uppercase">
                {stat.label}
            </p>
        </div>
    );
}

/**
 * Sección de graduaciones con cuenta regresiva al acto de grado.
 */
export function Graduations({ graduationDate }: { graduationDate: string }) {
    const countdown = useCountdown(graduationDate);
    const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
        threshold: 0.2,
    });

    const countdownParts = [
        { label: 'Días', value: countdown.days },
        { label: 'Horas', value: countdown.hours },
        { label: 'Minutos', value: countdown.minutes },
        { label: 'Segundos', value: countdown.seconds },
    ];

    return (
        <section
            id="graduaciones"
            className="relative scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#f6f8fa_0%,#eaf0f8_100%)] py-20 sm:py-24 lg:py-28"
        >
            <div
                className="absolute -top-24 right-0 size-[26rem] rounded-full bg-upel-gold/10 blur-[100px]"
                aria-hidden="true"
            />
            <div
                className="absolute bottom-0 -left-24 size-[22rem] rounded-full bg-upel-blue/10 blur-[90px]"
                aria-hidden="true"
            />

            <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="Graduaciones"
                        title="Un logro que celebra toda una vida"
                        description="Cada año, miles de nuevos educadores reciben su título y comienzan a transformar aulas, comunidades y futuros."
                    />
                </Reveal>

                <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
                    <Reveal>
                        <div ref={ref} className="grid grid-cols-2 gap-3">
                            {graduationStats.map((stat) => (
                                <GraduationStat
                                    key={stat.label}
                                    stat={stat}
                                    active={isIntersecting}
                                />
                            ))}
                        </div>

                        <div className="mt-6 rounded-[20px] border border-white/80 bg-white/85 p-6 shadow-[0_18px_44px_-30px_rgba(10,37,64,0.35)] backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-upel-gold/15 text-upel-navy">
                                    <PartyPopper
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <p className="text-[0.62rem] font-extrabold tracking-[0.16em] text-upel-gold uppercase">
                                        Próximo acto de grado
                                    </p>
                                    <h3 className="mt-1 font-display text-xl font-bold text-upel-navy">
                                        Promoción “Maestros que transforman”
                                    </h3>
                                    <ul className="mt-3 space-y-1.5 text-[0.78rem] font-semibold text-upel-slate">
                                        <li className="flex items-center gap-2">
                                            <CalendarDays
                                                className="size-3.5 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            12 de diciembre de 2026
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Clock3
                                                className="size-3.5 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            9:00 AM (GMT-4)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <MapPin
                                                className="size-3.5 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            Auditorio del Rectorado, Caracas
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-upel-mist pt-4">
                                <p className="mb-2 flex items-center gap-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-upel-slate uppercase">
                                    <Clock3
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    Cuenta regresiva
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {countdownParts.map((part) => (
                                        <div
                                            key={part.label}
                                            className="rounded-xl bg-upel-navy px-2 py-3 text-center"
                                        >
                                            <p className="font-display text-xl font-bold text-white tabular-nums">
                                                {pad(part.value)}
                                            </p>
                                            <p className="mt-0.5 text-[0.52rem] font-bold tracking-widest text-white/55 uppercase">
                                                {part.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-center text-[0.65rem] font-semibold text-upel-slate">
                                    {countdown.isPast
                                        ? '¡El acto de grado se está celebrando!'
                                        : 'Faltan pocas semanas para el gran día.'}
                                </p>
                            </div>

                            <a
                                href="#contacto"
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-navy-800"
                            >
                                <Users className="size-4" aria-hidden="true" />
                                Consulta el listado de graduandos
                            </a>
                        </div>
                    </Reveal>

                    <Reveal delay={140} className="relative">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 overflow-hidden rounded-[24px] shadow-[0_30px_60px_-34px_rgba(10,37,64,0.5)]">
                                <GraduationScene />
                            </div>
                            <div className="overflow-hidden rounded-[20px] shadow-[0_18px_40px_-26px_rgba(10,37,64,0.4)]">
                                <GraduationCapArt />
                            </div>
                            <div className="overflow-hidden rounded-[20px] shadow-[0_18px_40px_-26px_rgba(10,37,64,0.4)]">
                                <DiplomaArt />
                            </div>
                        </div>

                        <div className="absolute -top-4 -right-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-22px_rgba(10,37,64,0.45)] ring-1 ring-upel-mist">
                            <span className="flex size-11 flex-col items-center justify-center rounded-xl bg-upel-gold text-upel-navy">
                                <span className="text-[0.5rem] font-extrabold uppercase">
                                    Dic
                                </span>
                                <span className="font-display text-lg leading-none font-bold">
                                    12
                                </span>
                            </span>
                            <div>
                                <p className="text-[0.6rem] font-bold tracking-widest text-upel-slate uppercase">
                                    Acto de grado
                                </p>
                                <p className="text-sm font-extrabold text-upel-navy">
                                    2026
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
