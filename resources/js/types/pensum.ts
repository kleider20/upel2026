export type PensumCareer = {
    id: number;
    name: string;
    code: string;
    icon: string;
    degree: string;
    duration_semesters: number;
    subjects_count: number;
    credits_total: number;
};

export type PensumSubject = {
    id: number;
    code: string;
    name: string;
    credits: number;
    theory_hours: number;
    practice_hours: number;
    component: string | null;
    type: string | null;
    area: string | null;
    level: string | null;
    modality: string;
    modality_label: string;
    prerequisites: string | null;
    is_active: boolean;
    edit_url: string;
    delete_url: string;
};

export type PensumPeriod = {
    semester: number;
    label: string;
    credits: number;
    subjects: PensumSubject[];
};
