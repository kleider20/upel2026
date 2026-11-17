<?php

namespace App\Support;

/**
 * Genera la planilla de Asesoría Académica e Inscripción (Diseño 2015).
 *
 * Reproduce el formato institucional de la UPEL-IMPM: cabecera con los
 * logotipos, datos básicos del estudiante, tabla de unidades curriculares
 * (PA, COMP, TIPO, CA e INSCRITAS) y los datos de los funcionarios. Usa las
 * fuentes estándar de PDF, sin dependencias externas.
 */
final class StudentEnrollmentSheetPdf
{
    private const PAGE_WIDTH = 612.0;

    private const PAGE_HEIGHT = 792.0;

    private const LEFT = 37.2;

    /**
     * @var array{int, int, int}
     */
    private const LABEL_FILL = [215, 215, 215];

    /**
     * @var array{int, int, int}
     */
    private const HEADER_FILL = [217, 217, 217];

    /**
     * @var array{int, int, int}
     */
    private const BLACK = [0, 0, 0];

    /**
     * @var array{int, int, int}
     */
    private const WHITE = [255, 255, 255];

    private string $content = '';

    /**
     * @param  array<string, mixed>  $sheet
     */
    public static function make(array $sheet): string
    {
        return (new self)->build($sheet);
    }

    /**
     * @param  array<string, mixed>  $sheet
     */
    private function build(array $sheet): string
    {
        $this->drawHeader();

        $top = $this->drawBasicData($sheet);
        $top = $this->drawSubjects($sheet, $top);
        $this->drawOfficials($top);

        return $this->assemble($this->content);
    }

    /**
     * Cabecera institucional con los logotipos y el título del documento.
     */
    private function drawHeader(): void
    {
        $this->image('upel-logo.jpg', 0.05, 0.3, 53.8, 49.1, 'Im1');
        $this->image('impm-logo.jpg', 476.5, 1.1, 53.4, 52.3, 'Im2');

        $center = self::PAGE_WIDTH / 2;

        $lines = [
            [48, 'República Bolivariana de Venezuela'],
            [59, 'Universidad Pedagógica Experimental Libertador'],
            [70, 'Instituto de Mejoramiento Profesional del Magisterio'],
            [81, 'Secretaría'],
        ];

        foreach ($lines as [$top, $text]) {
            $this->centeredAt($center, $top, $text, 8.5, true);
        }

        $this->centeredAt($center, 100, 'Planilla de Asesoría Académica e Inscripción Diseño 2015', 12, true);
        $this->textAt(self::LEFT, 116, 'Datos Básicos', 10, true);
    }

    /**
     * Bloque "Datos Básicos" del estudiante.
     *
     * @param  array<string, mixed>  $sheet
     */
    private function drawBasicData(array $sheet): float
    {
        /** @var array<string, mixed> $student */
        $student = $sheet['student'];

        $rows = [
            [
                [107.2, 'Céd. de Identidad', true],
                [160.9, (string) ($student['identity_document'] ?? ''), false],
                [160.9, 'Período Académico', true],
                [108.5, (string) ($student['period'] ?? ''), false],
            ],
            [
                [107.2, 'Cohorte', true],
                [107.2, (string) ($student['cohort'] ?? ''), false],
                [107.2, 'Especialidad', true],
                [215.9, (string) ($student['specialty'] ?? ''), false],
            ],
            [
                [107.2, 'Entidad Académica', true],
                [430.4, (string) ($student['entity'] ?? ''), false],
            ],
            [
                [107.2, 'Primer Apellido', true],
                [160.9, (string) ($student['first_surname'] ?? ''), false],
                [107.2, 'Segundo Apellido', true],
                [162.1, (string) ($student['second_surname'] ?? ''), false],
            ],
            [
                [107.2, 'Primer Nombre', true],
                [160.9, (string) ($student['first_name'] ?? ''), false],
                [107.2, 'Segundo Nombre', true],
                [162.1, (string) ($student['second_name'] ?? ''), false],
            ],
            [
                [107.2, 'Fecha de Nacimiento', true],
                [107.2, (string) ($student['birth_date'] ?? ''), false],
                [107.2, 'Estado Civil', true],
                [107.4, (string) ($student['civil_status'] ?? ''), false],
                [53.5, 'Sexo', true],
                [55.0, (string) ($student['sex'] ?? ''), false],
            ],
            [
                [107.2, 'Teléfono', true],
                [107.2, (string) ($student['phone'] ?? ''), false],
                [80.4, 'Email', true],
                [242.6, (string) ($student['email'] ?? ''), false],
            ],
            [
                [107.2, 'Dirección', true],
                [430.4, (string) ($student['address'] ?? ''), false],
            ],
        ];

        $height = 15.2;
        $top = 122.0;

        foreach ($rows as $row) {
            $this->drawDataRow($row, $top, $height);
            $top += $height;
        }

        return 254.5;
    }

    /**
     * @param  array<int, array{0: float, 1: string, 2: bool}>  $cells
     */
    private function drawDataRow(array $cells, float $top, float $height): void
    {
        $x = self::LEFT;

        foreach ($cells as [$width, $text, $isLabel]) {
            $this->cell($x, $top, $width, $height, $isLabel ? self::LABEL_FILL : self::WHITE);
            $size = $this->fitSize($text, $width - 4, 9.2);
            $this->centeredInCell($x, $top, $width, $height, $text, $size, true);
            $x += $width;
        }
    }

    /**
     * Tabla "Unidades Curriculares Asesoradas/Inscritas" y firma del estudiante.
     *
     * @param  array<string, mixed>  $sheet
     */
    private function drawSubjects(array $sheet, float $top): float
    {
        $this->textAt(self::LEFT, $top, 'Unidades Curriculares Asesoradas/Inscritas:', 10, true);

        $tableTop = $top + 5.0;
        $columns = [32.7, 298.6, 55.5, 55.9, 36.5, 58.5];
        $headers = ['PA', 'UNIDAD CURRICULAR / EJE CURRICULAR', 'COMP', 'TIPO', 'CA', 'INSCRITAS'];
        $headerHeight = 25.2;

        $x = self::LEFT;

        foreach ($headers as $index => $header) {
            $width = $columns[$index];
            $this->cell($x, $tableTop, $width, $headerHeight, self::HEADER_FILL);
            $this->centeredInCell($x, $tableTop, $width, $headerHeight, $header, 8, true);
            $x += $width;
        }

        /** @var array<int, array<string, mixed>> $rows */
        $rows = array_values((array) $sheet['rows']);
        $bodyTop = $tableTop + $headerHeight;
        $rowCount = max(7, count($rows));
        $rowHeight = min(25.2, (620.0 - $bodyTop) / $rowCount);

        for ($index = 0; $index < $rowCount; $index++) {
            $rowTop = $bodyTop + ($index * $rowHeight);
            $row = $rows[$index] ?? null;

            $values = [
                (string) ($row['pa'] ?? ''),
                (string) ($row['name'] ?? ''),
                (string) ($row['component'] ?? ''),
                (string) ($row['type'] ?? ''),
                (string) ($row['credits'] ?? ''),
                ($row !== null && ($row['enrolled'] ?? false) === true) ? 'X' : '',
            ];

            $x = self::LEFT;

            foreach ($values as $column => $value) {
                $width = $columns[$column];
                $this->cell($x, $rowTop, $width, $rowHeight, self::WHITE);
                $size = $this->fitSize($value, $width - 5, 8.5);
                $this->centeredInCell($x, $rowTop, $width, $rowHeight, $value, $size, true);
                $x += $width;
            }
        }

        $footerTop = $bodyTop + ($rowCount * $rowHeight);
        $footerWidths = [141.1, 190.2, 111.4, 36.5, 58.5];
        $footerHeight = 25.2;

        $x = self::LEFT;

        $this->cell($x, $footerTop, $footerWidths[0], $footerHeight, self::LABEL_FILL);
        $this->centeredInCell($x, $footerTop, $footerWidths[0], $footerHeight, 'Firma del Estudiante:', 9, true);
        $x += $footerWidths[0];

        $this->cell($x, $footerTop, $footerWidths[1], $footerHeight, self::WHITE);
        $x += $footerWidths[1];

        $this->cell($x, $footerTop, $footerWidths[2], $footerHeight, self::LABEL_FILL);
        $this->centeredInCell($x, $footerTop + 4.0, $footerWidths[2], 8.0, 'TOTAL CA ASESORADOS E', 7, true);
        $this->centeredInCell($x, $footerTop + 12.5, $footerWidths[2], 8.0, 'INSCRITOS EN EL PERÍODO', 7, true);
        $x += $footerWidths[2];

        $this->cell($x, $footerTop, $footerWidths[3], $footerHeight, self::WHITE);
        $x += $footerWidths[3];

        $this->cell($x, $footerTop, $footerWidths[4], $footerHeight, self::WHITE);
        $this->centeredInCell($x, $footerTop, $footerWidths[4], $footerHeight, (string) ($sheet['total_credits'] ?? 0), 10, true);

        return $footerTop + $footerHeight + 15.0;
    }

    /**
     * Bloque "Datos de los Funcionarios" y sello del instituto.
     */
    private function drawOfficials(float $top): void
    {
        $this->textAt(self::LEFT, $top, 'Datos de los Funcionarios:', 10, true);

        $tableTop = $top + 5.0;
        $columns = [107.5, 161.3, 107.6, 161.4];
        $height = 16.0;
        $headers = ['', 'Nombre y Apellido', 'Fecha', 'Firma'];

        $x = self::LEFT;

        foreach ($headers as $index => $header) {
            $this->cell($x, $tableTop, $columns[$index], $height, self::WHITE);
            $this->centeredInCell($x, $tableTop, $columns[$index], $height, $header, 8.5, true);
            $x += $columns[$index];
        }

        foreach (['Asesoría:', 'Inscripción:'] as $index => $label) {
            $rowTop = $tableTop + $height + ($index * $height);
            $x = self::LEFT;

            foreach ([$label, '', '', ''] as $column => $value) {
                $this->cell($x, $rowTop, $columns[$column], $height, $column === 0 ? self::LABEL_FILL : self::WHITE);
                $this->centeredInCell($x, $rowTop, $columns[$column], $height, (string) $value, 8.5, true);
                $x += $columns[$column];
            }
        }

        $this->centeredAt(self::PAGE_WIDTH / 2, $tableTop + ($height * 3) + 14.0, 'Sello:', 10, true);
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

    private function image(string $file, float $x, float $top, float $width, float $height, string $name): void
    {
        $path = public_path('images/schedule/'.$file);

        if (! is_file($path)) {
            return;
        }

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
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R /Im2 8 0 R >> >> /Contents 4 0 R >>',
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
