import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Estado vacío reutilizable para secciones sin datos.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    className,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-upel-cloud/60 px-6 py-12 text-center dark:bg-muted/30',
                className,
            )}
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-upel-blue shadow-sm ring-1 ring-border dark:bg-card">
                <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-upel-navy dark:text-foreground">
                {title}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
