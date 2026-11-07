const CONNECTORS = new Set([
    'a',
    'al',
    'con',
    'de',
    'del',
    'e',
    'el',
    'en',
    'la',
    'las',
    'lo',
    'los',
    'o',
    'para',
    'por',
    'que',
    'se',
    'sin',
    'su',
    'sus',
    'u',
    'un',
    'una',
    'unas',
    'unos',
    'y',
]);

const MODALITY_SUFFIXES: Record<string, string> = {
    presencial: 'PRE',
    online: 'ONLINE',
    mixta: 'SEMI',
};

const MAX_CODE_LENGTH = 40;
const MAX_WORDS = 6;

/**
 * Tipo de unidad curricular que se marca en el código.
 */
const ELECTIVE_TYPE = 'UNCLE';

const ROMAN_NUMERALS: ReadonlyArray<readonly [number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
];

export type SubjectCodeInput = {
    name?: string | null;
    period?: string | number | null;
    modality?: string | null;
    type?: string | null;
};

/**
 * Convierte un número a su representación romana.
 */
function toRoman(value: number): string {
    if (!Number.isInteger(value) || value < 1 || value > 3999) {
        return String(value);
    }

    let remaining = value;
    let result = '';

    for (const [amount, numeral] of ROMAN_NUMERALS) {
        while (remaining >= amount) {
            result += numeral;
            remaining -= amount;
        }
    }

    return result;
}

/**
 * Quita los acentos para que el código use solo caracteres ASCII.
 */
function toAscii(value: string | null | undefined): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Genera el código de una materia a partir de su nombre, periodo, modalidad y
 * tipo de unidad curricular.
 *
 * La base usa la inicial de cada palabra significativa y las unidades de libre
 * elección agregan el sufijo UNCLE. Ejemplo: "Desarrollo Socio Afectivo y
 * Sexualidad" con periodo 2, modalidad online y tipo UNCLE produce
 * "DSAS-PA2ONLINEUNCLE".
 */
export function generateSubjectCode({
    name,
    period,
    modality,
    type,
}: SubjectCodeInput): string {
    const base = toAscii(name)
        .split(/[^A-Za-z0-9]+/)
        .filter((word) => word !== '' && !CONNECTORS.has(word.toLowerCase()))
        .slice(0, MAX_WORDS)
        .map((word) =>
            /^\d+$/.test(word)
                ? toRoman(Number.parseInt(word, 10))
                : word.charAt(0).toUpperCase(),
        )
        .join('');

    if (base === '') {
        return '';
    }

    const periodValue =
        typeof period === 'number' ? period : Number.parseInt(period ?? '', 10);
    const periodSuffix =
        Number.isInteger(periodValue) && periodValue > 0
            ? `-PA${periodValue}`
            : '';
    const modalitySuffix =
        periodSuffix !== '' ? (MODALITY_SUFFIXES[modality ?? ''] ?? '') : '';
    const typeSuffix =
        String(type ?? '')
            .trim()
            .toUpperCase() === ELECTIVE_TYPE
            ? ELECTIVE_TYPE
            : '';
    const suffix = `${periodSuffix}${modalitySuffix}${typeSuffix}`;
    const maxBaseLength = Math.max(1, MAX_CODE_LENGTH - suffix.length);

    return `${base.slice(0, maxBaseLength)}${suffix}`;
}
