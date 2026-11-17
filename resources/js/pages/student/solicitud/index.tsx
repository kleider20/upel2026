import { Head } from '@inertiajs/react';
import { MiSolicitud } from '@/components/student/modules/MiSolicitud';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentSolicitud(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mi Solicitud de Admisión · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="solicitud">
                <MiSolicitud {...props} />
            </StudentLayout>
        </>
    );
}
