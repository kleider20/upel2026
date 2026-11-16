import { ChevronRight } from 'lucide-react';
import type { ProfessorCareer } from '@/components/professor/workspace-types';
import { cn } from '@/lib/utils';

type Props = {
    careers: ProfessorCareer[];
    selectedId: number | null;
    onSelect: (careerId: number | null) => void;
    title?: string;
};

/**
 * Selector de carrera del portal docente: lista las carreras asignadas por los
 * horarios y resalta la que se está consultando.
 */
export function CareerPicker({
    careers,
    selectedId,
    onSelect,
    title = 'Mis carreras',
}: Props) {
    return (
        <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-sm dark:bg-card">
            <p className="px-2 pt-2 pb-3 text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                {title}
            </p>
            <div className="space-y-1.5">
                {careers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-upel-cloud/60 px-3 py-4 text-center dark:bg-muted/30">
                        <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                            Pendiente por asignación
                        </p>
                        <p className="mt-1 text-[0.62rem] leading-relaxed text-muted-foreground">
                            El decano te asignará materias y carreras al
                            publicar tu horario.
                        </p>
                    </div>
                ) : (
                    careers.map((career) => {
                        const isActive = career.id === selectedId;

                        return (
                            <button
                                key={career.id}
                                type="button"
                                onClick={() => onSelect(career.id)}
                                className={cn(
                                    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                                    isActive
                                        ? 'bg-upel-navy text-white'
                                        : 'text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted',
                                )}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-bold">
                                        {career.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'mt-0.5 block text-[0.62rem] font-semibold',
                                            isActive
                                                ? 'text-white/60'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {career.students_count} estudiantes ·{' '}
                                        {career.subjects.length} materias
                                    </span>
                                </span>
                                <ChevronRight
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        isActive
                                            ? 'text-white'
                                            : 'text-muted-foreground',
                                    )}
                                />
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
