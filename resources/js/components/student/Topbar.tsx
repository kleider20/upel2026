import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { Auth } from '@/types';
import type { StudentTab } from './Sidebar';

type TopbarProps = {
    activeTab: StudentTab;
    onOpenMobile: () => void;
    onSelectTab: (tab: StudentTab) => void;
};

const tabTitles: Record<StudentTab, string> = {
    inicio: 'Resumen Personal',
    solicitud: 'Mi Solicitud de Admisión',
    materias: 'Mis Materias',
    calificaciones: 'Mis Calificaciones',
    profesores: 'Mis Profesores',
    pensum: 'Mi Carrera y Pénsum',
    horario: 'Mi Horario',
    perfil: 'Mi Perfil',
    tramites: 'Mis Trámites y Constancias',
};

export function Topbar({ activeTab, onOpenMobile, onSelectTab }: TopbarProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : 'UP';

    return (
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:bg-card/90 print:hidden">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenMobile}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-upel-navy hover:bg-upel-cloud lg:hidden dark:text-foreground dark:hover:bg-muted"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div>
                    <span className="text-[0.62rem] font-bold tracking-[0.14em] text-upel-blue uppercase">
                        Portal Estudiantil
                    </span>
                    <h2 className="font-display text-lg font-bold text-upel-navy sm:text-xl dark:text-foreground">
                        {tabTitles[activeTab]}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onSelectTab('perfil')}
                    className="group flex items-center gap-2.5 rounded-2xl border border-border bg-upel-cloud/50 p-1.5 pr-3 transition-colors hover:bg-upel-cloud dark:bg-muted/50 dark:hover:bg-muted"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                        {initials}
                    </div>
                    <div className="hidden text-left sm:block">
                        <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                            {user?.name ?? 'Estudiante'}
                        </p>
                        <p className="text-[0.62rem] font-semibold text-emerald-600 dark:text-emerald-400">
                            ● Estudiante activo
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
}
