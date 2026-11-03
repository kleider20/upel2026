/**
 * Claustro docente mostrado en el slider de profesores.
 * `palette` alimenta el avatar SVG generado en tiempo de render.
 */

export type TeacherPalette = {
    background: string;
    skin: string;
    hair: string;
    outfit: string;
    accent: string;
};

export type Teacher = {
    id: number;
    name: string;
    role: string;
    description: string;
    gender: 'female' | 'male';
    glasses?: boolean;
    email: string;
    palette: TeacherPalette;
};

const palettes: TeacherPalette[] = [
    {
        background: '#e8f0fb',
        skin: '#f0c9a8',
        hair: '#3b2a20',
        outfit: '#0a2540',
        accent: '#c9a227',
    },
    {
        background: '#eaf5f1',
        skin: '#c98d63',
        hair: '#1d1d1d',
        outfit: '#113a63',
        accent: '#12876f',
    },
    {
        background: '#fdf4e0',
        skin: '#f4d2b8',
        hair: '#8a5a2b',
        outfit: '#1e5fa8',
        accent: '#c9a227',
    },
    {
        background: '#eef0f8',
        skin: '#a86b45',
        hair: '#241812',
        outfit: '#2d3a55',
        accent: '#6da8e8',
    },
    {
        background: '#fbeef0',
        skin: '#e8b48f',
        hair: '#5a3620',
        outfit: '#7a1f2b',
        accent: '#c9a227',
    },
    {
        background: '#e9f3f8',
        skin: '#d9a074',
        hair: '#2b2b2b',
        outfit: '#0f4c5c',
        accent: '#12876f',
    },
];

export const teachers: Teacher[] = [
    {
        id: 1,
        name: 'Dra. Carmen Rodríguez',
        role: 'Decana de Postgrado',
        description:
            'Doctora en Educación con 22 años de experiencia en formación avanzada y gestión académica.',
        gender: 'female',
        email: 'carmen.rodriguez@upel.edu.ve',
        palette: palettes[0],
    },
    {
        id: 2,
        name: 'Dr. José Hernández',
        role: 'Director de Investigación',
        description:
            'Investigador en políticas educativas y autor de más de 40 publicaciones arbitradas.',
        gender: 'male',
        glasses: true,
        email: 'jose.hernandez@upel.edu.ve',
        palette: palettes[1],
    },
    {
        id: 3,
        name: 'Mgtr. Ana Martínez',
        role: 'Coordinadora Académica',
        description:
            'Especialista en currículo y evaluación, acompañando la innovación pedagógica institucional.',
        gender: 'female',
        email: 'ana.martinez@upel.edu.ve',
        palette: palettes[2],
    },
    {
        id: 4,
        name: 'Dr. Luis González',
        role: 'Jefe de Ciencias Sociales',
        description:
            'Historiador y docente universitario comprometido con la formación ciudadana.',
        gender: 'male',
        email: 'luis.gonzalez@upel.edu.ve',
        palette: palettes[3],
    },
    {
        id: 5,
        name: 'Dra. María Pérez',
        role: 'Jefa de Educación Especial',
        description:
            'Referente nacional en inclusión educativa y diseño universal para el aprendizaje.',
        gender: 'female',
        glasses: true,
        email: 'maria.perez@upel.edu.ve',
        palette: palettes[4],
    },
    {
        id: 6,
        name: 'Mgtr. Carlos Silva',
        role: 'Coordinador Campus Virtual',
        description:
            'Lidera la transformación digital de la UPEL y el diseño de experiencias e-learning.',
        gender: 'male',
        email: 'carlos.silva@upel.edu.ve',
        palette: palettes[5],
    },
    {
        id: 7,
        name: 'Dra. Isabel Rojas',
        role: 'Directora de Extensión',
        description:
            'Articula la universidad con las comunidades a través de proyectos socioeducativos.',
        gender: 'female',
        email: 'isabel.rojas@upel.edu.ve',
        palette: palettes[1],
    },
    {
        id: 8,
        name: 'Dr. Andrés Blanco',
        role: 'Jefe de Matemática y Física',
        description:
            'Matemático y divulgador científico, impulsor de las olimpiadas escolares de la región.',
        gender: 'male',
        glasses: true,
        email: 'andres.blanco@upel.edu.ve',
        palette: palettes[2],
    },
    {
        id: 9,
        name: 'Mgtr. Gabriela Núñez',
        role: 'Coordinadora de Idiomas',
        description:
            'Especialista en didáctica del inglés y certificación internacional de competencias.',
        gender: 'female',
        email: 'gabriela.nunez@upel.edu.ve',
        palette: palettes[0],
    },
    {
        id: 10,
        name: 'Dr. Ricardo Mendoza',
        role: 'Jefe de Educación Física',
        description:
            'Promueve el deporte escolar, la salud integral y el liderazgo a través del movimiento.',
        gender: 'male',
        email: 'ricardo.mendoza@upel.edu.ve',
        palette: palettes[4],
    },
    {
        id: 11,
        name: 'Dra. Sofía Delgado',
        role: 'Directora de Bienestar Estudiantil',
        description:
            'Acompaña la permanencia y el bienestar emocional de la comunidad estudiantil.',
        gender: 'female',
        email: 'sofia.delgado@upel.edu.ve',
        palette: palettes[5],
    },
    {
        id: 12,
        name: 'Mgtr. Pedro Ramírez',
        role: 'Coordinador de Prácticas Docentes',
        description:
            'Supervisa la vinculación de los futuros docentes con las escuelas del país.',
        gender: 'male',
        glasses: true,
        email: 'pedro.ramirez@upel.edu.ve',
        palette: palettes[3],
    },
];
