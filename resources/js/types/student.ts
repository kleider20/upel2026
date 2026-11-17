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
    gender?: string | null;
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

export type StudentEvaluation = {
    title: string;
    scheduled_on: string;
    weight: number;
    score: number | null;
    contribution: number | null;
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
    definitive: number | null;
    status: string;
    status_label: string;
    status_tone: string;
    graded_count: number;
    items_count: number;
    evaluations: StudentEvaluation[];
    modality?: string;
};

export type StudentSubject = {
    id: number;
    subject: string | null;
    code: string;
    semester: number | null;
    credits: number | null;
    career: string | null;
    period: string | null;
    professor: string | null;
    professor_id: number | null;
    professor_url: string | null;
    grade: number | null;
    status: string;
    status_label: string;
    status_tone: string;
    modality: string | null;
    attempts: number;
};

export type StudentTeacher = {
    id: number;
    name: string;
    email: string;
    department: string;
    academic_title: string;
    subjects: string[];
    semesters: number[];
    period: string | null;
    profile_url: string | null;
};

export type StudentPensumSubject = {
    id: number;
    name: string;
    code: string;
    semester: number;
    credits: number;
    type?: string | null;
    is_elective?: boolean;
    is_assigned?: boolean;
    status: 'aprobado' | 'reprobado' | 'cursando' | 'pendiente';
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
    professor_id?: number | null;
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

export type StudentNotificationItem = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
};

export type StudentNotificationsData = {
    unread_count: number;
    items: StudentNotificationItem[];
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
    is_previewable: boolean;
    preview_url: string;
    download_url: string;
};

export type StudentDocumentTypeOption = {
    value: string;
    label: string;
    description: string;
    required: boolean;
    accept: string;
};

export type StudentAdmissionHistory = {
    id: number;
    from: string;
    to: string;
    title: string;
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

export type StudentActivity = {
    id: string;
    title: string;
    detail: string | null;
    date: string;
    when: string;
    tone: string;
};

export type StudentUpcomingEvaluation = {
    id: string;
    title: string;
    subject: string | null;
    code: string | null;
    date: string;
    scheduled_on: string;
};

export type StudentDashboardProps = {
    profile: StudentProfileData | null;
    admission: StudentAdmission | null;
    photo_url?: string | null;
    document_types: StudentDocumentTypeOption[];
    documents_upload_url: string;
    summary: StudentSummary;
    recent_activity: StudentActivity[];
    upcoming_evaluations: StudentUpcomingEvaluation[];
    enrollments: StudentEnrollment[];
    subjects: StudentSubject[];
    teachers: StudentTeacher[];
    pensum: { semester: number; subjects: StudentPensumSubject[] }[];
    schedule: StudentScheduleData | null;
    tramites: StudentTramite[];
    active_period?: string | null;
};

export type StudentProfessorSubject = {
    id: number;
    name: string;
    code: string;
    semester: number;
    credits: number;
    modality: string | null;
    career: string | null;
};

export type StudentProfessorProfile = {
    id: number;
    name: string;
    email: string;
    employee_code: string | null;
    department: string;
    academic_title: string;
    assigned_in_schedule: boolean;
    subjects: StudentProfessorSubject[];
};

export type StudentProfessorPageProps = {
    professor: StudentProfessorProfile;
    dashboard_url: string;
    subjects_url: string;
};

export type StudentEnrollmentNotice = {
    is_open: boolean;
    submitted: boolean;
    url: string;
    opens_at: string;
    closes_at: string;
    reason: 'manual' | 'before' | 'after' | '';
};

export type StudentEnrollmentWindow = {
    is_open: boolean;
    opens_at: string;
    closes_at: string;
    reason: 'manual' | 'before' | 'after' | '';
};

export type StudentEnrollmentPeriod = {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
};

export type StudentEnrollmentStudent = {
    name: string;
    identity_document: string | null;
    student_code: string | null;
    career: string | null;
    career_code: string | null;
    current_semester: number | null;
    next_semester: number;
    cohort: string | null;
    modality: string | null;
    shift: string | null;
};

export type StudentEnrollmentCredits = {
    budget: number;
    required: number;
    available: number;
    selected: number;
    approved: number;
    total: number;
};

export type StudentEnrollmentSubjectOption = {
    subject_id: number;
    code: string;
    name: string;
    credits: number;
    semester: number;
    professor: string | null;
    kind: 'failed' | 'next';
    is_locked: boolean;
    is_selected: boolean;
    has_enrollment: boolean;
    definitive: number | null;
    previous_period: string | null;
    attempts: number;
};

export type StudentEnrollmentSuspension = {
    is_suspended: boolean;
    subjects: string[];
    message: string | null;
};

export type StudentEnrollmentSheetRow = {
    pa: number;
    name: string;
    component: string;
    type: string;
    credits: number;
    enrolled: boolean;
};

export type StudentEnrollmentSheet = {
    student: {
        identity_document: string | null;
        period: string | null;
        cohort: string | null;
        specialty: string;
        entity: string;
        first_surname: string;
        second_surname: string;
        first_name: string;
        second_name: string;
        birth_date: string | null;
        civil_status: string;
        sex: string;
        phone: string | null;
        email: string | null;
        address: string | null;
    };
    period: string;
    rows: StudentEnrollmentSheetRow[];
    total_credits: number;
};

export type StudentEnrollmentPayload = {
    window: StudentEnrollmentWindow;
    period: StudentEnrollmentPeriod | null;
    student: StudentEnrollmentStudent;
    semester: number;
    credits: StudentEnrollmentCredits;
    subjects: StudentEnrollmentSubjectOption[];
    suspension: StudentEnrollmentSuspension;
    submitted: boolean;
    sheet: StudentEnrollmentSheet | null;
    urls: {
        store: string;
        sheet: string;
    };
};
