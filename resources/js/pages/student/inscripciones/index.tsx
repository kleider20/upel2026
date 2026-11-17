import { Head } from '@inertiajs/react';
import { MisInscripciones } from '@/components/student/modules/MisInscripciones';
import StudentLayout from '@/layouts/student-layout';
import type { StudentEnrollmentPayload } from '@/types/student';

export default function StudentInscripciones({
    enrollment,
}: {
    enrollment: StudentEnrollmentPayload;
}) {
    return (
        <>
            <Head title="Inscripción de Materias · Portal Estudiantil UPEL" />

            <StudentLayout activeTab="inscripciones">
                <MisInscripciones enrollment={enrollment} />
            </StudentLayout>
        </>
    );
}
