import { Head } from '@inertiajs/react';
import { MiPerfil } from '@/components/student/modules/MiPerfil';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentPerfil(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mi Perfil · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="perfil">
                <MiPerfil {...props} />
            </StudentLayout>
        </>
    );
}
