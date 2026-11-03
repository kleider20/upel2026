/**
 * Oferta académica de pregrado de la UPEL.
 * Mantener los datos aquí permite actualizar la landing sin tocar componentes.
 */

export type CareerModality = 'online' | 'mixta' | 'presencial';

export type Career = {
    id: number;
    name: string;
    description: string;
    modality: CareerModality;
    duration: string;
    degree: string;
    icon: string;
};

export const modalityLabels: Record<CareerModality, string> = {
    online: 'Online',
    mixta: 'Semipresencial',
    presencial: 'Presencial',
};

export const modalityStyles: Record<CareerModality, string> = {
    online: 'bg-upel-green/10 text-upel-green ring-1 ring-upel-green/20',
    mixta: 'bg-upel-blue/10 text-upel-blue ring-1 ring-upel-blue/20',
    presencial: 'bg-upel-gold/15 text-[#8a6c0d] ring-1 ring-upel-gold/30',
};

export const careers: Career[] = [
    {
        id: 1,
        name: 'Educación Integral',
        description:
            'Formación para acompañar el desarrollo integral de niños y niñas en la etapa primaria, con herramientas didácticas innovadoras.',
        modality: 'online',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '📚',
    },
    {
        id: 2,
        name: 'Educación Inicial',
        description:
            'Prepárate para estimular el desarrollo cognitivo, afectivo y social de la primera infancia desde una mirada humanista.',
        modality: 'mixta',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🧸',
    },
    {
        id: 3,
        name: 'Educación Especial',
        description:
            'Atención educativa a personas con diversidad funcional, promoviendo la inclusión y la equidad en el aula.',
        modality: 'online',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🤝',
    },
    {
        id: 4,
        name: 'Matemática y Física',
        description:
            'Domina los lenguajes de la ciencia exacta y forma nuevas generaciones de pensadores críticos y creativos.',
        modality: 'presencial',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '📐',
    },
    {
        id: 5,
        name: 'Ciencias Naturales y Biología',
        description:
            'Explora la vida y el entorno natural para enseñar ciencia desde la experimentación y el asombro.',
        modality: 'mixta',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🔬',
    },
    {
        id: 6,
        name: 'Lengua y Literatura',
        description:
            'Desarrolla la competencia comunicativa y el amor por las letras para transformar la enseñanza del idioma.',
        modality: 'online',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '📖',
    },
    {
        id: 7,
        name: 'Ciencias Sociales',
        description:
            'Comprende la sociedad, la historia y la ciudadanía para formar estudiantes comprometidos con su país.',
        modality: 'mixta',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🌎',
    },
    {
        id: 8,
        name: 'Educación Física y Deportes',
        description:
            'Promueve la salud, el movimiento y el trabajo en equipo a través de la pedagogía del deporte.',
        modality: 'presencial',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🏅',
    },
    {
        id: 9,
        name: 'Tecnología Educativa',
        description:
            'Diseña experiencias de aprendizaje digitales y lidera la transformación tecnológica de las instituciones.',
        modality: 'online',
        duration: '4 años',
        degree: 'Ingeniería / TsU',
        icon: '💻',
    },
    {
        id: 10,
        name: 'Idiomas Modernos - Inglés',
        description:
            'Alcanza un dominio avanzado del inglés y aprende a enseñarlo con metodologías comunicativas actuales.',
        modality: 'mixta',
        duration: '5 años',
        degree: 'Licenciatura',
        icon: '🗣️',
    },
    {
        id: 11,
        name: 'Educación Rural',
        description:
            'Acompaña procesos educativos en contextos rurales con pertinencia social, cultural y productiva.',
        modality: 'presencial',
        duration: '4 años',
        degree: 'Técnico Superior / Lic.',
        icon: '🌱',
    },
    {
        id: 12,
        name: 'Administración Educacional',
        description:
            'Gestiona instituciones educativas con visión estratégica, liderazgo y sentido ético del servicio público.',
        modality: 'online',
        duration: '4 años',
        degree: 'Licenciatura',
        icon: '🏛️',
    },
];
