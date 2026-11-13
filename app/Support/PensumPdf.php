<?php

namespace App\Support;

final class PensumPdf
{
    private const PAGE_WIDTH = 595.28;

    private const PAGE_HEIGHT = 841.89;

    private const TABLE_LEFT = 26.0;

    private const TABLE_WIDTH = 543.28;

    private const TABLE_TOP = 103.0;

    private const TABLE_HEADER_HEIGHT = 22.0;

    private const PAGE_CONTENT_BOTTOM = 807.0;

    /**
     * @var array<int, float>
     */
    private const COLUMN_WIDTHS = [23.0, 30.0, 181.0, 36.0, 31.0, 33.0, 25.0, 26.0, 27.0, 27.0, 59.0, 45.28];

    /**
     * @var array<int, array{0: int, 1: int, 2: int}>
     */
    private const BLACK = [0, 0, 0];

    /**
     * @var array<int, array{0: int, 1: int, 2: int}>
     */
    private const WHITE = [255, 255, 255];

    /**
     * @var array<int, array{0: int, 1: int, 2: int}>
     */
    private const HEADER_FILL = [232, 236, 240];

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

        foreach ($pensum as $period) {
            foreach ($period['subjects'] as $index => $subject) {
                $row = $this->subjectRow($period, $subject, $index === 0);
                $rowHeight = $this->rowHeight($row);

                if ($this->cursorY + $rowHeight > self::PAGE_CONTENT_BOTTOM) {
                    $this->startPage($career);
                    $row = $this->subjectRow($period, $subject, true);
                    $rowHeight = $this->rowHeight($row);
                }

                $this->drawRow($row, $rowHeight);
                $this->cursorY += $rowHeight;
            }
        }

        $this->drawFooter($career, $pensum);
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
        $this->cursorY = self::TABLE_TOP + self::TABLE_HEADER_HEIGHT;
    }

    /**
     * @param  array{name: string, degree?: string, code?: string}  $career
     */
    private function drawHeader(array $career): void
    {
        $logoPath = public_path('images/schedule/upel-logo.jpg');

        if (is_file($logoPath)) {
            $this->content .= sprintf(
                "q 42 0 0 34 %.2F %.2F cm /Im1 Do Q\n",
                34.0,
                self::PAGE_HEIGHT - 20 - 34,
            );
        }

        $center = self::PAGE_WIDTH / 2;
        $this->centeredAt($center, 31, 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR', 8, true);
        $this->centeredAt($center, 42, 'VICERRECTORADO DE DOCENCIA', 7, false);
        $this->centeredAt($center, 52, 'UNIDAD DE CURRÍCULO', 7, false);
        $this->centeredAt($center, 75, 'PLAN CURRICULAR DE '.mb_strtoupper($career['name']), 10, true);

        $subtitle = trim(($career['degree'] ?? '').' · '.($career['code'] ?? ''));

        if ($subtitle !== '') {
            $this->centeredAt($center, 88, $subtitle, 7, false);
        }

        $this->line(self::TABLE_LEFT, 94, self::TABLE_LEFT + self::TABLE_WIDTH, 94, 0.8);
    }

    private function drawTableHeader(): void
    {
        $headers = ['PA', 'CA/PA', 'NOMBRES', 'COMP', 'TIPO', 'ÁREA', 'NIVEL', 'CA', 'HAD', 'HLE', 'PREL', 'RE'];
        $x = self::TABLE_LEFT;

        foreach ($headers as $index => $header) {
            $width = self::COLUMN_WIDTHS[$index];
            $this->cell($x, self::TABLE_TOP, $width, self::TABLE_HEADER_HEIGHT, self::HEADER_FILL);
            $this->centeredInCell($x, self::TABLE_TOP, $width, self::TABLE_HEADER_HEIGHT, $header, 5.2, true);
            $x += $width;
        }
    }

    /**
     * @param  array{label: string, credits: int, subjects: array<int, array<string, mixed>>}  $period
     * @param  array<string, mixed>  $subject
     * @return array<int, string>
     */
    private function subjectRow(array $period, array $subject, bool $showPeriodCredits): array
    {
        return [
            $period['label'],
            $showPeriodCredits ? (string) $period['credits'] : '',
            (string) ($subject['name'] ?? ''),
            (string) ($subject['component'] ?? '—'),
            (string) ($subject['type'] ?? '—'),
            (string) ($subject['area'] ?? '—'),
            (string) ($subject['level'] ?? '—'),
            (string) ($subject['credits'] ?? 0),
            (string) ($subject['theory_hours'] ?? 0),
            (string) ($subject['practice_hours'] ?? 0),
            (string) ($subject['prerequisites'] ?? '—'),
            (string) ($subject['modality_label'] ?? $subject['modality'] ?? '—'),
        ];
    }

    /**
     * @param  array<int, string>  $row
     */
    private function rowHeight(array $row): float
    {
        $fontSize = 5.1;
        $lineHeight = 6.2;
        $lineCount = 1;

        foreach ($row as $index => $text) {
            $lineCount = max(
                $lineCount,
                count($this->wrapText($text, self::COLUMN_WIDTHS[$index] - 4, $fontSize)),
            );
        }

        return max(9.0, $lineCount * $lineHeight + 2.4);
    }

    /**
     * @param  array<int, string>  $row
     */
    private function drawRow(array $row, float $height): void
    {
        $x = self::TABLE_LEFT;
        $fontSize = 5.1;

        foreach ($row as $index => $text) {
            $width = self::COLUMN_WIDTHS[$index];
            $this->cell($x, $this->cursorY, $width, $height, self::WHITE);

            if ($text !== '') {
                $lines = $this->wrapText($text, $width - 4, $fontSize);
                $lineHeight = 6.2;
                $startY = $this->cursorY + (($height - count($lines) * $lineHeight) / 2) + $fontSize;
                $leftAligned = in_array($index, [2, 10], true);

                foreach ($lines as $lineIndex => $line) {
                    $lineX = $leftAligned
                        ? $x + 2
                        : $x + (($width - $this->textWidth($line, $fontSize)) / 2);

                    $this->textAt($lineX, $startY + ($lineIndex * $lineHeight), $line, $fontSize);
                }
            }

            $x += $width;
        }
    }

    private function drawFooter(array $career, array $pensum): void
    {
        if ($this->cursorY + 28 > self::PAGE_HEIGHT - 6) {
            $this->startPage($career);
        }

        $credits = array_sum(array_column($pensum, 'credits'));
        $this->line(self::TABLE_LEFT, $this->cursorY + 5, self::TABLE_LEFT + self::TABLE_WIDTH, $this->cursorY + 5, 0.6);
        $this->textAt(self::TABLE_LEFT, $this->cursorY + 16, 'TOTAL DE CRÉDITOS: '.$credits, 6, true);
        $this->textAt(
            self::TABLE_LEFT,
            $this->cursorY + 25,
            'Nota: Las unidades curriculares de libre elección pueden variar según el período académico.',
            5.5,
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
