import { Head } from '@inertiajs/react';
import { MisTramites } from '@/components/student/modules/MisTramites';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentTramites(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mis Trámites y Constancias · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="tramites">
                <MisTramites {...props} />
            </StudentLayout>
        </>
    );
}
