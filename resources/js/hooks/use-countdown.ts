import { useEffect, useState } from 'react';

export type CountdownValue = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    /** Milisegundos restantes; negativo si la fecha ya pasó. */
    total: number;
    isPast: boolean;
};

function calculateRemaining(target: string): CountdownValue {
    const targetTime = new Date(target).getTime();

    if (Number.isNaN(targetTime)) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            total: 0,
            isPast: true,
        };
    }

    const total = targetTime - Date.now();

    if (total <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            total,
            isPast: true,
        };
    }

    return {
        days: Math.floor(total / 86_400_000),
        hours: Math.floor((total / 3_600_000) % 24),
        minutes: Math.floor((total / 60_000) % 60),
        seconds: Math.floor((total / 1_000) % 60),
        total,
        isPast: false,
    };
}

/**
 * Cuenta regresiva en tiempo real. Se actualiza cada segundo y se limpia
 * automáticamente al desmontar el componente.
 */
export function useCountdown(target: string): CountdownValue {
    const [remaining, setRemaining] = useState<CountdownValue>(() =>
        calculateRemaining(target),
    );

    useEffect(() => {
        setRemaining(calculateRemaining(target));

        const interval = window.setInterval(() => {
            setRemaining(calculateRemaining(target));
        }, 1000);

        return () => window.clearInterval(interval);
    }, [target]);

    return remaining;
}

/** Rellena con ceros a la izquierda para el formato DD:HH:MM:SS. */
export function pad(value: number): string {
    return value.toString().padStart(2, '0');
}
