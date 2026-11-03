import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Tone, toneClasses } from '@/components/portal/tone-badge';

/**
 * Tarjeta de resumen para los paneles de estudiante, profesor, graduado y admin.
 */
export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'blue',
    className,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: LucideIcon;
    tone?: Tone;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-card',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        {label}
                    </p>
                    <p className="mt-2 font-display text-3xl leading-none font-bold text-upel-navy dark:text-foreground">
                        {value}
                    </p>
                    {hint ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {hint}
                        </p>
                    ) : null}
                </div>

                {Icon ? (
                    <span
                        className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                            toneClasses[tone],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                ) : null}
            </div>
        </div>
    );
}
