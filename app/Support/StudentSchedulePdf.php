<?php

namespace App\Support;

/**
 * Genera el PDF del horario de actividades presenciales del estudiante.
 *
 * Es un generador mínimo basado en las fuentes estándar de PDF (Helvetica),
 * suficiente para tablas institucionales y sin dependencias externas.
 */
final class StudentSchedulePdf
{
    private const PAGE_WIDTH = 842.0;

    private const PAGE_HEIGHT = 595.0;

    private const MARGIN = 28.0;

    /**
     * @var array<int, int>
     */
    private const NAVY = [10, 37, 64];

    /**
     * @var array<int, int>
     */
    private const GRAY = [100, 116, 139];

    /**
     * @var array<int, int>
     */
    private const BORDER = [203, 213, 225];

    /**
     * @var array<int, int>
     */
    private const HEADER_BACKGROUND = [241, 245, 249];

    /**
     * @var array<int, int>
     */
    private const VIRTUAL_BACKGROUND = [253, 243, 208];

    /**
     * @var array<int, int>
     */
    private const GOLD_TEXT = [138, 108, 13];

    private string $content = '';

    /**
     * @param  array<string, mixed>  $schedule
     */
    public static function make(array $schedule): string
    {
        return (new self())->build($schedule);
    }

    /**
     * @param  array<string, mixed>  $schedule
     */
    private function build(array $schedule): string
    {
        $left = self::MARGIN;
        $right = self::PAGE_WIDTH - self::MARGIN;
        $center = self::PAGE_WIDTH / 2;

        $this->centeredAt($center, 36, 'Universidad Pedagógica Experimental Libertador', 8.5, true);
        $this->centeredAt($center, 48, 'Instituto de Mejoramiento Profesional del Magisterio · Coordinación de Docencia', 7, false, self::GRAY);
        $this->centeredAt($center, 63, (string) $schedule['title'], 9.5, true);
        $this->centeredAt(
            $center,
            75,
            sprintf(
                'ESPECIALIDAD: %s    PERÍODO: %s    COHORTE: %s    HORARIO: %s',
                $schedule['career'],
                $schedule['period'],
                $schedule['cohort'],
                $schedule['schedule_label'],
            ),
            7.2,
            true,
        );

        $columns = [
            'code' => 46.0,
            'name' => 150.0,
            'teacher' => 78.0,
        ];

        /** @var array<int, array<string, mixed>> $weeks */
        $weeks = $schedule['weeks'];
        $weekWidth = ($right - $left - array_sum($columns)) / count($weeks);

        $top = 88.0;
        $monthRowHeight = 16.0;
        $weekRowHeight = 28.0;
        $bodyRowHeight = 30.0;

        // Fila de meses
        $x = $left;
        $this->cell($x, $top, $columns['code'] + $columns['name'] + $columns['teacher'], $monthRowHeight, self::HEADER_BACKGROUND);
        $this->centeredInCell(
            $x,
            $top,
            $columns['code'] + $columns['name'] + $columns['teacher'],
            $monthRowHeight,
            'Mes',
            6.5,
            true,
            self::GRAY,
        );
        $x += $columns['code'] + $columns['name'] + $columns['teacher'];

        foreach ($this->monthGroups($weeks) as $group) {
            $width = $group['count'] * $weekWidth;
            $this->cell($x, $top, $width, $monthRowHeight, self::HEADER_BACKGROUND);
            $this->centeredInCell($x, $top, $width, $monthRowHeight, $group['month'], 6.5, true, self::NAVY);
            $x += $width;
        }

        // Fila de semanas y fechas
        $top += $monthRowHeight;
        $x = $left;
        $this->cell($x, $top, $columns['code'], $weekRowHeight, self::HEADER_BACKGROUND);
        $this->centeredInCell($x, $top, $columns['code'], $weekRowHeight, 'Código', 6.5, true, self::NAVY);
        $x += $columns['code'];

        $this->cell($x, $top, $columns['name'], $weekRowHeight, self::HEADER_BACKGROUND);
        $this->centeredInCell($x, $top, $columns['name'], $weekRowHeight, 'Unidad / Eje Curricular', 6.5, true, self::NAVY);
        $x += $columns['name'];

        $this->cell($x, $top, $columns['teacher'], $weekRowHeight, self::HEADER_BACKGROUND);
        $this->centeredInCell($x, $top, $columns['teacher'], $weekRowHeight, 'Docente', 6.5, true, self::NAVY);
        $x += $columns['teacher'];

        foreach ($weeks as $week) {
            $this->cell($x, $top, $weekWidth, $weekRowHeight, self::HEADER_BACKGROUND);
            $this->centeredAt($x + ($weekWidth / 2), $top + 11, 'SEM '.$week['week'], 5.2, false, self::GRAY);
            $this->centeredAt(
                $x + ($weekWidth / 2),
                $top + 22,
                $this->shortWeekday((string) $week['weekday']).' '.$week['date'],
                5.8,
                true,
                self::NAVY,
            );
            $x += $weekWidth;
        }

        // Filas de materias
        $top += $weekRowHeight;

        /** @var array<int, array<string, mixed>> $subjects */
        $subjects = $schedule['subjects'];

        foreach ($subjects as $subject) {
            $x = $left;

            $this->cell($x, $top, $columns['code'], $bodyRowHeight, [255, 255, 255]);
            $this->centeredInCell($x, $top, $columns['code'], $bodyRowHeight, (string) $subject['code'], 6.2, true, self::NAVY);
            $x += $columns['code'];

            $this->cell($x, $top, $columns['name'], $bodyRowHeight, [255, 255, 255]);
            $this->centeredInCell($x, $top, $columns['name'], $bodyRowHeight, (string) $subject['name'], 6.2, false, self::NAVY);
            $x += $columns['name'];

            $this->cell($x, $top, $columns['teacher'], $bodyRowHeight, [255, 255, 255]);
            $this->centeredInCell($x, $top, $columns['teacher'], $bodyRowHeight, (string) $subject['teacher'], 6.0, false, self::GRAY);
            $x += $columns['teacher'];

            /** @var array<int, string|null> $hours */
            $hours = $subject['hours'];

            foreach ($hours as $hour) {
                $isVirtual = $hour === 'Virtual';

                $this->cell(
                    $x,
                    $top,
                    $weekWidth,
                    $bodyRowHeight,
                    $isVirtual ? self::VIRTUAL_BACKGROUND : [255, 255, 255],
                );
                $this->centeredInCell(
                    $x,
                    $top,
                    $weekWidth,
                    $bodyRowHeight,
                    $hour ?? '-',
                    6.2,
                    $isVirtual,
                    $isVirtual ? self::GOLD_TEXT : self::NAVY,
                );
                $x += $weekWidth;
            }

            $top += $bodyRowHeight;
        }

        // Leyendas
        $top += 18;
        $this->textAt($left, $top, 'Horario presencial: '.implode(' · ', $schedule['time_slots']), 6.8, false, self::GRAY);
        $top += 11;

        if ($schedule['distance_schedule'] !== null) {
            $this->textAt($left, $top, (string) $schedule['distance_schedule'], 6.8, false, self::GRAY);
            $top += 11;
        }

        $this->textAt(
            $left,
            $top,
            'Sábados: actividades presenciales · Miércoles: actividades a distancia entre semana.',
            6.8,
            false,
            self::GRAY,
        );

        return $this->assemble($this->content);
    }

    /**
     * Agrupa las semanas consecutivas por mes.
     *
     * @param  array<int, array<string, mixed>>  $weeks
     * @return array<int, array{month: string, count: int}>
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

            $groups[] = ['month' => (string) $week['month'], 'count' => 1];
        }

        return $groups;
    }

    private function shortWeekday(string $weekday): string
    {
        return match ($weekday) {
            'Miércoles' => 'Mié',
            'Sábado' => 'Sáb',
            default => mb_substr($weekday, 0, 3),
        };
    }

    private function textAt(
        float $x,
        float $top,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::NAVY,
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

    private function centeredAt(
        float $centerX,
        float $top,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::NAVY,
    ): void {
        $this->textAt($centerX - ($this->textWidth($text, $size, $bold) / 2), $top, $text, $size, $bold, $color);
    }

    private function centeredInCell(
        float $x,
        float $top,
        float $width,
        float $height,
        string $text,
        float $size,
        bool $bold = false,
        array $color = self::NAVY,
    ): void {
        $centerX = $x + ($width / 2);
        $baseline = $top + ($height / 2) + ($size * 0.35);

        $this->centeredAt($centerX, $baseline, $text, $size, $bold, $color);
    }

    private function cell(float $x, float $top, float $width, float $height, array $fill): void
    {
        $y = self::PAGE_HEIGHT - $top - $height;

        $this->content .= sprintf(
            "%.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f\n",
            $fill[0] / 255,
            $fill[1] / 255,
            $fill[2] / 255,
            $x,
            $y,
            $width,
            $height,
        );

        $this->content .= sprintf(
            "%.3F %.3F %.3F RG 0.5 w %.2F %.2F %.2F %.2F re S\n",
            self::BORDER[0] / 255,
            self::BORDER[1] / 255,
            self::BORDER[2] / 255,
            $x,
            $y,
            $width,
            $height,
        );
    }

    private function textWidth(string $text, float $size, bool $bold = false): float
    {
        return mb_strlen($text) * $size * ($bold ? 0.56 : 0.5);
    }

    private function escape(string $text): string
    {
        $encoded = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);

        if ($encoded === false) {
            $encoded = $text;
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
    }

    private function assemble(string $stream): string
    {
        $stream = rtrim($stream, "\n")."\n";

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
            4 => '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream',
            5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            6 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $number => $body) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$body."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 7\n0000000000 65535 f \n";

        for ($number = 1; $number <= 6; $number++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$number]);
        }

        $pdf .= "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }
}
