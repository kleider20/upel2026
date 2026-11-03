import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

/**
 * Envoltorio que revela su contenido con una transición suave
 * cuando entra en el viewport.
 */
export function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={cn('reveal', isIntersecting && 'is-visible', className)}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
