import { Head } from '@inertiajs/react';
import {
    AdmissionWindowPanel,
    type AdmissionWindowData,
    type AdmissionWindowVariant,
} from '@/components/admin/admission-window-panel';
import { PageHeader } from '@/components/portal/page-header';

type Props = {
    variant: AdmissionWindowVariant;
    admission_window: AdmissionWindowData;
    update_url: string;
};

const headings: Record<
    AdmissionWindowVariant,
    { eyebrow: string; title: string; description: string }
> = {
    inscripcion: {
        eyebrow: 'Inscripciones',
        title: 'Habilitar inscripciones',
        description:
            'Define el rango de fechas y el estado de la ventana de inscripciones en línea.',
    },
    preinscripcion: {
        eyebrow: 'Preinscripciones',
        title: 'Habilitar preinscripciones',
        description:
            'Define el rango de fechas y el estado de la ventana de preinscripciones en línea.',
    },
};

/**
 * Apartado del panel para habilitar o deshabilitar cada ventana de admisión.
 */
export default function AdminInscripcionesIndex({
    variant,
    admission_window,
    update_url,
}: Props) {
    const heading = headings[variant];

    return (
        <>
            <Head title={heading.title} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow={heading.eyebrow}
                    title={heading.title}
                    description={heading.description}
                />
                <AdmissionWindowPanel
                    admissionWindow={admission_window}
                    variant={variant}
                    updateUrl={update_url}
                />
            </div>
        </>
    );
}
