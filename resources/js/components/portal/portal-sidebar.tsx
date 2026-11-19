import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';

/**
 * Elemento del menú lateral. `key` identifica la página activa y `icon` puede
 * ser un icono de Lucide o cualquier componente que acepte `className`.
 */
export type PortalNavItem = {
    key: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: React.ReactNode;
    trailing?: React.ReactNode;
};

/** Sección del menú lateral; las secciones administrativas son plegables. */
export type PortalNavSection = {
    label: string;
    items: PortalNavItem[];
    collapsible?: boolean;
    badge?: React.ReactNode;
    /**
     * Las secciones destacadas llevan un acento dorado para diferenciar los
     * encabezados de los menús principales de los enlaces de su submenú.
     */
    featured?: boolean;
};

type PortalSidebarProps = {
    portalLabel: string;
    sections: PortalNavSection[];
    activeKey: string | null;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    footerExtra?: React.ReactNode;
    footerNote?: string;
};

/**
 * Barra lateral compartida por todos los portales. La estructura y los estilos
 * son idénticos; cada rol entrega sus propias secciones, enlaces y énfasis.
 */
export function PortalSidebar({
    portalLabel,
    sections,
    activeKey,
    mobileOpen,
    onCloseMobile,
    footerExtra,
    footerNote = '2026-II · v2.7',
}: PortalSidebarProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        {},
    );

    const handleLogout = () => router.post(logout.url());

    return (
        <>
            {mobileOpen ? (
                <div
                    className="fixed inset-0 z-40 bg-upel-navy/60 backdrop-blur-sm lg:hidden print:hidden"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-border bg-upel-navy text-white transition-transform duration-300 lg:translate-x-0 print:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex h-[74px] items-center gap-3 border-b border-white/10 px-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                        <img
                            src="/images/upel-mark.png"
                            alt="UPEL"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-display text-base font-bold tracking-wide text-white">
                            UPEL
                        </h1>
                        <p className="truncate text-[0.65rem] font-semibold text-white/60">
                            {portalLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={onCloseMobile}
                        className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
                    {sections.map((section) => {
                        const hasActive = section.items.some(
                            (item) => item.key === activeKey,
                        );
                        // Una sección se abre automáticamente cuando se está
                        // en una de sus rutas (o en una ruta hija del submenú),
                        // para que el usuario vea siempre dónde está ubicado.
                        const isOpen =
                            !section.collapsible ||
                            hasActive ||
                            (openSections[section.label] ?? false);
                        const headingClass = cn(
                            'flex w-full items-center gap-2 px-3 pb-2 text-[0.62rem] font-extrabold tracking-[0.16em] uppercase transition-colors',
                            section.featured
                                ? hasActive
                                    ? 'text-upel-gold-light'
                                    : 'text-upel-gold/80'
                                : hasActive
                                  ? 'text-white/80'
                                  : 'text-white/45',
                        );

                        return (
                            <div
                                key={section.label}
                                className={cn(
                                    'space-y-1 transition-colors',
                                    hasActive
                                        ? '-mx-2 rounded-xl bg-white/5 p-2'
                                        : section.featured
                                          ? '-ml-2 border-l-2 border-upel-gold/60 pl-2'
                                          : '',
                                )}
                            >
                                {section.collapsible ? (
                                    <button
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() =>
                                            setOpenSections((current) => ({
                                                ...current,
                                                [section.label]: !isOpen,
                                            }))
                                        }
                                        className={cn(
                                            headingClass,
                                            'hover:text-white',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                                                section.featured || hasActive
                                                    ? hasActive
                                                        ? 'bg-upel-gold-light'
                                                        : 'bg-upel-gold'
                                                    : 'bg-transparent',
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span>{section.label}</span>
                                        {section.badge}
                                        <ChevronDown
                                            className={cn(
                                                'ml-auto h-3.5 w-3.5 shrink-0 transition-transform',
                                                isOpen && 'rotate-180',
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ) : (
                                    <p className={headingClass}>
                                        <span
                                            className={cn(
                                                'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                                                section.featured || hasActive
                                                    ? hasActive
                                                        ? 'bg-upel-gold-light'
                                                        : 'bg-upel-gold'
                                                    : 'bg-transparent',
                                            )}
                                            aria-hidden="true"
                                        />
                                        {section.label}
                                        {section.badge}
                                    </p>
                                )}

                                {isOpen ? (
                                    <div className="space-y-1">
                                        {section.items.map((item) => {
                                            const isActive =
                                                item.key === activeKey;
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={item.key}
                                                    href={item.href}
                                                    onClick={onCloseMobile}
                                                    className={cn(
                                                        'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200',
                                                        isActive
                                                            ? 'bg-[linear-gradient(135deg,#c9a227_0%,#e8c15a_100%)] text-upel-navy shadow-[0_10px_25px_-10px_rgba(201,162,39,0.7)]'
                                                            : 'text-white/80 hover:bg-white/8 hover:text-white',
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            'h-4 w-4 shrink-0',
                                                            isActive
                                                                ? 'text-upel-navy'
                                                                : 'text-white/60 group-hover:text-white',
                                                        )}
                                                    />
                                                    <span>{item.label}</span>
                                                    {item.badge}
                                                    {item.trailing}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-white/10 p-4">
                    {footerExtra}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                        <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        <span>Cerrar sesión</span>
                    </button>
                    <div className="mt-3 border-t border-white/10 px-3 pt-3 text-[0.62rem] leading-relaxed text-white/45">
                        <p className="font-semibold">
                            Universidad Pedagógica Experimental Libertador
                        </p>
                        <p className="mt-0.5 text-upel-gold-light">
                            {footerNote}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
