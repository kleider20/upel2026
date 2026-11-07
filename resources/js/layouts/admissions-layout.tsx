import { Link } from '@inertiajs/react';
import { ArrowLeft, FileSearch, GraduationCap } from 'lucide-react';
import { FlashMessages } from '@/components/flash-messages';
import { UpelLogo } from '@/components/landing/brand';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { landing } from '@/routes';
import {
    create as admissionCreate,
    lookup as admissionLookup,
} from '@/routes/admissions';

const navigation = [
    {
        label: 'Solicitud de admisión',
        href: admissionCreate(),
        icon: GraduationCap,
    },
    {
        label: 'Consultar estado',
        href: admissionLookup(),
        icon: FileSearch,
    },
];

/**
 * Marco público del proceso de admisión.
 *
 * Se usa en las páginas de preinscripción y seguimiento, fuera del portal
 * autenticado, para que el aspirante siempre tenga a mano el regreso al sitio
 * institucional y la consulta de su solicitud.
 */
export default function AdmissionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex min-h-screen flex-col bg-upel-cloud text-foreground">
            <FlashMessages />

            <header className="sticky top-0 z-40 border-b border-upel-navy/10 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={landing()}
                        className="flex shrink-0 items-center rounded-lg"
                        aria-label="UPEL, volver al sitio institucional"
                    >
                        <UpelLogo className="h-9 sm:h-10" />
                    </Link>

                    <nav
                        aria-label="Navegación del proceso de admisión"
                        className="hidden items-center gap-1 sm:flex"
                    >
                        {navigation.map((item) => {
                            const active = isCurrentOrParentUrl(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors',
                                        active
                                            ? 'bg-upel-navy text-white'
                                            : 'text-upel-navy/70 hover:bg-upel-navy/5 hover:text-upel-navy',
                                    )}
                                >
                                    <Icon
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <Link
                        href={landing()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-upel-navy/12 px-3 py-2 text-[0.7rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">
                            Volver al sitio
                        </span>
                        <span className="sm:hidden">Inicio</span>
                    </Link>
                </div>

                <nav
                    aria-label="Navegación del proceso de admisión en móvil"
                    className="flex gap-1 overflow-x-auto border-t border-upel-navy/8 px-4 py-2 sm:hidden"
                >
                    {navigation.map((item) => {
                        const active = isCurrentOrParentUrl(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[0.68rem] font-bold transition-colors',
                                    active
                                        ? 'bg-upel-navy text-white'
                                        : 'text-upel-navy/70 hover:bg-upel-navy/5',
                                )}
                            >
                                <Icon className="size-3.5" aria-hidden="true" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </header>

            <main id="contenido" className="flex-1">
                {children}
            </main>

            <footer className="border-t border-upel-navy/10 bg-white">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
                    <p className="text-[0.68rem] font-semibold text-upel-slate">
                        Universidad Pedagógica Experimental Libertador · Proceso
                        de admisión 2027
                    </p>
                    <p className="text-[0.68rem] text-upel-slate/70">
                        ¿Necesitas ayuda? Escribe a{' '}
                        <a
                            href="mailto:admision@upel.edu.ve"
                            className="font-bold text-upel-blue hover:text-upel-navy"
                        >
                            admision@upel.edu.ve
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
