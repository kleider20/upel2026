<?php

namespace App\Support;

/**
 * Genera el plan curricular con el formato oficial de la UPEL.
 *
 * La planilla replica la estructura del documento institucional: cabecera con
 * el logotipo, título del plan y una única tabla con los períodos agrupados y
 * los niveles (FUND, INTEG, PROF) escritos en vertical.
 */
final class PensumPdf
{
    private const PAGE_WIDTH = 612.0;

    private const PAGE_HEIGHT = 792.0;

    private const TABLE_LEFT = 154.94;

    private const TABLE_TOP = 110.18;

    private const HEADER_HEIGHT = 21.12;

    private const SUBHEADER_TOP = 123.38;

    private const CONTENT_BOTTOM = 728.0;

    private const BODY_FONT = 5.2;

    private const LINE_HEIGHT = 6.4;

    private const MIN_ROW_HEIGHT = 11.2;

    /**
     * @var array<int, float>
     */
    private const COLUMN_WIDTHS = [
        9.24,   // PA
        19.8,   // CA/PA
        36.0,   // CÓD
        146.33, // NOMBRES
        19.08,  // COMP
        21.36,  // TIPO
        18.12,  // AREA
        18.72,  // NIVEL
        11.04,  // CA
        14.07,  // HAD
        13.08,  // HLE
        17.04,  // PREL
        28.8,   // RE (AE / SC)
    ];

    /**
     * @var array<int, string>
     */
    private const HEADERS = [
        'PA',
        'CA/PA',
        'CÓD',
        'NOMBRES',
        'COMP',
        'TIPO',
        'AREA',
        'NIVEL',
        'CA',
        'HAD',
        'HLE',
        'PREL',
        'RE',
    ];

    /**
     * @var array<int, array{0: int, 1: int, 2: int}>
     */
    private const BLACK = [0, 0, 0];

    /**
     * @var array<int, array{0: int, 1: int, 2: int}>
     */
    private const WHITE = [255, 255, 255];

    private string $content = '';

    /**
     * @var array<int, string>
     */
    private array $pages = [];

    private float $cursorY = 0.0;

    /**
     * @param  array{name: string, degree?: string, code?: string}  $career
     * @param  array<int, array{label: string, credits: int, subjects: array<int, array<string, mixed>>}>  $pensum
     */
    public static function make(array $career, array $pensum): string
    {
        return (new self)->build($career, $pensum);
    }

    /**
     * @param  array{name: string, degree?: string, code?: string}  $career
     * @param  array<int, array{label: string, credits: int, subjects: array<int, array<string, mixed>>}>  $pensum
     */
    private function build(array $career, array $pensum): string
    {
        $this->startPage($career);

        $totalCredits = 0;

        foreach ($pensum as $period) {
            $rows = $this->periodRows($period);
            $periodHeight = array_sum(array_column($rows, 'height'));

            if (
                $this->cursorY > self::TABLE_TOP + self::HEADER_HEIGHT
                && $this->cursorY + $periodHeight > self::CONTENT_BOTTOM
            ) {
                $this->startPage($career);
            }

            $this->drawPeriod($period, $rows, $periodHeight);

            $totalCredits += (int) $period['credits'];
        }

        $this->drawTotals($totalCredits);
        $this->pages[] = $this->content;

        return $this->assemble();
    }

    /**
     * @param  array{name: string, degree?: string, code?: string}  $career
     */
    private function startPage(array $career): void
    {
        if ($this->content !== '') {
            $this->pages[] = $this->content;
        }

        $this->content = '';
        $this->drawHeader($career);
        $this->drawTableHeader();
        $this->cursorY = self::TABLE_TOP + self::HEADER_HEIGHT;
    }

    /**
     * @param  array{name: string, degree?: string, code?: string}  $career
     */
    private function drawHeader(array $career): void
    {
        $logoPath = public_path('images/schedule/upel-logo.jpg');

        if (is_file($logoPath)) {
            $this->content .= sprintf(
                "q 36 0 0 31 103 %.2F cm /Im1 Do Q\n",
                self::PAGE_HEIGHT - 20 - 31,
            );
        }

        $center = self::PAGE_WIDTH / 2;
        $this->centeredAt($center, 43.8, 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR', 9, true);
        $this->centeredAt($center, 54.12, 'VICERRECTORADO DE DOCENCIA', 9, false);
        $this->centeredAt($center, 64.2, 'UNIDAD DE CURRÍCULO', 9, false);

        $title = 'PLAN CURRICULAR DE '.mb_strtoupper($career['name']);
        $titleSize = 12.0;

        while (mb_strlen($title) * $titleSize * 0.62 > 520 && $titleSize > 7.5) {
            $titleSize -= 0.5;
        }

        $this->centeredAt($center, 92.54, $title, $titleSize, true);
    }

    private function drawTableHeader(): void
    {
        $x = self::TABLE_LEFT;
        $bottom = self::TABLE_TOP + self::HEADER_HEIGHT;

        foreach (self::COLUMN_WIDTHS as $index => $width) {
            $this->cell($x, self::TABLE_TOP, $width, self::HEADER_HEIGHT, self::WHITE);

            if ($index === 12) {
                $this->line($x, self::SUBHEADER_TOP, $x + $width, self::SUBHEADER_TOP, 0.5);
                $this->line($x + 9.6, self::SUBHEADER_TOP, $x + 9.6, $bottom, 0.5);
                $this->centeredInCell($x, self::TABLE_TOP, $width, self::SUBHEADER_TOP - self::TABLE_TOP, self::HEADERS[$index], 5.6, true);
                $this->centeredInCell($x, self::SUBHEADER_TOP, 9.6, $bottom - self::SUBHEADER_TOP, 'AE', 5.2, true);
                $this->centeredInCell($x + 9.6, self::SUBHEADER_TOP, $width - 9.6, $bottom - self::SUBHEADER_TOP, 'SC', 5.2, true);
            } else {
                $this->centeredInCell($x, self::TABLE_TOP, $width, self::HEADER_HEIGHT, self::HEADERS[$index], 5.6, true);
            }

            $x += $width;
        }
    }

    /**
     * @param  array{label: string, credits: int, subjects: array<int, array<string, mixed>>}  $period
     * @return array<int, array{subject: array<string, mixed>, lines: array<int, string>, height: float}>
     */
    private function periodRows(array $period): array
    {
        return array_map(function (array $subject): array {
            $nameLines = $this->wrapText(
                (string) ($subject['name'] ?? ''),
                self::COLUMN_WIDTHS[3] - 4,
                self::BODY_FONT,
            );

            $lineCount = max(count($nameLines), 1);

            return [
                'subject' => $subject,
                'lines' => $nameLines,
                'height' => max(self::MIN_ROW_HEIGHT, ($lineCount * self::LINE_HEIGHT) + 2.6),
            ];
        }, $period['subjects']);
    }

    /**
     * @param  array{label: string, credits: int, subjects: array<int, array<string, mixed>>}  $period
     * @param  array<int, array{subject: array<string, mixed>, lines: array<int, string>, height: float}>  $rows
     */
    private function drawPeriod(array $period, array $rows, float $periodHeight): void
    {
        $top = $this->cursorY;

        foreach ($rows as $row) {
            $this->drawRow($row, $top);
            $top += $row['height'];
        }

        $this->cursorY += $periodHeight;

        $this->mergedCell(self::TABLE_LEFT, $this->cursorY - $periodHeight, self::COLUMN_WIDTHS[0], $periodHeight, (string) $period['label'], 6, true);
        $this->mergedCell(self::TABLE_LEFT + self::COLUMN_WIDTHS[0], $this->cursorY - $periodHeight, self::COLUMN_WIDTHS[1], $periodHeight, (string) $period['credits'], 6, true);

        $level = trim((string) ($period['subjects'][0]['level'] ?? ''));

        if ($level !== '') {
            $this->levelCell(
                self::TABLE_LEFT + array_sum(array_slice(self::COLUMN_WIDTHS, 0, 7)),
                $this->cursorY - $periodHeight,
                self::COLUMN_WIDTHS[7],
                $periodHeight,
                $level,
            );
        }
    }

    /**
     * @param  array{subject: array<string, mixed>, lines: array<int, string>, height: float}  $row
     */
    private function drawRow(array $row, float $top): void
    {
        $subject = $row['subject'];
        $height = $row['height'];
        $x = self::TABLE_LEFT;

        $values = [
            '',
            '',
            (string) ($subject['code'] ?? ''),
            '',
            (string) ($subject['component'] ?? ''),
            (string) ($subject['type'] ?? ''),
            '',
            '',
            (string) ($subject['credits'] ?? ''),
            (string) ($subject['theory_hours'] ?? ''),
            (string) ($subject['practice_hours'] ?? ''),
            '',
            '',
        ];

        foreach (self::COLUMN_WIDTHS as $index => $width) {
            $this->cell($x, $top, $width, $height, self::WHITE);

            $text = $values[$index];

            if ($text !== '') {
                $this->cellText(
                    $x,
                    $top,
                    $width,
                    $height,
                    $text,
                    $index === 2 ? 4.2 : self::BODY_FONT,
                    $index === 3,
                );
            }

            $x += $width;
        }

        $lines = $row['lines'];

        if ($lines !== [] && trim($lines[0]) !== '') {
            $startY = $top + (($height - count($lines) * self::LINE_HEIGHT) / 2) + self::BODY_FONT;

            foreach ($lines as $lineIndex => $line) {
                $this->textAt(self::TABLE_LEFT + array_sum(array_slice(self::COLUMN_WIDTHS, 0, 3)) + 2, $startY + ($lineIndex * self::LINE_HEIGHT), $line, self::BODY_FONT);
            }
        }
    }

    private function mergedCell(float $x, float $top, float $width, float $height, string $text, float $size, bool $bold): void
    {
        $this->cell($x, $top, $width, $height, self::WHITE);
        $this->centeredInCell($x, $top, $width, $height, $text, $size, $bold);
    }

    private function levelCell(float $x, float $top, float $width, float $height, string $level): void
    {
        $this->cell($x, $top, $width, $height, self::WHITE);

        $characters = mb_str_split($level);

        if (count($characters) * 6.2 > $height) {
            $this->centeredInCell($x, $top, $width, $height, $level, 4.8, true);

            return;
        }

        $step = $height / (count($characters) + 1);
        $center = $x + ($width / 2);

        foreach ($characters as $index => $character) {
            $this->centeredAt($center, $top + ($step * ($index + 1)) + 2.4, $character, 5.6, true);
        }
    }

    private function cellText(float $x, float $top, float $width, float $height, string $text, float $size, bool $leftAligned): void
    {
        $available = $width - 2.4;
        $textWidth = $this->textWidth($text, $size);

        if ($textWidth > $available) {
            $size = max(3.0, $size * ($available / $textWidth));
        }

        if ($leftAligned) {
            $this->textAt($x + 2, $top + ($height / 2) + ($size * 0.35), $text, $size);
        } else {
            $this->centeredInCell($x, $top, $width, $height, $text, $size);
        }
    }

    private function drawTotals(int $credits): void
    {
        $height = 13.0;
        $top = $this->cursorY;
        $x = self::TABLE_LEFT;

        foreach (self::COLUMN_WIDTHS as $width) {
            $this->cell($x, $top, $width, $height, self::WHITE);
            $x += $width;
        }

        $this->centeredInCell(
            self::TABLE_LEFT + array_sum(array_slice(self::COLUMN_WIDTHS, 0, 8)),
            $top,
            self::COLUMN_WIDTHS[8],
            $height,
            (string) $credits,
            5.6,
            true,
        );

        $noteTop = $top + $height + 10;
        $this->textAt(
            self::TABLE_LEFT - 55,
            $noteTop,
            'Nota: Las Unidades Curriculares de Libre Elección (UNCLE) serán variables según el período académico.',
            6,
            false,
        );
    }

    /**
     * @return array<int, string>
     */
    private function wrapText(string $text, float $maxWidth, float $fontSize): array
    {
        $words = preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($words === []) {
            return [''];
        }

        $lines = [];
        $line = '';

        foreach ($words as $word) {
            $parts = $this->splitWord($word, $maxWidth, $fontSize);

            foreach ($parts as $partIndex => $part) {
                $candidate = $line === '' ? $part : $line.' '.$part;

                if ($line !== '' && $this->textWidth($candidate, $fontSize) > $maxWidth) {
                    $lines[] = $line;
                    $line = $part;
                } else {
                    $line = $candidate;
                }

                if ($partIndex < count($parts) - 1) {
                    $lines[] = $line;
                    $line = '';
                }
            }
        }

        if ($line !== '') {
            $lines[] = $line;
        }

        return $lines === [] ? [''] : $lines;
    }

    /**
     * @return array<int, string>
     */
    private function splitWord(string $word, float $maxWidth, float $fontSize): array
    {
        if ($this->textWidth($word, $fontSize) <= $maxWidth) {
            return [$word];
        }

        $parts = [];
        $part = '';

        foreach (mb_str_split($word) as $character) {
            if ($part !== '' && $this->textWidth($part.$character, $fontSize) > $maxWidth) {
                $parts[] = $part;
                $part = '';
            }

            $part .= $character;
        }

        if ($part !== '') {
            $parts[] = $part;
        }

        return $parts;
    }

    /**
     * @param  array{0: int, 1: int, 2: int}  $color
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
     * @param  array{0: int, 1: int, 2: int}  $color
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
     * @param  array{0: int, 1: int, 2: int}  $color
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
        $this->centeredAt($x + ($width / 2), $top + ($height / 2) + ($size * 0.35), $text, $size, $bold, $color);
    }

    /**
     * @param  array{0: int, 1: int, 2: int}  $fill
     */
    private function cell(float $x, float $top, float $width, float $height, array $fill): void
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
        $this->strokeRect($x, $top, $width, $height);
    }

    private function strokeRect(float $x, float $top, float $width, float $height): void
    {
        $this->content .= sprintf(
            "0 0 0 RG 0.35 w %.2F %.2F %.2F %.2F re S\n",
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

    private function textWidth(string $text, float $size, bool $bold = false): float
    {
        return mb_strlen($text) * $size * ($bold ? 0.54 : 0.52);
    }

    private function escape(string $text): string
    {
        $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);

        if ($encoded === false) {
            $encoded = preg_replace('/[^\x20-\x7E]/', '', $text) ?? $text;
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $encoded);
    }

    private function assemble(): string
    {
        $pageCount = count($this->pages);
        $fontRegular = 3 + ($pageCount * 2);
        $fontBold = $fontRegular + 1;
        $logoPath = public_path('images/schedule/upel-logo.jpg');
        $logoData = is_file($logoPath) ? file_get_contents($logoPath) : false;
        $logoSize = $logoData !== false ? getimagesize($logoPath) : false;
        $logoObject = $logoData !== false && $logoSize !== false ? $fontBold + 1 : null;
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids ['.implode(' ', array_map(
                static fn (int $index): string => (3 + ($index * 2)).' 0 R',
                range(0, $pageCount - 1),
            )).'] /Count '.$pageCount.' >>',
        ];

        foreach ($this->pages as $index => $stream) {
            $pageObject = 3 + ($index * 2);
            $contentObject = $pageObject + 1;
            $resources = '<< /Font << /F1 '.$fontRegular.' 0 R /F2 '.$fontBold.' 0 R >>';

            if ($logoObject !== null) {
                $resources .= ' /XObject << /Im1 '.$logoObject.' 0 R >>';
            }

            $resources .= ' >>';
            $objects[$pageObject] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.self::PAGE_WIDTH.' '.self::PAGE_HEIGHT.'] /Resources '.$resources.' /Contents '.$contentObject.' 0 R >>';
            $objects[$contentObject] = '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream';
        }

        $objects[$fontRegular] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontBold] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        if ($logoObject !== null && $logoData !== false && $logoSize !== false) {
            $objects[$logoObject] = sprintf(
                '<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>'."\nstream\n%s\nendstream",
                $logoSize[0],
                $logoSize[1],
                strlen($logoData),
                $logoData,
            );
        }

        ksort($objects);
        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $number => $body) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$body."\nendobj\n";
        }

        $xref = strlen($pdf);
        $objectCount = max(array_keys($objects));
        $pdf .= "xref\n0 ".($objectCount + 1)."\n0000000000 65535 f \n";

        for ($number = 1; $number <= $objectCount; $number++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$number]);
        }

        $pdf .= "trailer\n<< /Size ".($objectCount + 1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }
}
