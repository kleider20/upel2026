import { Link, router } from '@inertiajs/react';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileSearch,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpelLogo } from '@/components/landing/brand';
import { logout } from '@/routes';

export type StudentTab =
  | 'inicio'
  | 'solicitud'
  | 'materias'
  | 'calificaciones'
  | 'profesores'
  | 'pensum'
  | 'horario'
  | 'perfil'
  | 'tramites';

type SidebarProps = {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const mainMenuItems = [
  { id: 'inicio' as StudentTab, label: 'Inicio', icon: LayoutDashboard, section: 'Mi vida académica' },
  { id: 'solicitud' as StudentTab, label: 'Mi Solicitud', icon: FileSearch },
  { id: 'materias' as StudentTab, label: 'Mis Materias', icon: BookOpen },
  { id: 'calificaciones' as StudentTab, label: 'Mis Calificaciones', icon: ClipboardList },
  { id: 'profesores' as StudentTab, label: 'Mis Profesores', icon: Users },
  { id: 'pensum' as StudentTab, label: 'Mi Carrera y Pénsum', icon: GraduationCap },
  { id: 'horario' as StudentTab, label: 'Mi Horario', icon: Calendar },
];

const accountMenuItems = [
  { id: 'perfil' as StudentTab, label: 'Mi Perfil', icon: User, section: 'Cuenta' },
  { id: 'tramites' as StudentTab, label: 'Mis Trámites', icon: FileText },
];

export function Sidebar({ activeTab, onSelectTab, mobileOpen, onCloseMobile }: SidebarProps) {
  const handleLogout = () => {
    router.post(logout.url());
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-upel-navy/60 backdrop-blur-sm lg:hidden print:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-border bg-upel-navy text-white transition-transform duration-300 lg:translate-x-0 print:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-[74px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <img src="/images/upel-mark.png" alt="UPEL" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-wide text-white">UPEL</h1>
            <p className="text-[0.65rem] font-semibold text-white/60">Portal Estudiantil</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-white/45 uppercase">
              Mi vida académica
            </p>
            {mainMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#c9a227_0%,#e8c15a_100%)] text-upel-navy shadow-[0_10px_25px_-10px_rgba(201,162,39,0.7)]'
                      : 'text-white/80 hover:bg-white/8 hover:text-white',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-upel-navy' : 'text-white/60 group-hover:text-white')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-1">
            <p className="px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] text-white/45 uppercase">
              Cuenta y Servicios
            </p>
            {accountMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#c9a227_0%,#e8c15a_100%)] text-upel-navy shadow-[0_10px_25px_-10px_rgba(201,162,39,0.7)]'
                      : 'text-white/80 hover:bg-white/8 hover:text-white',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-upel-navy' : 'text-white/60 group-hover:text-white')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Cerrar sesión</span>
          </button>
          <div className="mt-3 px-3 pt-3 border-t border-white/10 text-[0.62rem] text-white/45 leading-relaxed">
            <p className="font-semibold">Universidad Pedagógica Experimental Libertador</p>
            <p className="mt-0.5 text-upel-gold-light">2026-II · v2.7</p>
          </div>
        </div>
      </aside>
    </>
  );
}
