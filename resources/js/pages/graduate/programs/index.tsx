import { Head } from '@inertiajs/react';
import { Award, Clock3, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import type { GraduateProgramGroup, GraduateSummary } from '@/types/graduate';

type Props = {
    programs: GraduateProgramGroup[];
    summary: GraduateSummary;
};

/** Oferta de formación continua del graduado en su propia página. */
export default function GraduateProgramsPage({ programs, summary }: Props) {
    return (
        <>
            <Head title="Postgrados y cursos" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Comunidad de graduados"
                    title="Postgrados y cursos"
                    description="Especializaciones, maestrías, doctorados y talleres para seguir creciendo profesionalmente."
                />

                <section className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[0.66rem] font-bold tracking-[0.16em] text-upel-blue uppercase">
                                Formación continua
                            </p>
                            <h2 className="mt-1 font-display text-2xl font-bold text-upel-navy dark:text-foreground">
                                Especialidades, postgrados y cursos
                            </h2>
                        </div>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            {summary.programs_count} programas
                        </span>
                    </div>

                    {programs.length === 0 ? (
                        <EmptyState
                            icon={Award}
                            title="Sin programas disponibles"
                            description="Pronto publicaremos nuevas oportunidades de formación continua."
                        />
                    ) : (
                        <div className="space-y-6">
                            {programs.map((group) => (
                                <div key={group.type}>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-upel-navy/5 text-upel-navy dark:bg-white/5 dark:text-foreground">
                                            <Award className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                            {group.label}
                                        </h3>
                                        <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                            {group.items.length} opciones
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {group.items.map((program) => (
                                            <article
                                                key={program.id}
                                                className="flex flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-card"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded-full bg-upel-gold/15 px-2.5 py-1 text-[0.6rem] font-bold tracking-wide text-[#8a6c0d] uppercase">
                                                        {group.label}
                                                    </span>
                                                    <Award className="h-4 w-4 text-upel-gold" />
                                                </div>
                                                <h4 className="mt-3 text-sm leading-snug font-bold text-upel-navy dark:text-foreground">
                                                    {program.name}
                                                </h4>
                                                {program.description ? (
                                                    <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                                                        {program.description}
                                                    </p>
                                                ) : null}
                                                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[0.65rem] font-semibold text-muted-foreground">
                                                    {program.duration ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock3 className="h-3 w-3" />
                                                            {program.duration}
                                                        </span>
                                                    ) : null}
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {program.modality}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
