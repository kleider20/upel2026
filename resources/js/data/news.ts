/**
 * Noticias institucionales de la landing.
 */

export type NewsIcon = 'laptop' | 'graduation' | 'globe' | 'trophy' | 'handshake' | 'calendar';

export type NewsItem = {
    id: number;
    category: string;
    date: string;
    title: string;
    excerpt: string;
    icon: NewsIcon;
    gradient: string;
};

export const news: NewsItem[] = [
    {
        id: 1,
        category: 'Académico',
        date: '2026-10-20',
        title: 'UPEL amplía su oferta de carreras 100% online para 2027',
        excerpt:
            'Cinco nuevos programas de pregrado se suman al campus virtual, con acompañamiento docente y prácticas en entornos digitales.',
        icon: 'laptop',
        gradient: 'linear-gradient(135deg, #0a2540 0%, #1e5fa8 100%)',
    },
    {
        id: 2,
        category: 'Graduación',
        date: '2026-10-15',
        title: 'Acto de grado: 1.200 nuevos licenciados en educación',
        excerpt:
            'La promoción “Maestros que transforman” celebró su graduación en el auditorio principal de la sede Caracas.',
        icon: 'graduation',
        gradient: 'linear-gradient(135deg, #113a63 0%, #c9a227 100%)',
    },
    {
        id: 3,
        category: 'Internacional',
        date: '2026-10-08',
        title: 'Congreso Internacional de Pedagogía reunirá a 40 países',
        excerpt:
            'Investigadores y docentes compartirán experiencias sobre inclusión, tecnología y ciudadanía global.',
        icon: 'globe',
        gradient: 'linear-gradient(135deg, #12876f 0%, #1e5fa8 100%)',
    },
    {
        id: 4,
        category: 'Investigación',
        date: '2026-09-29',
        title: 'Estudiantes UPEL ganan premio nacional de investigación',
        excerpt:
            'El proyecto sobre lectura crítica en zonas rurales recibió el reconocimiento del Ministerio de Educación.',
        icon: 'trophy',
        gradient: 'linear-gradient(135deg, #8a6c0d 0%, #e8c15a 100%)',
    },
    {
        id: 5,
        category: 'Alianzas',
        date: '2026-09-18',
        title: 'Nueva alianza con universidades de Latinoamérica',
        excerpt:
            'El convenio permitirá movilidad estudiantil, pasantías internacionales y proyectos de investigación conjuntos.',
        icon: 'handshake',
        gradient: 'linear-gradient(135deg, #3b1e63 0%, #1e5fa8 100%)',
    },
    {
        id: 6,
        category: 'Extensión',
        date: '2026-09-05',
        title: 'Inscripciones abiertas para talleres virtuales de octubre',
        excerpt:
            'Oratoria, neuroeducación e inteligencia artificial son algunas de las propuestas de formación continua.',
        icon: 'calendar',
        gradient: 'linear-gradient(135deg, #7a1f2b 0%, #c94f5e 100%)',
    },
];
