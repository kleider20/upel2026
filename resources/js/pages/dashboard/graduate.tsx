import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    CalendarDays,
    GraduationCap,
    TrendingUp,
    UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/portal/page-header';
import { RoleBadge } from '@/components/portal/role-badge';
import { StatCard } from '@/components/portal/stat-card';
import { type Tone, ToneBadge } from '@/components/portal/tone-badge';
import graduateRoutes from '@/routes/graduate';
import type { Auth } from '@/types';
import type { GraduateProfile, GraduateSummary } from '@/types/graduate';

type Props = {
    profile: GraduateProfile | null;
    summary: GraduateSummary;
};

/**
 * Página de resumen del portal del graduado. Cada enlace abre su propia página.
 */
export default function GraduateDashboard({ profile, summary }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const quickLinks = [
        {
            title: 'Récord académico',
            description: 'Materias culminadas, créditos y promedio general.',
            href: graduateRoutes.record.url(),
            icon: GraduationCap,
        },
        {
            title: 'Postgrados y cursos',
            description: `${summary.programs_count} programas de formación continua disponibles.`,
            href: graduateRoutes.programs.url(),
            icon: Award,
        },
        {
            title: 'Mi perfil',
            description: 'Datos de tu cuenta y preferencias de acceso.',
            href: '/settings/profile',
            icon: UserRound,
        },
    ];

    return (
        <>
            <Head title="Mi comunidad" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Comunidad de graduados"
                    title={`Bienvenido, ${auth.user?.name.split(' ')[0] ?? 'graduado'}`}
                    description="Tu historia académica y las oportunidades para seguir creciendo profesionalmente con la UPEL."
                    actions={
                        <RoleBadge
                            role={auth.user?.portal_role}
                            label={auth.user?.portal_role_label}
                        />
                    }
                />

                <section
                    aria-label="Resumen del graduado"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Promedio general"
                        value={
                            summary.average !== null
                                ? `${summary.average.toFixed(1).replace('.', ',')} / 10`
                                : '—'
                        }
                        hint="Promedio de tus materias culminadas"
                        icon={TrendingUp}
                        tone="gold"
                    />
                    <StatCard
                        label="Materias culminadas"
                        value={summary.subjects_count}
                        hint="Materias con nota registrada"
                        icon={BookOpen}
                        tone="green"
                    />
                    <StatCard
                        label="Créditos académicos"
                        value={summary.credits_total}
                        hint="Créditos acumulados en tu récord"
                        icon={GraduationCap}
                        tone="blue"
                    />
                    <StatCard
                        label="Programas disponibles"
                        value={summary.programs_count}
                        hint="Especializaciones, maestrías, cursos y talleres"
                        icon={Award}
                        tone="navy"
                    />
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="group flex flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-upel-gold/40 hover:shadow-md dark:bg-card"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-[#8a6c0d]">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h2 className="mt-4 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                    {link.title}
                                </h2>
                                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                                    {link.description}
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-upel-blue group-hover:text-upel-navy dark:text-foreground">
                                    Abrir página
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        );
                    })}
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-2xl border border-upel-blue/20 bg-[linear-gradient(145deg,#0a2540,#174a7c)] p-5 text-white">
                        <p className="text-xs font-bold tracking-wide text-upel-gold-light uppercase">
                            Sigue formándote
                        </p>
                        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/70">
                            Como graduado UPEL puedes acceder a
                            especializaciones, maestrías, doctorados, cursos y
                            talleres diseñados para tu crecimiento profesional.
                        </p>
                        <Link
                            href={graduateRoutes.programs.url()}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-gold-light"
                        >
                            Ver programas
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            Mi perfil
                        </p>
                        <p className="mt-2 text-sm font-bold text-upel-navy dark:text-foreground">
                            {auth.user?.name}
                        </p>
                        <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Carrera
                                </dt>
                                <dd className="text-right font-bold text-upel-navy dark:text-foreground">
                                    {profile?.career ?? '—'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Código
                                </dt>
                                <dd className="font-bold text-upel-navy dark:text-foreground">
                                    {profile?.student_code ?? '—'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Estado
                                </dt>
                                <dd>
                                    {profile ? (
                                        <ToneBadge
                                            tone={profile.status_tone as Tone}
                                        >
                                            {profile.status_label}
                                        </ToneBadge>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-blue/10 text-upel-blue">
                                <CalendarDays className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    ¿Quieres actualizar tus datos?
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Mantén tu correo y teléfono al día para
                                    recibir información de la comunidad UPEL.
                                </p>
                            </div>
                        </div>
                        <a
                            href="mailto:graduados@upel.edu.ve"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground"
                        >
                            Contactar a la oficina de graduados
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
