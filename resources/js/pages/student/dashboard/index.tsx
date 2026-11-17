import { Head, usePage } from '@inertiajs/react';
import { Inicio } from '@/components/student/modules/Inicio';
import StudentLayout from '@/layouts/student-layout';
import type { Auth } from '@/types';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentDashboard(props: StudentDashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userName = auth.user?.name ?? 'Estudiante UPEL';

    return (
        <>
            <Head title="Resumen Personal · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="inicio">
                <Inicio {...props} userName={userName} />
            </StudentLayout>
        </>
    );
}
