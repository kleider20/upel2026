/**
 * Reglas y utilidades compartidas por los planes de evaluación del portal
 * docente. Las notas de cada evaluación van de 1 a 20 y la definitiva sobre 10
 * es la suma de los aportes de las evaluaciones calificadas (nota ÷ 2 ×
 * porcentaje), con 6 como nota mínima aprobatoria.
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

export type ScoreInput = {
    value: string;
    clamped: boolean;
};

/**
 * Limita lo que se escribe en una celda de nota: hasta dos enteros y dos
 * decimales, con coma o punto como separador. Si el número supera la nota
 * máxima se reajusta a ese tope y se marca `clamped` para avisar al docente.
 */
export function sanitizeScoreInput(value: string, maxScore = 20): ScoreInput {
    const cleaned = value.replace(/[^\d.,]/g, '');

    if (cleaned === '') {
        return { value: '', clamped: false };
    }

    const [rawInteger, ...decimalParts] = cleaned.split(/[.,]/);
    const integer = (rawInteger || '0').replace(/^0+(?=\d)/, '');
    const decimals = decimalParts.join('').slice(0, 2);
    const score = Number(`${integer}.${decimals || '0'}`);

    if (score > maxScore) {
        return { value: String(maxScore), clamped: true };
    }

    return {
        value: decimalParts.length > 0 ? `${integer},${decimals}` : integer,
        clamped: false,
    };
}

/**
 * Definitiva acumulada sobre 10: suma de los aportes de las evaluaciones ya
 * calificadas, sin normalizar por el porcentaje que falta cargar.
 */
export function accumulatedTen(entries: GradedEntry[]): number | null {
    let total = 0;
    let graded = 0;

    for (const entry of entries) {
        const contribution = weightedContribution(entry.score, entry.weight);

        if (contribution === null) {
            continue;
        }

        total += contribution;
        graded++;
    }

    return graded === 0 ? null : Math.round(total * 100) / 100;
}

/**
 * Lleva una nota de la escala 1-20 a la escala 1-10.
 */
export function toScaleTen(score: number | null): number | null {
    return score === null ? null : Math.round((score / 2) * 100) / 100;
}

/**
 * Aporte de una evaluación a la definitiva sobre 10: la nota llevada a la
 * escala 1-10 multiplicada por el porcentaje que pesa en el plan.
 */
export function weightedContribution(
    score: number | null,
    weight: number,
): number | null {
    const scoreTen = toScaleTen(score);

    return scoreTen === null
        ? null
        : Math.round(scoreTen * (weight / 100) * 100) / 100;
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
