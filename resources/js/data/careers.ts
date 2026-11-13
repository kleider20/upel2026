/**
 * Tipos y estilos compartidos por la sección pública de carreras.
 * Los datos reales provienen de la base de datos (LandingController).
 */

export type CareerModality = 'online' | 'mixta' | 'presencial';

export type LandingCareer = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    degree: string;
    icon: string;
    image_url: string | null;
    modality: CareerModality;
    duration: string;
    show_url: string;
};

export type LandingCareerSubject = {
    id: number;
    code: string;
    name: string;
    credits: number;
    theory_hours: number;
    practice_hours: number;
    modality: string;
    modality_label: string;
    prerequisites: string | null;
};

export type LandingPensumPeriod = {
    semester: number;
    label: string;
    credits: number;
    subjects: LandingCareerSubject[];
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
