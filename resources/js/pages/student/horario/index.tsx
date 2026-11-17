import { Head } from '@inertiajs/react';
import { MiHorario } from '@/components/student/modules/MiHorario';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentHorario(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mi Horario · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="horario">
                <MiHorario {...props} />
            </StudentLayout>
        </>
    );
}
