import { Head } from '@inertiajs/react';
import { MisCalificaciones } from '@/components/student/modules/MisCalificaciones';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentCalificaciones(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mis Calificaciones · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="calificaciones">
                <MisCalificaciones {...props} />
            </StudentLayout>
        </>
    );
}
