import { useEffect, useState } from 'react';

/**
 * Anima un número desde 0 hasta `target` con easing cúbico.
 * No arranca hasta que `active` sea true (elemento visible).
 */
export function useCounter(target: number, active: boolean, duration = 2000) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!active) {
            return;
        }

        if (
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            setValue(target);

            return;
        }

        let animationFrame = 0;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setValue(Math.round(target * eased));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(tick);
            }
        };

        animationFrame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrame);
    }, [target, active, duration]);

    return value;
}

const numberFormatter = new Intl.NumberFormat('es-VE');

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}
