import { Users } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatScore } from '@/lib/evaluation-plan';

export type ItemScoresStudent = {
    student_id: number;
    student_name: string;
    student_code: string | null;
    scores: Record<string, number | null>;
};

export type ItemScoresSummary = {
    id: number;
    position: number;
    title: string;
    scheduled_on: string;
    weight: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: ItemScoresSummary | null;
    students: ItemScoresStudent[];
    maxScore: number;
};

/**
 * Consulta de las notas de una evaluación del plan: la lista completa de
 * estudiantes del cohorte con la nota que obtuvo cada uno en esa evaluación.
 */
export function EvaluationItemScoresDialog({
    open,
    onOpenChange,
    item,
    students,
    maxScore,
}: Props) {
    const rows =
        item === null
            ? []
            : students.map((student) => ({
                  ...student,
                  score: student.scores[String(item.id)] ?? null,
              }));

    const graded = rows.filter(
        (row): row is (typeof rows)[number] & { score: number } =>
            row.score !== null,
    );
    const average =
        graded.length === 0
            ? null
            : Math.round(
                  (graded.reduce((total, row) => total + row.score, 0) /
                      graded.length) *
                      100,
              ) / 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-2xl dark:bg-card">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl font-bold text-upel-navy dark:text-foreground">
                        {item
                            ? `${item.position}. ${item.title}`
                            : 'Notas de la evaluación'}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-semibold text-muted-foreground">
                        {item
                            ? `${item.scheduled_on} · ${item.weight} % de la nota · notas de 1 a ${maxScore}`
                            : 'Selecciona una evaluación del plan.'}
                    </DialogDescription>
                </DialogHeader>

                <dl className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-upel-cloud/60 px-3 py-2.5 dark:bg-muted/30">
                        <dt className="text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
                            Estudiantes
                        </dt>
                        <dd className="mt-0.5 text-sm font-extrabold text-upel-navy dark:text-foreground">
                            {rows.length}
                        </dd>
                    </div>
                    <div className="rounded-xl bg-upel-cloud/60 px-3 py-2.5 dark:bg-muted/30">
                        <dt className="text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
                            Con nota
                        </dt>
                        <dd className="mt-0.5 text-sm font-extrabold text-upel-green">
                            {graded.length}
                        </dd>
                    </div>
                    <div className="rounded-xl bg-upel-cloud/60 px-3 py-2.5 dark:bg-muted/30">
                        <dt className="text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
                            Promedio
                        </dt>
                        <dd className="mt-0.5 text-sm font-extrabold text-upel-navy dark:text-foreground">
                            {average === null
                                ? '—'
                                : `${formatScore(average)} / ${maxScore}`}
                        </dd>
                    </div>
                </dl>

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-upel-cloud/40 px-4 py-6 text-center dark:bg-muted/20">
                        <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                        <p className="mt-2 text-xs font-bold text-upel-navy dark:text-foreground">
                            Sin estudiantes en el cohorte
                        </p>
                        <p className="mt-1 text-[0.66rem] text-muted-foreground">
                            Cuando el cohorte tenga estudiantes inscritos,
                            aparecerán en esta lista.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border/70">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-upel-cloud/90 backdrop-blur dark:bg-muted/60">
                                <tr>
                                    {[
                                        'Estudiante',
                                        'Código',
                                        `Nota (1–${maxScore})`,
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            scope="col"
                                            className="px-4 py-2.5 text-[0.6rem] font-bold tracking-[0.12em] whitespace-nowrap text-muted-foreground uppercase"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((row) => (
                                    <tr
                                        key={row.student_id}
                                        className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-2.5 text-xs font-bold text-upel-navy dark:text-foreground">
                                            {row.student_name}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                            {row.student_code ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={
                                                    row.score === null
                                                        ? 'text-xs font-semibold text-muted-foreground'
                                                        : 'text-xs font-extrabold text-upel-navy dark:text-foreground'
                                                }
                                            >
                                                {row.score === null
                                                    ? 'Sin nota'
                                                    : formatScore(row.score)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                    Las notas se cargan en la página Cargar notas; aquí solo se
                    consultan las de esta evaluación.
                </p>
            </DialogContent>
        </Dialog>
    );
}
