import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Conteo con singular y plural: `countLabel(1, 'nota', 'notas')` → "1 nota".
 */
export function countLabel(
    count: number,
    singular: string,
    plural: string,
): string {
    return `${count} ${count === 1 ? singular : plural}`;
}
