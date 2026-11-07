import { useEffect, useRef, useState } from 'react';

type Options = {
    /** Porcentaje del elemento visible necesario para activar. */
    threshold?: number;
    rootMargin?: string;
    /** Si es false, el observer sigue reaccionando al salir y entrar. */
    once?: boolean;
};

/**
 * Observa un elemento y devuelve si está dentro del viewport.
 * Se usa para animaciones de entrada y contadores.
 */
export function useIntersectionObserver<
    T extends HTMLElement = HTMLDivElement,
>({
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    once = true,
}: Options = {}) {
    const ref = useRef<T | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;

        // Fallback para navegadores sin IntersectionObserver.
        if (!element || typeof IntersectionObserver === 'undefined') {
            setIsIntersecting(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);

                    if (once) {
                        observer.disconnect();
                    }

                    return;
                }

                if (!once) {
                    setIsIntersecting(false);
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, isIntersecting };
}
