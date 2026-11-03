/**
 * Cursos, talleres y diplomados de extensión académica.
 */

export type CourseIcon =
    | 'monitor'
    | 'brain'
    | 'checklist'
    | 'mic'
    | 'sparkles'
    | 'heart';

export type Course = {
    id: number;
    name: string;
    description: string;
    modality: 'Online' | 'Presencial' | 'Mixta';
    duration: string;
    hours: number;
    price: string;
    icon: CourseIcon;
    gradient: string;
};

export const courses: Course[] = [
    {
        id: 1,
        name: 'Diplomado en Docencia Virtual',
        description:
            'Diseña aulas virtuales efectivas, gestiona entornos LMS y evalúa aprendizajes en línea.',
        modality: 'Online',
        duration: '12 semanas',
        hours: 120,
        price: 'Certificado',
        icon: 'monitor',
        gradient: 'linear-gradient(135deg, #0a2540 0%, #1e5fa8 100%)',
    },
    {
        id: 2,
        name: 'Taller de Neuroeducación',
        description:
            'Comprende cómo aprende el cerebro y aplica estrategias basadas en evidencia científica.',
        modality: 'Presencial',
        duration: '4 semanas',
        hours: 32,
        price: 'Bs. 2.400',
        icon: 'brain',
        gradient: 'linear-gradient(135deg, #113a63 0%, #12876f 100%)',
    },
    {
        id: 3,
        name: 'Curso de Evaluación por Competencias',
        description:
            'Construye instrumentos de evaluación auténticos y rúbricas alineadas al currículo.',
        modality: 'Online',
        duration: '8 semanas',
        hours: 80,
        price: 'Certificado',
        icon: 'checklist',
        gradient: 'linear-gradient(135deg, #1e5fa8 0%, #6da8e8 100%)',
    },
    {
        id: 4,
        name: 'Taller de Oratoria y Liderazgo Docente',
        description:
            'Fortalece tu voz, presencia y capacidad de inspirar en el aula y en la gestión escolar.',
        modality: 'Mixta',
        duration: '6 semanas',
        hours: 48,
        price: 'Bs. 1.800',
        icon: 'mic',
        gradient: 'linear-gradient(135deg, #8a6c0d 0%, #c9a227 100%)',
    },
    {
        id: 5,
        name: 'Inteligencia Artificial para Educadores',
        description:
            'Integra herramientas de IA en la planificación, la evaluación y la personalización del aprendizaje.',
        modality: 'Online',
        duration: '6 semanas',
        hours: 60,
        price: 'Certificado',
        icon: 'sparkles',
        gradient: 'linear-gradient(135deg, #3b1e63 0%, #1e5fa8 100%)',
    },
    {
        id: 6,
        name: 'Primeros Auxilios Pedagógicos',
        description:
            'Aprende a actuar ante emergencias escolares y a promover entornos seguros y protectores.',
        modality: 'Presencial',
        duration: '3 semanas',
        hours: 24,
        price: 'Bs. 1.200',
        icon: 'heart',
        gradient: 'linear-gradient(135deg, #7a1f2b 0%, #c94f5e 100%)',
    },
];
