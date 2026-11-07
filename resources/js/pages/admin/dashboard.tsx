import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    KeyRound,
    LayoutGrid,
} from 'lucide-react';
import { ModuleIcon } from '@/components/admin/module-icon';
import { PageHeader } from '@/components/portal/page-header';
import { RoleBadge } from '@/components/portal/role-badge';
import { type Tone, toneClasses } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';

type SummaryCard = {
    label: string;
    value: string;
    hint: string;
    tone: Tone;
    icon: string;
};

type AdminModule = {
    key: string;
    title: string;
    description: string;
    icon: string;
    href: string;
};

type Props = {
    role?: string | null;
    role_key?: string | null;
    role_description?: string | null;
    permissions_count: number;
    summary: SummaryCard[];
    modules: AdminModule[];
    active_period?: string | null;
};

/**
 * Panel principal del portal administrativo.
 */
export default function AdminDashboard({
    role,
    role_key,
    role_description,
    permissions_count,
    summary,
    modules,
    active_period,
}: Props) {
    return (
        <>
            <Head title="Panel administrativo" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Portal administrativo"
                    title="Panel de gestión institucional"
                    description={
                        role_description ??
                        'Consulta el estado académico y financiero de la universidad.'
                    }
                    actions={
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <RoleBadge role={role_key} label={role} />
                            {active_period ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-upel-cloud px-3 py-1 text-[0.68rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Período {active_period}
                                </span>
                            ) : null}
                        </div>
                    }
                />

                {summary.length > 0 ? (
                    <section
                        aria-label="Resumen institucional"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {summary.map((card) => (
                            <div
                                key={card.label}
                                className="relative overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-card"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                            {card.label}
                                        </p>
                                        <p className="mt-2 font-display text-3xl leading-none font-bold text-upel-navy dark:text-foreground">
                                            {card.value}
                                        </p>
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                            {card.hint}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                                            toneClasses[card.tone] ??
                                                toneClasses.blue,
                                        )}
                                    >
                                        <ModuleIcon
                                            name={card.icon}
                                            className="h-5 w-5"
                                        />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </section>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <section className="space-y-4">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[0.68rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                    Módulos habilitados
                                </p>
                                <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                    Tu área de trabajo
                                </h2>
                            </div>
                            <span className="hidden rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border sm:inline-flex dark:bg-muted">
                                {modules.length} módulos
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {modules.map((module) => (
                                <Link
                                    key={module.key}
                                    href={module.href}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-upel-blue/30 hover:shadow-lg dark:bg-card"
                                >
                                    <div>
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-upel-navy/5 text-upel-navy ring-1 ring-upel-navy/10 transition-colors group-hover:bg-upel-navy group-hover:text-white dark:bg-white/5 dark:text-foreground">
                                            <ModuleIcon
                                                name={module.icon}
                                                className="h-5 w-5"
                                            />
                                        </span>
                                        <h3 className="mt-4 text-base font-bold text-upel-navy dark:text-foreground">
                                            {module.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                            {module.description}
                                        </p>
                                    </div>

                                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-upel-blue">
                                        Abrir módulo
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-[#8a6c0d]">
                                    <KeyRound className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                        Tu alcance
                                    </p>
                                    <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                        {role ?? 'Rol administrativo'}
                                    </p>
                                </div>
                            </div>

                            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Permisos asignados
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {permissions_count}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Módulos visibles
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {modules.length}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Período activo
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {active_period ?? '—'}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-4 rounded-xl bg-upel-cloud px-3 py-2.5 text-[0.68rem] leading-relaxed font-semibold text-muted-foreground dark:bg-muted">
                                Solo ves los módulos autorizados para tu rol. Si
                                necesitas otro acceso, contacta al administrador
                                del sistema.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-upel-green/20 bg-upel-green/5 p-5">
                            <div className="flex items-center gap-2 text-upel-green">
                                <CheckCircle2 className="h-4 w-4" />
                                <p className="text-xs font-bold tracking-wide uppercase">
                                    Sesión protegida
                                </p>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Este portal utiliza autenticación con roles y
                                permisos. Cada acción queda asociada a tu cuenta
                                institucional.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-white p-5 text-center shadow-sm dark:bg-card">
                            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-upel-navy/5 text-upel-navy dark:bg-white/5 dark:text-foreground">
                                <LayoutGrid className="h-5 w-5" />
                            </span>
                            <p className="mt-3 text-xs font-bold text-upel-navy dark:text-foreground">
                                ¿Necesitas volver a la landing?
                            </p>
                            <Link
                                href="/"
                                className="mt-1 inline-block text-[0.68rem] font-bold text-upel-blue hover:text-upel-navy"
                            >
                                Ir al portal web de la UPEL
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
