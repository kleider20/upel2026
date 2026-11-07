export type StudentProfileData = {
    id: number;
    student_code: string;
    career: string | null;
    career_code: string | null;
    modality: string | null;
    duration_semesters: number;
    current_semester: number;
    status: string;
    status_label: string;
    status_tone: string;
    admission_year: number | null;
    graduation_year: number | null;
    phone?: string | null;
    personal_email?: string | null;
    address?: string | null;
    birth_date?: string | null;
    birth_place?: string | null;
    emergency_contact?: string | null;
    shift?: string | null;
    advisor?: string | null;
    id_number?: string | null;
    nationality?: string | null;
    period_year?: number | null;
    admission_code?: string | null;
};

export type StudentSummary = {
    average: number | null;
    subjects_count: number;
    approved_count: number;
    pending_count: number;
    credits_total: number;
    credits_approved: number;
    progress: number;
};

export type StudentEnrollment = {
    id: number;
    subject: string | null;
    code: string | null;
    semester: number | null;
    credits: number | null;
    career: string | null;
    period: string | null;
    professor: string | null;
    n1: number | null;
    n2: number | null;
    n3: number | null;
    final: number | null;
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
    modality?: string;
};

export type StudentTeacher = {
    id: number;
    name: string;
    email: string;
    department?: string | null;
    academic_title?: string | null;
    subjects: string[];
};

export type StudentPensumSubject = {
    id: number;
    name: string;
    code: string;
    semester: number;
    credits: number;
    type?: string | null;
    is_elective?: boolean;
    status: 'aprobado' | 'cursando' | 'pendiente';
    grade: number | null;
};

export type StudentScheduleWeek = {
    date?: string;
    week: number;
    week_number?: number;
    month: string;
    tone: string;
    day: string;
    weekday: string;
    dates?: string[];
    highlight: 'red' | 'yellow' | null;
};

export type StudentScheduleSubject = {
    code: string;
    name: string;
    teacher: string;
    hours: (string | null)[];
    pdf_hours?: (string | null)[];
};

export type StudentScheduleData = {
    title: string;
    career: string;
    cohort: string;
    period: string;
    schedule_label: string;
    modality?: string | null;
    weeks: StudentScheduleWeek[];
    subjects: StudentScheduleSubject[];
    distance_subjects: StudentScheduleSubject[];
    time_slots: string[];
    distance_schedule: string | null;
    distance_time: string | null;
};

export type StudentTramite = {
    id: number;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    status_tone: string;
    created_at: string;
};

export type StudentAdmissionDocument = {
    id: number;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    status_tone: string;
    original_name: string | null;
    size: string;
    notes: string | null;
    uploaded_at: string | null;
};

export type StudentAdmissionHistory = {
    id: number;
    from: string;
    to: string;
    tone: string;
    note: string | null;
    changed_by: string;
    date: string | null;
};

export type StudentAdmission = {
    code: string;
    status: string;
    status_label: string;
    status_tone: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    converted_at: string | null;
    period_year: number;
    career: string | null;
    career_code: string | null;
    modality: string;
    schedule: string;
    shift: string;
    full_name: string;
    first_name: string;
    last_name: string;
    nationality: string | null;
    id_number: string;
    formatted_id_number: string;
    birth_date: string;
    age: number;
    gender: string | null;
    email: string;
    phone: string;
    address: string | null;
    high_school: string | null;
    high_school_year: number | null;
    high_school_average: string;
    review_notes: string | null;
    tracking_url: string;
    documents: StudentAdmissionDocument[];
    history: StudentAdmissionHistory[];
};

export type StudentDashboardProps = {
    profile: StudentProfileData | null;
    admission: StudentAdmission | null;
    summary: StudentSummary;
    enrollments: StudentEnrollment[];
    teachers: StudentTeacher[];
    pensum: { semester: number; subjects: StudentPensumSubject[] }[];
    schedule: StudentScheduleData | null;
    tramites: StudentTramite[];
    active_period?: string | null;
};
