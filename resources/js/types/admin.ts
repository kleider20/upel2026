export type AdminReviewRequestItem = {
    id: number;
    student_name: string;
    student_code: string | null;
    type: string;
    type_label: string;
    message: string;
    requested_at: string | null;
    url: string | null;
};

export type AdminReviewRequestsData = {
    can_review: boolean;
    pending_students: number;
    pending_total: number;
    items: AdminReviewRequestItem[];
};
