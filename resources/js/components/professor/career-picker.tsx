import { ChevronRight } from 'lucide-react';
import type { ProfessorCareer } from '@/components/professor/workspace-types';
import { cn, countLabel } from '@/lib/utils';

type Props = {
    careers: ProfessorCareer[];
    selectedId: number | null;
    onSelect: (careerId: number | null) => void;
    title?: string;
    /**
     * `sidebar` apila las carreras en una columna; `compact` las muestra como
     * pastillas en una barra horizontal para no restar ancho a las planillas.
     */
    variant?: 'sidebar' | 'compact';
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
    variant = 'sidebar',
}: Props) {
    if (variant === 'compact') {
        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border/70 bg-white px-4 py-2.5 shadow-sm dark:bg-card">
                <p className="shrink-0 text-[0.6rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    {title}
                </p>

                {careers.length === 0 ? (
                    <p className="text-[0.68rem] font-semibold text-muted-foreground">
                        Pendiente por asignación
                    </p>
                ) : (
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {careers.map((career) => {
                            const isActive = career.id === selectedId;

                            return (
                                <button
                                    key={career.id}
                                    type="button"
                                    onClick={() => onSelect(career.id)}
                                    aria-pressed={isActive}
                                    className={cn(
                                        'inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-bold transition-colors',
                                        isActive
                                            ? 'bg-upel-navy text-white shadow-sm'
                                            : 'bg-upel-cloud/70 text-upel-navy ring-1 ring-border hover:bg-upel-cloud dark:bg-muted/40 dark:text-foreground dark:hover:bg-muted',
                                    )}
                                >
                                    <span className="truncate">
                                        {career.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'shrink-0 text-[0.6rem] font-semibold',
                                            isActive
                                                ? 'text-white/65'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {countLabel(
                                            career.students_count,
                                            'estudiante',
                                            'estudiantes',
                                        )}{' '}
                                        ·{' '}
                                        {countLabel(
                                            career.subjects.length,
                                            'materia',
                                            'materias',
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

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
                                        {countLabel(
                                            career.students_count,
                                            'estudiante',
                                            'estudiantes',
                                        )}{' '}
                                        ·{' '}
                                        {countLabel(
                                            career.subjects.length,
                                            'materia',
                                            'materias',
                                        )}
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
