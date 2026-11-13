import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    Clock3,
    GraduationCap,
    Layers,
    Sun,
} from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { LandingErrorBoundary } from '@/components/landing/landing-error-boundary';
import { Navbar } from '@/components/landing/navbar';
import { Reveal } from '@/components/landing/reveal';
import { cn } from '@/lib/utils';
import { create as admissionCreate } from '@/routes/admissions';
import {
    modalityLabels,
    modalityStyles,
    type CareerModality,
    type LandingPensumPeriod,
} from '@/data/careers';

type CareerOffering = {
    id: number;
    modality: string;
    modality_label: string;
    schedule: string;
    schedule_label: string;
    shift: string;
    shift_label: string;
};

type CareerDetail = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    degree: string;
    icon: string;
    image_url: string | null;
    modality: CareerModality;
    duration: string;
    duration_semesters: number;
    subjects_count: number;
    credits_total: number;
    offerings: CareerOffering[];
};

type Props = {
    canRegister: boolean;
    preEnrollmentOpensAt: string;
    career: CareerDetail;
    pensum: LandingPensumPeriod[];
};

/**
 * Página pública con la información ampliada y el pensum de una carrera.
 */
export default function LandingCareer({
    canRegister,
    preEnrollmentOpensAt,
    career,
    pensum,
}: Props) {
    const periods = pensum.length;

    return (
        <>
            <Head title={`${career.name} - UPEL`}>
                <meta
                    name="description"
                    content={
                        career.description ??
                        `Conoce el pensum y las modalidades de ${career.name} en la UPEL.`
                    }
                />
            </Head>

            <div className="landing-page min-h-screen bg-white">
                <a href="#contenido" className="skip-link">
                    Saltar al contenido principal
                </a>

                <Navbar
                    onLoginClick={() => router.visit('/login')}
                    canRegister={canRegister}
                    registrationOpensAt={preEnrollmentOpensAt}
                />

                <LandingErrorBoundary>
                    <main id="contenido" className="pt-[74px]">
                        <section className="relative overflow-hidden bg-upel-navy text-white">
                            <div
                                className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-upel-blue/30 blur-3xl"
                                aria-hidden="true"
                            />
                            <div
                                className="pointer-events-none absolute -bottom-40 -left-20 size-[360px] rounded-full bg-upel-gold/15 blur-3xl"
                                aria-hidden="true"
                            />

                            <div className="relative mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
                                <div>
                                    <a
                                        href="/#carreras"
                                        className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-white/70 transition-colors hover:text-white"
                                    >
                                        <ArrowLeft
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        Volver a carreras
                                    </a>

                                    <div className="mt-5 flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold tracking-wide uppercase',
                                                modalityStyles[career.modality],
                                            )}
                                        >
                                            {modalityLabels[career.modality]}
                                        </span>
                                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6rem] font-extrabold tracking-wide text-white/80 uppercase ring-1 ring-white/15">
                                            Código {career.code}
                                        </span>
                                    </div>

                                    <h1 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl">
                                        {career.name}
                                    </h1>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                                        {career.description ??
                                            'Consulta el plan de estudios, las modalidades y los períodos académicos de esta carrera.'}
                                    </p>

                                    <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <dt className="flex items-center gap-1.5 text-[0.62rem] font-bold tracking-[0.12em] text-white/50 uppercase">
                                                <Clock3
                                                    className="size-3.5 text-upel-gold-light"
                                                    aria-hidden="true"
                                                />
                                                Duración
                                            </dt>
                                            <dd className="mt-1 text-sm font-bold">
                                                {career.duration}
                                            </dd>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <dt className="flex items-center gap-1.5 text-[0.62rem] font-bold tracking-[0.12em] text-white/50 uppercase">
                                                <GraduationCap
                                                    className="size-3.5 text-upel-gold-light"
                                                    aria-hidden="true"
                                                />
                                                Título
                                            </dt>
                                            <dd className="mt-1 text-sm font-bold">
                                                {career.degree}
                                            </dd>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <dt className="flex items-center gap-1.5 text-[0.62rem] font-bold tracking-[0.12em] text-white/50 uppercase">
                                                <Layers
                                                    className="size-3.5 text-upel-gold-light"
                                                    aria-hidden="true"
                                                />
                                                Períodos
                                            </dt>
                                            <dd className="mt-1 text-sm font-bold">
                                                {career.duration_semesters}
                                            </dd>
                                        </div>
                                    </dl>

                                    <div className="mt-7 flex flex-wrap items-center gap-3">
                                        <a
                                            href={
                                                canRegister
                                                    ? admissionCreate.url()
                                                    : '/#carreras'
                                            }
                                            className="inline-flex items-center gap-2 rounded-[13px] bg-upel-gold px-5 py-3 text-sm font-extrabold text-upel-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-upel-gold-light"
                                        >
                                            {canRegister
                                                ? 'Inscríbete ahora'
                                                : 'Ver oferta académica'}
                                            <ArrowRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </a>
                                        <a
                                            href="#pensum"
                                            className="inline-flex items-center gap-2 rounded-[13px] border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white/45 hover:bg-white/10"
                                        >
                                            <BookOpen
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            Ver pensum
                                        </a>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white/5 shadow-2xl">
                                        {career.image_url ? (
                                            <img
                                                src={career.image_url}
                                                alt={`Imagen de la carrera ${career.name}`}
                                                className="aspect-[4/3] w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-upel-blue/40 via-upel-navy to-upel-navy">
                                                <span
                                                    className="text-7xl"
                                                    aria-hidden="true"
                                                >
                                                    {career.icon}
                                                </span>
                                                <span className="text-[0.68rem] font-bold tracking-[0.18em] text-white/50 uppercase">
                                                    {career.degree}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute right-4 -bottom-5 left-4 grid grid-cols-2 gap-2 sm:right-6 sm:left-6">
                                        <div className="rounded-xl border border-white/10 bg-white px-3 py-2.5 text-center shadow-lg">
                                            <p className="font-display text-xl font-bold text-upel-navy">
                                                {career.subjects_count}
                                            </p>
                                            <p className="text-[0.58rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                Materias
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white px-3 py-2.5 text-center shadow-lg">
                                            <p className="font-display text-xl font-bold text-upel-navy">
                                                {career.credits_total}
                                            </p>
                                            <p className="text-[0.58rem] font-bold tracking-wide text-muted-foreground uppercase">
                                                Créditos
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-upel-cloud py-14 sm:py-16">
                            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                                <Reveal>
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <div>
                                            <p className="text-[0.66rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                                Modalidades disponibles
                                            </p>
                                            <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy sm:text-3xl">
                                                Cómo se cursa esta carrera
                                            </h2>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-bold text-upel-slate ring-1 ring-upel-mist">
                                            {periods} períodos académicos
                                        </span>
                                    </div>
                                </Reveal>

                                {career.offerings.length === 0 ? (
                                    <div className="mt-6 rounded-2xl border border-dashed border-upel-mist bg-white px-5 py-8 text-center text-sm text-upel-slate">
                                        La carrera no tiene ofertas académicas
                                        activas en este momento.
                                    </div>
                                ) : (
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {career.offerings.map((offering) => (
                                            <article
                                                key={offering.id}
                                                className="rounded-2xl border border-upel-mist bg-white p-5 shadow-sm"
                                            >
                                                <span className="inline-flex rounded-full bg-upel-blue/10 px-2.5 py-1 text-[0.6rem] font-extrabold tracking-wide text-upel-blue uppercase">
                                                    {offering.modality_label}
                                                </span>
                                                <div className="mt-4 space-y-2 text-xs font-semibold text-upel-slate">
                                                    <p className="flex items-center gap-2">
                                                        <CalendarDays
                                                            className="size-3.5 text-upel-blue"
                                                            aria-hidden="true"
                                                        />
                                                        {
                                                            offering.schedule_label
                                                        }
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Sun
                                                            className="size-3.5 text-upel-blue"
                                                            aria-hidden="true"
                                                        />
                                                        {offering.shift_label}
                                                    </p>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="pensum"
                            className="scroll-mt-24 bg-white py-16 sm:py-20"
                        >
                            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                                <Reveal>
                                    <div className="max-w-3xl">
                                        <p className="text-[0.66rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                            Plan de estudios
                                        </p>
                                        <h2 className="mt-1 font-display text-3xl font-bold text-upel-navy sm:text-4xl">
                                            Pensum de la carrera
                                        </h2>
                                        <p className="mt-2 text-sm leading-relaxed text-upel-slate">
                                            Materias organizadas por período
                                            académico, con sus créditos y horas
                                            de formación teórica y práctica.
                                        </p>
                                    </div>
                                </Reveal>

                                {pensum.length === 0 ? (
                                    <div className="mt-8 rounded-2xl border border-dashed border-upel-mist bg-upel-cloud/60 px-6 py-12 text-center">
                                        <BookOpen
                                            className="mx-auto size-8 text-upel-blue"
                                            aria-hidden="true"
                                        />
                                        <p className="mt-3 text-sm font-bold text-upel-navy">
                                            Pensum en construcción
                                        </p>
                                        <p className="mt-1 text-xs text-upel-slate">
                                            Las autoridades académicas aún no
                                            han publicado las materias de esta
                                            carrera.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-8 space-y-5">
                                        {pensum.map((period, index) => (
                                            <Reveal
                                                key={period.semester}
                                                delay={Math.min(
                                                    index * 40,
                                                    240,
                                                )}
                                            >
                                                <section className="overflow-hidden rounded-2xl border border-upel-mist bg-white shadow-sm">
                                                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-upel-mist bg-upel-cloud/60 px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex size-9 items-center justify-center rounded-xl bg-upel-navy text-xs font-bold text-white">
                                                                {period.label}
                                                            </span>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-upel-navy">
                                                                    Período{' '}
                                                                    {
                                                                        period.label
                                                                    }
                                                                </h3>
                                                                <p className="text-[0.65rem] text-muted-foreground">
                                                                    {
                                                                        period
                                                                            .subjects
                                                                            .length
                                                                    }{' '}
                                                                    materias
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full bg-white px-3 py-1 text-[0.62rem] font-bold text-upel-slate ring-1 ring-upel-mist">
                                                            {period.credits}{' '}
                                                            créditos
                                                        </span>
                                                    </header>

                                                    <ul className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                                                        {period.subjects.map(
                                                            (subject) => (
                                                                <li
                                                                    key={
                                                                        subject.id
                                                                    }
                                                                    className="rounded-xl border border-upel-mist/80 bg-white p-4 transition-colors hover:border-upel-blue/30"
                                                                >
                                                                    <p className="text-xs font-bold text-upel-navy">
                                                                        {
                                                                            subject.name
                                                                        }
                                                                    </p>
                                                                    <p className="mt-1 text-[0.62rem] font-semibold text-muted-foreground">
                                                                        {
                                                                            subject.code
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            subject.credits
                                                                        }{' '}
                                                                        créditos
                                                                    </p>
                                                                    <p className="mt-2 text-[0.62rem] text-upel-slate">
                                                                        {
                                                                            subject.theory_hours
                                                                        }{' '}
                                                                        h teoría
                                                                        ·{' '}
                                                                        {
                                                                            subject.practice_hours
                                                                        }{' '}
                                                                        h
                                                                        práctica
                                                                    </p>
                                                                    {subject.prerequisites ? (
                                                                        <p className="mt-2 rounded-lg bg-upel-gold/10 px-2 py-1 text-[0.6rem] font-semibold text-[#8a6c0d]">
                                                                            Requiere:{' '}
                                                                            {
                                                                                subject.prerequisites
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </section>
                                            </Reveal>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </main>

                    <Footer onLoginClick={() => router.visit('/login')} />
                </LandingErrorBoundary>
            </div>
        </>
    );
}
