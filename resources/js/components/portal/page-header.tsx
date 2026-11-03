import { cn } from '@/lib/utils';

/**
 * Encabezado común de las páginas del portal.
 */
export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-5 rounded-2xl border border-border/70 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between dark:bg-card',
                className,
            )}
        >
            <div className="max-w-3xl">
                {eyebrow ? (
                    <p className="text-[0.68rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="mt-2 font-display text-3xl leading-tight font-bold text-upel-navy sm:text-4xl dark:text-foreground">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
    );
}
