<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Genera códigos de materia a partir del nombre, el periodo, la modalidad y el
 * tipo de unidad curricular.
 *
 * La base usa la inicial de cada palabra significativa y las unidades de libre
 * elección agregan el sufijo UNCLE. Ejemplo: "Desarrollo Socio Afectivo y
 * Sexualidad" con periodo 2, modalidad online y tipo UNCLE produce
 * "DSAS-PA2ONLINEUNCLE".
 */
final class SubjectCode
{
    /**
     * Tipo de unidad curricular que se marca en el código.
     */
    public const ELECTIVE_TYPE = 'UNCLE';

    /**
     * Palabras que no aportan significado al código.
     *
     * @var array<int, string>
     */
    private const CONNECTORS = [
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
    ];

    /**
     * Sufijos de modalidad usados en el código.
     *
     * @var array<string, string>
     */
    private const MODALITY_SUFFIXES = [
        'presencial' => 'PRE',
        'online' => 'ONLINE',
        'mixta' => 'SEMI',
    ];

    /**
     * Longitud máxima admitida por la validación de materias.
     */
    private const MAX_LENGTH = 40;

    /**
     * Cantidad máxima de palabras significativas que se usan.
     */
    private const MAX_WORDS = 6;

    /**
     * Genera el código de una materia.
     */
    public static function generate(
        ?string $name,
        int|string|null $period = null,
        ?string $modality = null,
        ?string $type = null,
    ): string {
        $base = self::baseFromName($name ?? '');

        if ($base === '') {
            return '';
        }

        $periodSuffix = self::periodSuffix($period);
        $modalitySuffix = $periodSuffix !== ''
            ? self::modalitySuffix($modality)
            : '';
        $typeSuffix = self::typeSuffix($type);
        $suffix = $periodSuffix.$modalitySuffix.$typeSuffix;
        $maxBaseLength = max(1, self::MAX_LENGTH - strlen($suffix));

        return substr($base, 0, $maxBaseLength).$suffix;
    }

    /**
     * Construye la parte del código que proviene del nombre.
     *
     * Toma la inicial de cada palabra significativa y convierte los números a
     * romanos: "Desarrollo Socio Afectivo y Sexualidad" produce "DSAS".
     */
    private static function baseFromName(string $name): string
    {
        $words = preg_split('/[^A-Za-z0-9]+/', Str::ascii($name)) ?: [];
        $parts = [];

        foreach ($words as $word) {
            if ($word === '' || in_array(strtolower($word), self::CONNECTORS, true)) {
                continue;
            }

            $parts[] = ctype_digit($word)
                ? self::roman((int) $word)
                : strtoupper(substr($word, 0, 1));

            if (count($parts) === self::MAX_WORDS) {
                break;
            }
        }

        return implode('', $parts);
    }

    /**
     * Sufijo del periodo, por ejemplo "-PA1".
     */
    private static function periodSuffix(int|string|null $period): string
    {
        $value = is_numeric($period) ? (int) $period : 0;

        return $value > 0 ? "-PA{$value}" : '';
    }

    /**
     * Sufijo de la modalidad, por ejemplo "PRE".
     */
    private static function modalitySuffix(?string $modality): string
    {
        return self::MODALITY_SUFFIXES[$modality ?? ''] ?? '';
    }

    /**
     * Sufijo del tipo de unidad curricular.
     *
     * Solo las unidades de libre elección se marcan, para que destaquen del
     * resto de materias del pensum.
     */
    private static function typeSuffix(?string $type): string
    {
        return strtoupper(trim($type ?? '')) === self::ELECTIVE_TYPE
            ? self::ELECTIVE_TYPE
            : '';
    }

    /**
     * Convierte un número a su representación romana.
     */
    private static function roman(int $number): string
    {
        if ($number < 1 || $number > 3999) {
            return (string) $number;
        }

        /** @var array<int, string> $numerals */
        $numerals = [
            1000 => 'M',
            900 => 'CM',
            500 => 'D',
            400 => 'CD',
            100 => 'C',
            90 => 'XC',
            50 => 'L',
            40 => 'XL',
            10 => 'X',
            9 => 'IX',
            5 => 'V',
            4 => 'IV',
            1 => 'I',
        ];

        $result = '';

        foreach ($numerals as $value => $numeral) {
            while ($number >= $value) {
                $result .= $numeral;
                $number -= $value;
            }
        }

        return $result;
    }
}
