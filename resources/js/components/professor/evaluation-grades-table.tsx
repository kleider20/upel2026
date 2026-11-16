import type { ReactNode } from 'react';
import { CheckCircle2, Save, Users } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { ToneBadge } from '@/components/portal/tone-badge';
import { formatScore, type GradingLimits } from '@/lib/evaluation-plan';
import {
    cellKey,
    type GradedRow,
    type GradeItem,
    type GradeRow,
} from '@/components/professor/use-evaluation-grades';
import { cn } from '@/lib/utils';

type Props<TRow extends GradeRow> = {
    items: GradeItem[];
    rows: GradedRow<TRow>[];
    drafts: Record<string, string>;
    averages: (number | null)[];
    gradedCells: number;
    saving: boolean;
    limits: GradingLimits;
    onCellChange: (studentId: number, itemId: number, value: string) => void;
    onSave: () => void;
    title?: string;
    description?: string;
    footerNote?: string;
    embedded?: boolean;
    actions?: ReactNode;
    highlightStudentId?: number | null;
};

/**
 * Planilla de notas por estudiante: una columna por evaluación del plan, la
 * definitiva en vivo y el botón para guardar todas las notas.
 */
export function EvaluationGradesTable<TRow extends GradeRow>({
    items,
    rows,
    drafts,
    averages,
    gradedCells,
    saving,
    limits,
    onCellChange,
    onSave,
    title = 'Notas por estudiante',
    description = `Escala de 1 a ${limits.max_item_score} por evaluación · definitiva sobre ${limits.final_scale} · mínima aprobatoria ${limits.passing_grade}.`,
    footerNote = 'La nota definitiva se recalcula automáticamente según el porcentaje de cada evaluación.',
    embedded = false,
    actions,
    highlightStudentId = null,
}: Props<TRow>) {
    return (
        <section
            className={cn(
                !embedded &&
                    'rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card',
            )}
        >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 px-6 py-5">
                <div>
                    <h2 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[0.7rem] font-bold text-muted-foreground">
                        {rows.length} estudiantes · {gradedCells} notas cargadas
                    </p>
                    {actions}
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="p-6">
                    <EmptyState
                        icon={Users}
                        title="Sin estudiantes inscritos"
                        description="Cuando existan inscripciones en esta materia y período aparecerán aquí."
                    />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                        <thead>
                            <tr className="bg-upel-cloud/70 text-[0.64rem] font-bold tracking-wide text-muted-foreground uppercase dark:bg-muted/50">
                                <th className="sticky left-0 z-10 bg-upel-cloud/90 px-5 py-3 dark:bg-muted">
                                    Estudiante
                                </th>
                                {items.map((item) => (
                                    <th
                                        key={item.id}
                                        className="px-3 py-3 text-center"
                                    >
                                        <span className="block text-upel-navy dark:text-foreground">
                                            {item.position}. {item.title}
                                        </span>
                                        <span className="mt-0.5 block font-semibold normal-case">
                                            {item.weight} % ·{' '}
                                            {item.scheduled_on}
                                        </span>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center">
                                    Definitiva
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                            {rows.map((row) => (
                                <tr
                                    key={row.student_id}
                                    id={`estudiante-${row.student_id}`}
                                    className={cn(
                                        'scroll-mt-28 transition-colors',
                                        row.student_id === highlightStudentId &&
                                            'bg-upel-gold/10 ring-1 ring-upel-gold/40 ring-inset dark:bg-upel-gold/5',
                                    )}
                                >
                                    <td className="sticky left-0 z-10 bg-white px-5 py-3 dark:bg-card">
                                        <p className="max-w-[220px] truncate font-bold text-upel-navy dark:text-foreground">
                                            {row.student_name}
                                        </p>
                                        <p className="mt-0.5 text-[0.66rem] font-semibold text-muted-foreground">
                                            {row.student_code ?? 'Sin código'}
                                        </p>
                                        <p className="mt-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                                            Cohorte {row.current_cohort ?? '—'}
                                            {row.cohort !== null &&
                                            row.cohort !== row.current_cohort
                                                ? ` · propio ${row.cohort}`
                                                : ''}
                                        </p>
                                    </td>
                                    {items.map((item) => (
                                        <td key={item.id} className="px-3 py-3">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={
                                                    drafts[
                                                        cellKey(
                                                            row.student_id,
                                                            item.id,
                                                        )
                                                    ] ?? ''
                                                }
                                                onChange={(event) =>
                                                    onCellChange(
                                                        row.student_id,
                                                        item.id,
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="—"
                                                aria-label={`Nota de ${row.student_name} en ${item.title}`}
                                                className="mx-auto block h-9 w-16 rounded-lg border border-border bg-white text-center text-xs font-bold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted/40 dark:text-foreground"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
                                        <p className="font-display text-sm font-bold text-upel-navy dark:text-foreground">
                                            {formatScore(row.definitiveTen)}
                                            <span className="ml-1 text-[0.62rem] font-semibold text-muted-foreground">
                                                / {limits.final_scale}
                                            </span>
                                        </p>
                                        <p className="mt-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                                            {formatScore(row.definitive)} /{' '}
                                            {limits.max_item_score}
                                        </p>
                                        {row.approved ===
                                        null ? null : row.approved ? (
                                            <ToneBadge
                                                tone="green"
                                                className="mt-1.5"
                                            >
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Aprobado
                                            </ToneBadge>
                                        ) : (
                                            <ToneBadge
                                                tone="red"
                                                className="mt-1.5"
                                            >
                                                Reprobado
                                            </ToneBadge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-upel-cloud/50 font-bold dark:bg-muted/40">
                                <td className="sticky left-0 z-10 bg-upel-cloud/70 px-5 py-3 text-[0.66rem] tracking-wide text-muted-foreground uppercase dark:bg-muted">
                                    Promedio
                                </td>
                                {items.map((item, index) => (
                                    <td
                                        key={item.id}
                                        className="px-3 py-3 text-center text-upel-navy dark:text-foreground"
                                    >
                                        {formatScore(averages[index])}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-center text-upel-navy dark:text-foreground">
                                    {formatScore(
                                        rows.some(
                                            (row) => row.definitiveTen !== null,
                                        )
                                            ? Math.round(
                                                  (rows.reduce(
                                                      (total, row) =>
                                                          total +
                                                          (row.definitiveTen ??
                                                              0),
                                                      0,
                                                  ) /
                                                      rows.filter(
                                                          (row) =>
                                                              row.definitiveTen !==
                                                              null,
                                                      ).length) *
                                                      100,
                                              ) / 100
                                            : null,
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-white/95 px-6 py-4 backdrop-blur dark:bg-card/95">
                <p className="text-[0.7rem] font-semibold text-muted-foreground">
                    {footerNote}
                </p>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving || rows.length === 0 || items.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-5 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando…' : 'Guardar notas'}
                </button>
            </div>
        </section>
    );
}
