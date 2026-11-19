<?php

namespace Database\Seeders\Concerns;

use App\Enums\AdmissionDocumentType;
use Illuminate\Support\Facades\Storage;

/**
 * Genera y guarda archivos de demostración para los expedientes de admisión.
 */
trait GeneratesDummyFiles
{
    /**
     * Guarda un archivo falso del tipo indicado dentro del expediente.
     *
     * @return array{path: string, mime_type: string, size: int, original_name: string}
     */
    protected function storeDummyDocument(string $admissionCode, AdmissionDocumentType $type): array
    {
        $extension = $type === AdmissionDocumentType::Foto ? 'png' : 'pdf';

        $path = trim((string) config('admissions.documents.path'), '/')
            .'/'.$admissionCode.'/'.$type->value.'.'.$extension;

        $content = $extension === 'png'
            ? $this->generateDummyImage()
            : $this->generateDummyPdf($type);

        Storage::disk((string) config('admissions.documents.disk'))->put($path, $content);

        return [
            'path' => $path,
            'mime_type' => $extension === 'png' ? 'image/png' : 'application/pdf',
            'size' => strlen($content),
            'original_name' => $type->value.'.'.$extension,
        ];
    }

    /**
     * PNG transparente de 1x1 píxel.
     */
    protected function generateDummyImage(): string
    {
        return (string) base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            true,
        );
    }

    /**
     * PDF mínimo válido que identifica el tipo de documento.
     */
    protected function generateDummyPdf(AdmissionDocumentType $type): string
    {
        return implode("\n", [
            '%PDF-1.4',
            '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
            '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
            '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]>>endobj',
            'trailer<</Root 1 0 R>>',
            '%%EOF',
            '% Documento de demostración: '.$type->label(),
        ]);
    }
}
