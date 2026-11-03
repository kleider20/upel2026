import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import StudentLayout from '@/layouts/student-layout';
import { type StudentTab } from '@/components/student/Sidebar';
import { Inicio } from '@/components/student/modules/Inicio';
import { MiSolicitud } from '@/components/student/modules/MiSolicitud';
import { MisMaterias } from '@/components/student/modules/MisMaterias';
import { MisCalificaciones } from '@/components/student/modules/MisCalificaciones';
import { MisProfesores } from '@/components/student/modules/MisProfesores';
import { MiCarreraPensum } from '@/components/student/modules/MiCarreraPensum';
import { MiHorario } from '@/components/student/modules/MiHorario';
import { MiPerfil } from '@/components/student/modules/MiPerfil';
import { MisTramites } from '@/components/student/modules/MisTramites';
import type { Auth } from '@/types';
import type { StudentDashboardProps } from '@/types/student';

export default function StudentDashboardIndex(props: StudentDashboardProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const userName = auth.user?.name ?? 'Estudiante UPEL';

  const [activeTab, setActiveTab] = useState<StudentTab>('inicio');

  const renderModule = () => {
    switch (activeTab) {
      case 'inicio':
        return <Inicio {...props} userName={userName} onSelectTab={setActiveTab} />;
      case 'solicitud':
        return <MiSolicitud {...props} />;
      case 'materias':
        return <MisMaterias {...props} />;
      case 'calificaciones':
        return <MisCalificaciones {...props} />;
      case 'profesores':
        return <MisProfesores {...props} />;
      case 'pensum':
        return <MiCarreraPensum {...props} />;
      case 'horario':
        return <MiHorario {...props} />;
      case 'perfil':
        return <MiPerfil {...props} />;
      case 'tramites':
        return <MisTramites {...props} />;
      default:
        return <Inicio {...props} userName={userName} onSelectTab={setActiveTab} />;
    }
  };

  return (
    <>
      <Head title="Portal Estudiantil · UPEL" />

      <StudentLayout activeTab={activeTab} onSelectTab={setActiveTab}>
        {renderModule()}
      </StudentLayout>
    </>
  );
}
