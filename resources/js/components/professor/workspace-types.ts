import type {
    GradeItem,
    GradeRow,
} from '@/components/professor/use-evaluation-grades';

/**
 * Resumen del plan de evaluación de una materia.
 */
export type PlanSummary = {
    id: number;
    period: string | null;
    total_weight: number;
    remaining_weight: number;
    is_complete: boolean;
    items?: GradeItem[];
    students?: GradeRow[];
};

/**
 * Plan con la planilla de notas por evaluación (página "Cargar notas").
 */
export type PlanGradeData = PlanSummary & {
    items: GradeItem[];
    students: GradeRow[];
};

/**
 * Fila del estudiante que cursa la materia con su nota definitiva del plan.
 */
export type ProfessorStudent = {
    enrollment_id: number | null;
    student_id: number;
    student_name: string | null;
    student_code: string | null;
    period: string | null;
    grade: number | null;
    graded_items: number;
    total_items: number;
    status: string;
    status_label: string;
    status_tone: string;
};

/**
 * Materia asignada al docente en un horario publicado.
 */
export type ProfessorSubject = {
    id: number;
    name: string;
    code: string;
    semester: number;
    cohort: string | null;
    schedule_id: number;
    schedule_label: string | null;
    plan: PlanSummary | null;
    students: ProfessorStudent[];
};

/**
 * Carrera del docente con sus materias y estudiantes.
 */
export type ProfessorCareer = {
    id: number | null;
    name: string | null;
    code: string | null;
    students_count: number;
    subjects: ProfessorSubject[];
};
