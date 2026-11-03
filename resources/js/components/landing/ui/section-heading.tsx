import { cn } from '@/lib/utils';

/**
 * Encabezado reutilizable para las secciones de la landing.
 */
export function SectionHeading({
    eyebrow,
    title,
    description,
    align = 'center',
    tone = 'dark',
    className,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'center' | 'left';
    tone?: 'dark' | 'light';
    className?: string;
}) {
    const isLight = tone === 'light';

    return (
        <div
            className={cn(
                'flex flex-col gap-4',
                align === 'center' ? 'mx-auto max-w-3xl text-center' : 'text-left',
                className,
            )}
        >
            {eyebrow && (
                <span
                    className={cn(
                        'inline-flex w-fit items-center gap-2 rounded-[50px] px-4 py-1.5 text-[0.7rem] font-extrabold tracking-[0.18em] uppercase',
                        align === 'center' && 'mx-auto',
                        isLight
                            ? 'bg-white/10 text-upel-gold-light ring-1 ring-white/15'
                            : 'bg-upel-gold/12 text-[#8a6c0d] ring-1 ring-upel-gold/25',
                    )}
                >
                    <span className="size-1.5 rounded-full bg-current" />
                    {eyebrow}
                </span>
            )}

            <h2
                className={cn(
                    'font-display text-3xl leading-[1.12] font-bold text-balance sm:text-4xl lg:text-[2.75rem]',
                    isLight ? 'text-white' : 'text-upel-navy',
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        'text-base leading-relaxed text-pretty sm:text-lg',
                        isLight ? 'text-white/72' : 'text-upel-slate',
                    )}
                >
                    {description}
                </p>
            )}
        </div>
    );
}
