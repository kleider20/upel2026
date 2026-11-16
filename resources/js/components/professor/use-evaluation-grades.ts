import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    formatScore,
    parseScore,
    toScaleTen,
    weightedScore,
    type GradingLimits,
} from '@/lib/evaluation-plan';
import planRoutes from '@/routes/professor/plans';

/**
 * Evaluación del plan con lo necesario para pintar la planilla de notas.
 */
export type GradeItem = {
    id: number;
    position: number;
    title: string;
    weight: number;
    scheduled_on: string;
};

/**
 * Estudiante del roster del plan con las notas ya guardadas.
 */
export type GradeRow = {
    student_id: number;
    enrollment_id: number | null;
    enrolled: boolean;
    student_name: string;
    student_code: string | null;
    cohort: string | null;
    current_cohort: string | null;
    scores: Record<string, number | null>;
    definitive: number | null;
    definitive_ten: number | null;
    approved: boolean | null;
};

/**
 * Fila de la planilla con la definitiva recalculada en vivo.
 */
export type GradedRow<TRow extends GradeRow = GradeRow> = TRow & {
    scoresByItem: Record<number, number | null>;
    definitive: number | null;
    definitiveTen: number | null;
    approved: boolean | null;
};

/**
 * Clave del borrador de una celda: estudiante y evaluación.
 */
export const cellKey = (studentId: number, itemId: number): string =>
    `${studentId}-${itemId}`;

type EvaluationGradesOptions<TRow extends GradeRow> = {
    planId: number;
    items: GradeItem[];
    students: TRow[];
    limits: GradingLimits;
};

/**
 * Estado de la planilla de notas: borradores por celda, definitivas en vivo y
 * guardado contra el plan de evaluación.
 */
export function useEvaluationGrades<TRow extends GradeRow>({
    planId,
    items,
    students,
    limits,
}: EvaluationGradesOptions<TRow>) {
    const [drafts, setDrafts] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};

        for (const student of students) {
            for (const item of items) {
                const value = student.scores[String(item.id)];
                initial[cellKey(student.student_id, item.id)] =
                    value === null || value === undefined
                        ? ''
                        : formatScore(value, 2);
            }
        }

        return initial;
    });
    const [saving, setSaving] = useState(false);

    const rows = useMemo(
        () =>
            students.map((student): GradedRow<TRow> => {
                const scoresByItem: Record<number, number | null> = {};
                const entries = items.map((item) => {
                    const score = parseScore(
                        drafts[cellKey(student.student_id, item.id)] ?? '',
                        limits.max_item_score,
                    );

                    scoresByItem[item.id] = score;

                    return { score, weight: item.weight };
                });
                const definitive = weightedScore(entries);
                const definitiveTen = toScaleTen(definitive);

                return {
                    ...student,
                    scoresByItem,
                    definitive,
                    definitiveTen,
                    approved:
                        definitiveTen === null
                            ? null
                            : definitiveTen >= limits.passing_grade,
                };
            }),
        [drafts, items, limits.max_item_score, limits.passing_grade, students],
    );

    const averages = useMemo(
        () =>
            items.map((item) => {
                const scores = rows
                    .map((row) =>
                        parseScore(
                            drafts[cellKey(row.student_id, item.id)] ?? '',
                            limits.max_item_score,
                        ),
                    )
                    .filter((score): score is number => score !== null);

                return scores.length === 0
                    ? null
                    : Math.round(
                          (scores.reduce((total, score) => total + score, 0) /
                              scores.length) *
                              100,
                      ) / 100;
            }),
        [drafts, items, limits.max_item_score, rows],
    );

    const gradedCells = rows.reduce(
        (total, row) =>
            total +
            items.filter(
                (item) =>
                    parseScore(
                        drafts[cellKey(row.student_id, item.id)] ?? '',
                        limits.max_item_score,
                    ) !== null,
            ).length,
        0,
    );

    const setCell = (studentId: number, itemId: number, value: string) => {
        setDrafts((current) => ({
            ...current,
            [cellKey(studentId, itemId)]: value,
        }));
    };

    const saveScores = () => {
        const scores = students.flatMap((student) =>
            items.map((item) => ({
                item_id: item.id,
                student_id: student.student_id,
                score: parseScore(
                    drafts[cellKey(student.student_id, item.id)] ?? '',
                    limits.max_item_score,
                ),
            })),
        );

        router.put(
            planRoutes.scores.update.url({ plan: planId }),
            { scores },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
            },
        );
    };

    return {
        drafts,
        rows,
        averages,
        gradedCells,
        saving,
        setCell,
        saveScores,
    };
}
