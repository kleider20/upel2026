import type { LucideIcon } from 'lucide-react';
import {
    Award,
    BookOpen,
    CalendarDays,
    ClipboardList,
    GraduationCap,
    Inbox,
    Layers,
    LayoutGrid,
    Library,
    PlusCircle,
    ShieldCheck,
    UserCog,
    Users,
    Wallet,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
    users: Users,
    'graduation-cap': GraduationCap,
    library: Library,
    'book-open': BookOpen,
    'calendar-days': CalendarDays,
    'plus-circle': PlusCircle,
    'clipboard-list': ClipboardList,
    wallet: Wallet,
    award: Award,
    'user-cog': UserCog,
    'shield-check': ShieldCheck,
    dashboard: LayoutGrid,
    inbox: Inbox,
    layers: Layers,
};

/**
 * Resuelve el icono de un módulo administrativo a partir de su clave.
 */
export function ModuleIcon({
    name,
    className,
}: {
    name?: string | null;
    className?: string;
}) {
    const Icon = icons[name ?? 'dashboard'] ?? LayoutGrid;

    return <Icon className={className} aria-hidden="true" />;
}
