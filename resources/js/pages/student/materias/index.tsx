import { Head } from '@inertiajs/react';
import { MisMaterias } from '@/components/student/modules/MisMaterias';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentMaterias(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mis Materias · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="materias">
                <MisMaterias {...props} />
            </StudentLayout>
        </>
    );
}
