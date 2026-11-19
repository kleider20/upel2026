/** Datos del expediente del graduado compartidos por las páginas del portal. */

export type GraduateProfile = {
    student_code: string;
    career: string | null;
    career_code: string | null;
    status: string;
    status_label: string;
    status_tone: string;
    graduation_year: number | null;
};

export type GraduateEnrollment = {
    id: number;
    subject: string | null;
    code: string | null;
    semester: number | null;
    credits: number | null;
    career: string | null;
    period: string | null;
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
};

export type GraduateProgram = {
    id: number;
    name: string;
    description: string | null;
    duration: string | null;
    modality: string;
};

export type GraduateProgramGroup = {
    type: string;
    label: string;
    items: GraduateProgram[];
};

export type GraduateSummary = {
    average: number | null;
    subjects_count: number;
    credits_total: number;
    programs_count: number;
};
