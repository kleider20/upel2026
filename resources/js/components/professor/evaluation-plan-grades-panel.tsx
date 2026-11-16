import { EvaluationGradesTable } from '@/components/professor/evaluation-grades-table';
import { useEvaluationGrades } from '@/components/professor/use-evaluation-grades';
import type { PlanGradeData } from '@/components/professor/workspace-types';
import type { GradingLimits } from '@/lib/evaluation-plan';

type Props = {
    plan: PlanGradeData;
    limits: GradingLimits;
    highlightStudentId?: number | null;
};

/**
 * Planilla de notas por evaluación de una materia del panel docente, lista
 * para cargar las notas de cada evaluación del plan sin salir de la página.
 */
export function EvaluationPlanGradesPanel({
    plan,
    limits,
    highlightStudentId = null,
}: Props) {
    const grades = useEvaluationGrades({
        planId: plan.id,
        items: plan.items,
        students: plan.students,
        limits,
    });

    return (
        <EvaluationGradesTable
            embedded
            items={plan.items}
            rows={grades.rows}
            drafts={grades.drafts}
            averages={grades.averages}
            gradedCells={grades.gradedCells}
            saving={grades.saving}
            limits={limits}
            onCellChange={grades.setCell}
            onSave={grades.saveScores}
            highlightStudentId={highlightStudentId}
            title="Notas por estudiante"
            footerNote="Las notas se guardan en el plan de evaluación de la materia."
        />
    );
}
