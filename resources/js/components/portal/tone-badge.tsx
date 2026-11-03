import { cn } from '@/lib/utils';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'navy' | 'gold' | 'slate';

const toneClasses: Record<Tone, string> = {
    green: 'bg-upel-green/10 text-upel-green ring-upel-green/20',
    amber: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25',
    red: 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25',
    blue: 'bg-upel-blue/10 text-upel-blue ring-upel-blue/20',
    navy: 'bg-upel-navy/10 text-upel-navy ring-upel-navy/15 dark:bg-upel-blue-300/15 dark:text-upel-blue-300 dark:ring-upel-blue-300/20',
    gold: 'bg-upel-gold/15 text-[#8a6c0d] ring-upel-gold/30 dark:text-upel-gold-light',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25',
};

/**
 * Insignia de estado reutilizable para tablas y tarjetas del portal.
 */
export function ToneBadge({
    tone = 'slate',
    children,
    className,
}: {
    tone?: Tone;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold tracking-wide uppercase ring-1 ring-inset',
                toneClasses[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

export { toneClasses };
