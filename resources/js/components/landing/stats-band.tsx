import { Building2, GraduationCap, UserRound, Users } from 'lucide-react';
import { formatNumber, useCounter } from '@/hooks/use-counter';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

type Stat = {
    label: string;
    value: number;
    suffix: string;
    icon: typeof GraduationCap;
};

const stats: Stat[] = [
    {
        label: 'Alumnos graduados',
        value: 98_500,
        suffix: '+',
        icon: GraduationCap,
    },
    {
        label: 'Estudiantes activos',
        value: 42_300,
        suffix: '+',
        icon: Users,
    },
    {
        label: 'Profesores',
        value: 1_850,
        suffix: '+',
        icon: UserRound,
    },
    {
        label: 'Institutos y núcleos',
        value: 8,
        suffix: '',
        icon: Building2,
    },
];

function StatCard({ stat, active }: { stat: Stat; active: boolean }) {
    const value = useCounter(stat.value, active);

    return (
        <div className="group relative flex items-start gap-4 px-5 py-6 transition-colors duration-300 sm:px-6">
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-upel-navy/5 text-upel-blue transition-colors duration-300 group-hover:bg-upel-gold/15 group-hover:text-upel-navy">
                <stat.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
                <p className="font-display text-3xl leading-none font-bold text-upel-navy tabular-nums lg:text-[2.15rem]">
                    {formatNumber(value)}
                    {stat.suffix}
                </p>
                <p className="mt-1.5 text-[0.78rem] font-bold tracking-wide text-upel-slate uppercase">
                    {stat.label}
                </p>
            </div>
        </div>
    );
}

/**
 * Banda de métricas institucionales. Los contadores se activan
 * una sola vez, cuando la banda entra en el viewport.
 */
export function StatsBand() {
    const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
        threshold: 0.3,
    });

    return (
        <section aria-label="Cifras institucionales" className="relative z-20 -mt-8 px-4 sm:px-6 lg:-mt-12 lg:px-8">
            <div
                ref={ref}
                className="relative mx-auto grid max-w-[1280px] overflow-hidden rounded-[24px] border border-upel-mist bg-white shadow-[0_28px_60px_-32px_rgba(10,37,64,0.35)] sm:grid-cols-2 lg:grid-cols-4"
            >
                <div className="absolute inset-x-8 top-0 hidden h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-upel-gold to-transparent lg:block" />

                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={
                            index < stats.length - 1
                                ? 'border-b border-upel-mist sm:border-r sm:last:border-r-0 lg:border-b-0'
                                : ''
                        }
                    >
                        <StatCard stat={stat} active={isIntersecting} />
                    </div>
                ))}
            </div>
        </section>
    );
}
