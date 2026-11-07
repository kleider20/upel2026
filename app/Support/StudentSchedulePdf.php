<?php

namespace App\Support;

/**
 * Genera el PDF del horario de actividades presenciales del estudiante.
 *
 * Reproduce el horario oficial publicado por la Coordinación de Docencia:
 * encabezado institucional, dos cuadrículas de 16 semanas y las leyendas de
 * franjas horarias. Usa las fuentes estándar de PDF, sin dependencias externas.
 */
final class StudentSchedulePdf
{
    private const PAGE_WIDTH = 842.0;

    private const PAGE_HEIGHT = 595.32;

    private const TABLE_LEFT = 52.0;

    private const TABLE_RIGHT = 782.0;

    private const CODE_WIDTH = 72.0;

    private const NAME_WIDTH = 167.0;

    private const TEACHER_WIDTH = 103.0;

    /**
     * @var array<int, int>
     */
    private const BLACK = [0, 0, 0];

    /**
     * @var array<int, int>
     */
    private const WHITE = [255, 255, 255];

    private string $content = '';

    /**
     * @param  array<string, mixed>  $schedule
     */
    public static function make(array $schedule): string
    {
        return (new self)->build($schedule);
    }

    /**
     * @param  array<string, mixed>  $schedule
     */
    private function build(array $schedule): string
    {
        $this->drawHeader($schedule);

        /** @var array<int, array<string, mixed>> $weeks */
        $weeks = $schedule['weeks'];

        /** @var array<int, array<string, mixed>> $subjects */
        $subjects = $schedule['subjects'];

        /** @var array<int, array<string, mixed>> $distanceSubjects */
        $distanceSubjects = $schedule['distance_subjects'] ?? $subjects;

        $this->drawTable(159.0, $weeks, $subjects, true);
        $this->drawTable(335.0, $weeks, $distanceSubjects, false);

        $this->textAt(52, 499, 'Horario Presencial '.implode('   ', $schedule['time_slots']), 7, true, self::BLACK);

        if ($schedule['distance_schedule'] !== null) {
            $label = (string) $schedule['distance_schedule'].' ';
            $this->textAt(52, 516, $label, 7, false, self::BLACK);
            $this->textAt(
                52 + $this->textWidth($label, 7),
                516,
                (string) ($schedule['distance_time'] ?? ''),
                7,
                true,
                self::BLACK,
            );
        }

        return $this->assemble($this->content);
    }

    /**
     * @param  array<string, mixed>  $schedule
     */
    private function drawHeader(array $schedule): void
    {
        $center = self::PAGE_WIDTH / 2;

        $this->image('upel-logo.jpg', 238.89, 65.70, 43.47, 33.15);
        $this->image('impm-logo.jpg', 538.38, 61.77, 50.31, 35.37);

        $this->centeredAt($center, 74, 'Universidad Pedagógica Experimental Libertador', 8, false, self::BLACK);
        $this->centeredAt($center, 86, 'Instituto de Mejoramiento Profesional del Magisterio', 8, true, self::BLACK);
        $this->centeredAt($center, 97, 'Coordinación de Docencia', 8, false, self::BLACK);
        $this->centeredAt($center, 108, 'Extensión Académica La Guaira', 8, false, self::BLACK);
        $this->centeredAt($center, 121, (string) $schedule['title'], 9, true, self::BLACK);

        $this->line(52, 134, 782, 134, 1.2);
        $this->line(52, 146, 782, 146, 1.2);

        $this->textAt(53, 143, 'ESPECIALIDAD: '.$schedule['career'], 7.5, true, self::BLACK);
        $this->textAt(469, 143, 'PERÍODO: '.$schedule['period'], 7.5, true, self::BLACK);
        $this->textAt(614, 143, 'COHORTE: '.$schedule['cohort'], 7.5, true, self::BLACK);
    }

    /**
     * Dibuja una cuadrícula completa del horario.
     *
     * @param  array<int, array<string, mixed>>  $weeks
     * @param  array<int, array<string, mixed>>  $subjects
     */
    private function drawTable(float $top, array $weeks, array $subjects, bool $presencial): void
    {
        $firstWeekX = self::TABLE_LEFT + self::CODE_WIDTH + self::NAME_WIDTH + self::TEACHER_WIDTH;
        $columns = max(1, count($weeks));
        $weekWidth = (self::TABLE_RIGHT - $firstWeekX) / $columns;
        $monthRow = 15.0;
        $weekRow = 15.0;
        $dateRow = 15.5;

        // Encabezado de meses
        $x = $firstWeekX;

        foreach ($this->monthGroups($weeks) as $group) {
            $width = $group['count'] * $weekWidth;
            $this->cell($x, $top, $width, $monthRow, self::WHITE);
            $this->centeredInCell($x, $top, $width, $monthRow, $group['month'], 7, true, self::BLACK);
            $x += $width;
        }

        // Encabezado de columnas fijas
        $headerTop = $top + $monthRow;
        $headerHeight = $weekRow + $dateRow;

        $this->cell(self::TABLE_LEFT, $headerTop, self::CODE_WIDTH, $headerHeight, self::WHITE);
        $this->centeredInCell(self::TABLE_LEFT, $headerTop, self::CODE_WIDTH, $headerHeight, 'Código', 7, true, self::BLACK);

        $this->cell(self::TABLE_LEFT + self::CODE_WIDTH, $headerTop, self::NAME_WIDTH, $headerHeight, self::WHITE);
        $this->centeredInCell(
            self::TABLE_LEFT + self::CODE_WIDTH,
            $headerTop,
            self::NAME_WIDTH,
            $headerHeight,
            'Unidad / Eje Curricular',
            7,
            true,
            self::BLACK,
        );

        $teacherX = self::TABLE_LEFT + self::CODE_WIDTH + self::NAME_WIDTH;
        $this->cell($teacherX, $headerTop, self::TEACHER_WIDTH, $weekRow, self::WHITE);
        $this->centeredInCell($teacherX, $headerTop, self::TEACHER_WIDTH, $weekRow, 'Semana', 7, true, self::BLACK);
        $this->cell($teacherX, $headerTop + $weekRow, self::TEACHER_WIDTH, $dateRow, self::WHITE);
        $this->centeredInCell(
            $teacherX,
            $headerTop + $weekRow,
            self::TEACHER_WIDTH,
            $dateRow,
            'Docente / Fecha',
            7,
            true,
            self::BLACK,
        );

        // Números de semana
        $x = $firstWeekX;

        foreach ($weeks as $week) {
            $this->cell($x, $headerTop, $weekWidth, $weekRow, self::WHITE);
            $this->centeredInCell($x, $headerTop, $weekWidth, $weekRow, (string) $week['week'], 7, false, self::BLACK);
            $x += $weekWidth;
        }

        // Fechas
        $x = $firstWeekX;

        foreach ($weeks as $week) {
            $this->cell($x, $headerTop + $weekRow, $weekWidth, $dateRow, self::WHITE);
            $this->centeredInCell(
                $x,
                $headerTop + $weekRow,
                $weekWidth,
                $dateRow,
                (string) $week['day'],
                7,
                true,
                self::BLACK,
            );
            $x += $weekWidth;
        }

        // Filas de materias
        $bodyTop = $headerTop + $weekRow + $dateRow;
        $rowHeight = $presencial ? 15.2 : 15.15;

        foreach ($subjects as $index => $subject) {
            $rowTop = $bodyTop + ($index * $rowHeight);

            /** @var array<int, string|null> $hours */
            $hours = $subject['hours'];

            /** @var array<int, string|null>|null $pdfHours */
            $pdfHours = $subject['pdf_hours'] ?? null;
            $cellHours = is_array($pdfHours) && $pdfHours !== []
                ? $pdfHours
                : $hours;

            $this->cell(self::TABLE_LEFT, $rowTop, self::CODE_WIDTH, $rowHeight, self::WHITE);
            $this->centeredInCell(
                self::TABLE_LEFT,
                $rowTop,
                self::CODE_WIDTH,
                $rowHeight,
                (string) $subject['code'],
                7,
                true,
                self::BLACK,
            );

            $this->cell(self::TABLE_LEFT + self::CODE_WIDTH, $rowTop, self::NAME_WIDTH, $rowHeight, self::WHITE);
            $this->centeredInCell(
                self::TABLE_LEFT + self::CODE_WIDTH,
                $rowTop,
                self::NAME_WIDTH,
                $rowHeight,
                (string) $subject['name'],
                7,
                false,
                self::BLACK,
            );

            $this->cell($teacherX, $rowTop, self::TEACHER_WIDTH, $rowHeight, self::WHITE);
            $this->centeredInCell(
                $teacherX,
                $rowTop,
                self::TEACHER_WIDTH,
                $rowHeight,
                (string) $subject['teacher'],
                7,
                false,
                self::BLACK,
            );

            $isVirtualRow = $hours !== []
                && count(array_filter($hours, static fn (?string $hour): bool => $hour === 'Virtual')) === count($hours);

            if ($isVirtualRow) {
                $this->drawVirtualRow($firstWeekX, $rowTop, $weekWidth, $rowHeight, $columns);

                continue;
            }

            $x = $firstWeekX;

            foreach ($weeks as $weekIndex => $week) {
                $label = (string) ($cellHours[$weekIndex] ?? '');

                $this->cell($x, $rowTop, $weekWidth, $rowHeight, self::WHITE);
                $this->centeredInCell(
                    $x,
                    $rowTop,
                    $weekWidth,
                    $rowHeight,
                    $label,
                    $this->fitSize($label, $weekWidth - 2.5, 7),
                    false,
                    self::BLACK,
                );
                $x += $weekWidth;
            }
        }
    }

    /**
     * Dibuja la franja naranja de actividades virtuales.
     */
    private function drawVirtualRow(float $firstWeekX, float $top, float $weekWidth, float $height, int $columns): void
    {
        $width = $columns * $weekWidth;
        $split = $columns >= 8 ? 7 : $columns;

        $this->rect($firstWeekX, $top, $width, $height, self::WHITE);
        $this->strokeRect($firstWeekX, $top, $width, $height);

        if ($split < $columns) {
            $this->line($firstWeekX + ($split * $weekWidth), $top, $firstWeekX + ($split * $weekWidth), $top + $height, 0.5);
        }

        $this->centeredInCell($firstWeekX, $top, $split * $weekWidth, $height, 'Virtual', 7, false, self::BLACK);

        if ($split < $columns) {
            $this->centeredInCell(
                $firstWeekX + ($split * $weekWidth),
                $top,
                ($columns - $split) * $weekWidth,
                $height,
                'Virtual',
                7,
                false,
                self::BLACK,
            );
        }
    }

    /**
     * Agrupa las semanas consecutivas por mes.
     *
     * @param  array<int, array<string, mixed>>  $weeks
     * @return array<int, array{month: string, tone: string, count: int}>
     */
    private function monthGroups(array $weeks): array
    {
        $groups = [];

        foreach ($weeks as $week) {
            $last = array_key_last($groups);

            if ($last !== null && $groups[$last]['month'] === $week['month']) {
                $groups[$last]['count']++;

                continue;
            }

            $groups[] = [
                'month' => (string) $week['month'],
                'tone' => (string) $week['tone'],
                'count' => 1,
            ];
        }

        return $groups;
    }

    /**
     * @param  array{int, int, int}  $color
     */
    private function textAt(
        float $x,
        float $top,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::BLACK,
    ): void {
        $this->content .= sprintf(
            "BT /%s %.2F Tf %.3F %.3F %.3F rg 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
            $bold ? 'F2' : 'F1',
            $size,
            $color[0] / 255,
            $color[1] / 255,
            $color[2] / 255,
            $x,
            self::PAGE_HEIGHT - $top,
            $this->escape($text),
        );
    }

    /**
     * @param  array{int, int, int}  $color
     */
    private function centeredAt(
        float $centerX,
        float $top,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::BLACK,
    ): void {
        $this->textAt($centerX - ($this->textWidth($text, $size, $bold) / 2), $top, $text, $size, $bold, $color);
    }

    /**
     * @param  array{int, int, int}  $color
     */
    private function centeredInCell(
        float $x,
        float $top,
        float $width,
        float $height,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::BLACK,
    ): void {
        if ($text === '') {
            return;
        }

        $centerX = $x + ($width / 2);
        $baseline = $top + ($height / 2) + ($size * 0.35);

        $this->centeredAt($centerX, $baseline, $text, $size, $bold, $color);
    }

    /**
     * Dibuja una celda con relleno y borde.
     *
     * @param  array<int, int>  $fill
     */
    private function cell(float $x, float $top, float $width, float $height, array $fill): void
    {
        $this->rect($x, $top, $width, $height, $fill);
        $this->strokeRect($x, $top, $width, $height);
    }

    /**
     * @param  array<int, int>  $fill
     */
    private function rect(float $x, float $top, float $width, float $height, array $fill): void
    {
        $this->content .= sprintf(
            "%.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f\n",
            $fill[0] / 255,
            $fill[1] / 255,
            $fill[2] / 255,
            $x,
            self::PAGE_HEIGHT - $top - $height,
            $width,
            $height,
        );
    }

    private function strokeRect(float $x, float $top, float $width, float $height): void
    {
        $this->content .= sprintf(
            "0 0 0 RG 0.5 w %.2F %.2F %.2F %.2F re S\n",
            $x,
            self::PAGE_HEIGHT - $top - $height,
            $width,
            $height,
        );
    }

    private function line(float $x1, float $y1, float $x2, float $y2, float $width): void
    {
        $this->content .= sprintf(
            "0 0 0 RG %.2F w %.2F %.2F m %.2F %.2F l S\n",
            $width,
            $x1,
            self::PAGE_HEIGHT - $y1,
            $x2,
            self::PAGE_HEIGHT - $y2,
        );
    }

    private function image(string $file, float $x, float $top, float $width, float $height): void
    {
        $path = public_path('images/schedule/'.$file);

        if (! is_file($path)) {
            return;
        }

        $name = $file === 'upel-logo.jpg' ? 'Im1' : 'Im2';

        $this->content .= sprintf(
            "q %.2F 0 0 %.2F %.2F %.2F cm /%s Do Q\n",
            $width,
            $height,
            $x,
            self::PAGE_HEIGHT - $top - $height,
            $name,
        );
    }

    /**
     * Ajusta el tamaño de la fuente para que el texto quepa en la celda.
     */
    private function fitSize(string $text, float $width, float $maxSize): float
    {
        if ($text === '' || $width <= 0) {
            return $maxSize;
        }

        $textWidth = $this->textWidth($text, $maxSize);

        if ($textWidth <= $width) {
            return $maxSize;
        }

        return max(4.2, $maxSize * ($width / $textWidth));
    }

    private function textWidth(string $text, float $size, bool $bold = false): float
    {
        $units = 0;

        foreach (mb_str_split($text) as $character) {
            $units += $this->characterWidth($character);
        }

        return ($units / 1000) * $size * ($bold ? 1.02 : 1.0);
    }

    /**
     * Ancho aproximado de un carácter en Helvetica (unidades de 1/1000 em).
     */
    private function characterWidth(string $character): int
    {
        $widths = [
            ' ' => 278, '!' => 278, '"' => 355, '#' => 556, '$' => 556, '%' => 889, '&' => 667,
            "'" => 191, '(' => 333, ')' => 333, '*' => 389, '+' => 584, ',' => 278, '-' => 333,
            '.' => 278, '/' => 278, ':' => 278, ';' => 278, '<' => 584, '=' => 584, '>' => 584,
            '?' => 556, '@' => 1015, '[' => 278, '\\' => 278, ']' => 278, '^' => 469, '_' => 556,
            '`' => 333, '{' => 334, '|' => 260, '}' => 334, '~' => 584, '·' => 278, '–' => 556,
            '—' => 1000, '°' => 400, 'Á' => 667, 'É' => 667, 'Í' => 278, 'Ó' => 778, 'Ú' => 722,
            'Ñ' => 722, 'á' => 556, 'é' => 556, 'í' => 222, 'ó' => 556, 'ú' => 556, 'ñ' => 556,
            'ü' => 556, 'Ü' => 722,
        ];

        if (isset($widths[$character])) {
            return $widths[$character];
        }

        if (preg_match('/^[A-Z]$/', $character) === 1) {
            return 667;
        }

        if (preg_match('/^[a-z]$/', $character) === 1) {
            return 500;
        }

        if (preg_match('/^[0-9]$/', $character) === 1) {
            return 556;
        }

        return 500;
    }

    private function escape(string $text): string
    {
        $encoded = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);

        if ($encoded === false) {
            $encoded = preg_replace('/[^\x20-\x7E]/', '', $text) ?? $text;
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
    }

    private function assemble(string $stream): string
    {
        $stream = rtrim($stream, "\n")."\n";

        $images = $this->imageObjects();

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595.32] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R /Im2 8 0 R >> >> /Contents 4 0 R >>',
            4 => '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream',
            5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            6 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            7 => $images['Im1'],
            8 => $images['Im2'],
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $number => $body) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$body."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 9\n0000000000 65535 f \n";

        for ($number = 1; $number <= 8; $number++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$number]);
        }

        $pdf .= "trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }

    /**
     * @return array{Im1: string, Im2: string}
     */
    private function imageObjects(): array
    {
        return [
            'Im1' => $this->jpegObject(public_path('images/schedule/upel-logo.jpg')),
            'Im2' => $this->jpegObject(public_path('images/schedule/impm-logo.jpg')),
        ];
    }

    private function jpegObject(string $path): string
    {
        if (! is_file($path)) {
            return 'null';
        }

        $data = (string) file_get_contents($path);
        [$width, $height] = $this->jpegSize($data);

        return sprintf(
            '<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>'."\nstream\n%s\nendstream",
            $width,
            $height,
            strlen($data),
            $data,
        );
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function jpegSize(string $data): array
    {
        $length = strlen($data);
        $offset = 2;

        while ($offset + 9 < $length) {
            if (ord($data[$offset]) !== 0xFF) {
                $offset++;

                continue;
            }

            $marker = ord($data[$offset + 1]);

            if ($marker >= 0xC0 && $marker <= 0xC3) {
                $height = (ord($data[$offset + 5]) << 8) | ord($data[$offset + 6]);
                $width = (ord($data[$offset + 7]) << 8) | ord($data[$offset + 8]);

                return [$width, $height];
            }

            $segmentLength = (ord($data[$offset + 2]) << 8) | ord($data[$offset + 3]);
            $offset += 2 + $segmentLength;
        }

        return [1, 1];
    }
}
