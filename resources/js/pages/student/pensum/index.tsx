import { Head } from '@inertiajs/react';
import { MiCarreraPensum } from '@/components/student/modules/MiCarreraPensum';
import StudentLayout from '@/layouts/student-layout';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentPensum(props: StudentDashboardProps) {
    return (
        <>
            <Head title="Mi Carrera y Pénsum · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="pensum">
                <MiCarreraPensum {...props} />
            </StudentLayout>
        </>
    );
}
