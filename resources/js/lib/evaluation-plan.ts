/**
 * Reglas y utilidades compartidas por los planes de evaluación del portal
 * docente. Las notas de cada evaluación van de 1 a 20 y la definitiva se
 * muestra sobre 10, con 6 como nota mínima aprobatoria.
 */
export type GradingLimits = {
    min_item_weight: number;
    max_item_weight: number;
    total_weight: number;
    max_item_score: number;
    passing_grade: number;
    final_scale: number;
};

export type GradedEntry = {
    score: number | null;
    weight: number;
};

/**
 * Convierte el texto de un campo de nota en un número válido o null.
 */
export function parseScore(value: string, maxScore = 20): number | null {
    const normalized = value.trim().replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const score = Number(normalized);

    if (!Number.isFinite(score) || score < 1 || score > maxScore) {
        return null;
    }

    return score;
}

/**
 * Promedio ponderado sobre 20 considerando solo las evaluaciones con nota.
 */
export function weightedScore(entries: GradedEntry[]): number | null {
    let weighted = 0;
    let weights = 0;

    for (const entry of entries) {
        if (entry.score === null || entry.weight <= 0) {
            continue;
        }

        weighted += entry.score * entry.weight;
        weights += entry.weight;
    }

    return weights === 0 ? null : Math.round((weighted / weights) * 100) / 100;
}

/**
 * Lleva una nota de la escala 1-20 a la escala 1-10.
 */
export function toScaleTen(score: number | null): number | null {
    return score === null ? null : Math.round((score / 2) * 100) / 100;
}

/**
 * Formatea una nota con coma decimal y sin ceros innecesarios.
 */
export function formatScore(score: number | null, digits = 2): string {
    if (score === null) {
        return '—';
    }

    return score
        .toFixed(digits)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}

/**
 * Fecha de hoy en formato ISO corto para los campos date.
 */
export function todayInput(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Convierte una fecha dd/mm/yyyy (formato de la planilla) a yyyy-mm-dd.
 */
export function toDateInput(value: string | null): string {
    if (!value) {
        return todayInput();
    }

    const [day, month, year] = value.split('/');

    return day && month && year ? `${year}-${month}-${day}` : todayInput();
}

/**
 * Convierte una fecha yyyy-mm-dd a dd/mm/yyyy.
 */
export function toDateLabel(value: string): string {
    if (!value) {
        return '—';
    }

    const [year, month, day] = value.split('-');

    return day && month && year ? `${day}/${month}/${year}` : value;
}
