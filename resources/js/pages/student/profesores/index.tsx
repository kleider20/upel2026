import { Head } from '@inertiajs/react';
import { MisProfesores } from '@/components/student/modules/MisProfesores';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentProfesores(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mis Profesores · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="profesores">
                <MisProfesores {...props} />
            </StudentLayout>
        </>
    );
}
