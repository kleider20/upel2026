<?php

namespace Database\Seeders;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Models\Admission;
use App\Models\Career;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class AdmissionSeeder extends Seeder
{
    /**
     * Carga solicitudes de ejemplo para probar la bandeja administrativa.
     */
    public function run(): void
    {
        $adminId = User::query()->where('email', 'admin@upel.edu.ve')->value('id');
        $periodYear = (int) config('admissions.period_year');

        $careers = [
            'EDPRI' => Career::query()->where('code', 'EDPRI')->value('id'),
            'LENLI' => Career::query()->where('code', 'LENLI')->value('id'),
            'EDESP' => Career::query()->where('code', 'EDESP')->value('id'),
        ];

        $careerIds = array_values(array_filter($careers));

        if ($careerIds === []) {
            return;
        }

        $career = static fn (string $code): int => (int) (
            Career::query()->where('code', $code)->value('id') ?? $careerIds[0]
        );

        $maria = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000901'],
            [
                'period_year' => $periodYear,
                'first_name' => 'María Fernanda',
                'last_name' => 'Rodríguez Pérez',
                'nationality' => 'V',
                'id_number' => '18765432',
                'birth_date' => '2004-03-14',
                'gender' => 'femenino',
                'email' => 'maria.rodriguez@aspirante.upel.edu.ve',
                'phone' => '0414 1234567',
                'address' => 'Caracas, Municipio Libertador, Parroquia El Recreo.',
                'career_id' => $career('EDPRI'),
                'modality' => 'mixta',
                'schedule' => 'lunes_viernes',
                'shift' => 'diurno',
                'high_school' => 'Unidad Educativa Nacional Andrés Bello',
                'high_school_year' => 2022,
                'high_school_average' => 18.45,
                'status' => AdmissionStatus::Aprobada->value,
                'review_notes' => 'Expediente completo y verificado. Lista para generar la cuenta de estudiante.',
                'reviewed_by' => $adminId,
                'reviewed_at' => now()->subDays(2),
                'submitted_at' => now()->subDays(12),
            ],
        );

        $jose = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000902'],
            [
                'period_year' => $periodYear,
                'first_name' => 'José Luis',
                'last_name' => 'Martínez Guerra',
                'nationality' => 'V',
                'id_number' => '20123456',
                'birth_date' => '2003-09-02',
                'gender' => 'masculino',
                'email' => 'jose.martinez@aspirante.upel.edu.ve',
                'phone' => '0424 7654321',
                'address' => 'Valencia, Municipio Naguanagua, Parroquia Naguanagua.',
                'career_id' => $career('LENLI'),
                'modality' => 'online',
                'schedule' => 'sabatino',
                'shift' => 'diurno',
                'high_school' => 'Liceo Bolivariano José Antonio Páez',
                'high_school_year' => 2021,
                'high_school_average' => 16.80,
                'status' => AdmissionStatus::EnRevision->value,
                'reviewed_by' => $adminId,
                'reviewed_at' => now()->subDay(),
                'submitted_at' => now()->subDays(8),
            ],
        );

        $ana = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000903'],
            [
                'period_year' => $periodYear,
                'first_name' => 'Ana Gabriela',
                'last_name' => 'Pérez Molina',
                'nationality' => 'V',
                'id_number' => '21456789',
                'birth_date' => '2005-01-27',
                'gender' => 'femenino',
                'email' => 'ana.perez@aspirante.upel.edu.ve',
                'phone' => '0416 9876543',
                'address' => 'Maracay, Municipio Girardot, Parroquia Las Delicias.',
                'career_id' => $career('EDESP'),
                'modality' => 'presencial',
                'schedule' => 'lunes_viernes',
                'shift' => 'nocturno',
                'high_school' => 'Unidad Educativa Colegio Nuestra Señora del Carmen',
                'high_school_year' => 2023,
                'high_school_average' => 15.25,
                'status' => AdmissionStatus::Observada->value,
                'review_notes' => 'El título de bachiller está ilegible. Debes cargar un escaneo nítido antes de continuar.',
                'reviewed_by' => $adminId,
                'reviewed_at' => now()->subDays(3),
                'submitted_at' => now()->subDays(15),
            ],
        );

        $carlos = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000904'],
            [
                'period_year' => $periodYear,
                'first_name' => 'Carlos Andrés',
                'last_name' => 'Sánchez Rivas',
                'nationality' => 'V',
                'id_number' => '22876543',
                'birth_date' => '2004-11-08',
                'gender' => 'masculino',
                'email' => 'carlos.sanchez@aspirante.upel.edu.ve',
                'phone' => '0412 5551234',
                'address' => 'Barquisimeto, Municipio Iribarren, Parroquia Concepción.',
                'career_id' => $career('EDPRI'),
                'modality' => 'mixta',
                'schedule' => 'lunes_viernes',
                'shift' => 'diurno',
                'high_school' => 'Liceo Bolivariano Lisandro Alvarado',
                'high_school_year' => 2022,
                'high_school_average' => 17.10,
                'status' => AdmissionStatus::Recibida->value,
                'submitted_at' => now()->subHours(6),
            ],
        );

        $daniela = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000905'],
            [
                'period_year' => $periodYear,
                'first_name' => 'Daniela Valentina',
                'last_name' => 'Torres Lozada',
                'nationality' => 'V',
                'id_number' => '23456781',
                'birth_date' => '2002-06-19',
                'gender' => 'femenino',
                'email' => 'daniela.torres@aspirante.upel.edu.ve',
                'phone' => '0426 3332211',
                'address' => 'Mérida, Municipio Libertador, Parroquia Milla.',
                'career_id' => $career('LENLI'),
                'modality' => 'online',
                'schedule' => 'sabatino',
                'shift' => 'diurno',
                'high_school' => 'Unidad Educativa Colegio La Salle',
                'high_school_year' => 2020,
                'high_school_average' => 12.40,
                'status' => AdmissionStatus::Rechazada->value,
                'review_notes' => 'El promedio de bachillerato no alcanza el mínimo exigido para la carrera solicitada.',
                'reviewed_by' => $adminId,
                'reviewed_at' => now()->subDays(4),
                'submitted_at' => now()->subDays(20),
            ],
        );

        $luis = Admission::query()->updateOrCreate(
            ['code' => 'ASP-2027-000906'],
            [
                'period_year' => $periodYear,
                'first_name' => 'Luis Miguel',
                'last_name' => 'Herrera Contreras',
                'nationality' => 'E',
                'id_number' => '84512367',
                'birth_date' => '2004-08-30',
                'gender' => 'masculino',
                'email' => 'luis.herrera@aspirante.upel.edu.ve',
                'phone' => '0414 7778899',
                'address' => 'San Cristóbal, Municipio San Cristóbal, Parroquia La Concordia.',
                'career_id' => $career('EDESP'),
                'modality' => 'mixta',
                'schedule' => 'sabatino',
                'shift' => 'nocturno',
                'high_school' => 'Liceo Bolivariano Simón Bolívar',
                'high_school_year' => 2023,
                'high_school_average' => 14.75,
                'status' => AdmissionStatus::Recibida->value,
                'submitted_at' => now()->subHours(2),
            ],
        );

        $this->documents($maria, [
            AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Validado,
        ], $adminId);

        $this->documents($jose, [
            AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Pendiente,
            AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Pendiente,
        ], $adminId);

        $this->documents($ana, [
            AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Rechazado,
            AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Validado,
            AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Pendiente,
        ], $adminId, [
            AdmissionDocumentType::TituloBachiller->value => 'El archivo está borroso. Debes escanearlo de nuevo a 300 dpi.',
        ]);

        $this->documents($luis, [
            AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Pendiente,
        ], $adminId);

        $this->history($maria, $adminId);
        $this->history($jose, $adminId);
        $this->history($ana, $adminId);
        $this->history($carlos, null);
        $this->history($daniela, $adminId);
        $this->history($luis, null);
    }

    /**
     * Crea o actualiza los documentos de una solicitud.
     *
     * @param  array<string, AdmissionDocumentStatus>  $statuses
     * @param  array<string, string>  $notes
     */
    private function documents(
        Admission $admission,
        array $statuses,
        ?int $reviewerId,
        array $notes = [],
    ): void {
        foreach ($statuses as $type => $status) {
            $documentType = AdmissionDocumentType::from($type);
            $extension = $documentType === AdmissionDocumentType::Foto ? 'png' : 'pdf';
            $path = trim((string) config('admissions.documents.path'), '/')
                .'/'.$admission->code.'/'.$documentType->value.'.'.$extension;

            $content = $extension === 'png'
                ? (string) base64_decode(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                    true,
                )
                : $this->pdfContent($documentType);

            Storage::disk((string) config('admissions.documents.disk'))->put($path, $content);

            $reviewed = $status !== AdmissionDocumentStatus::Pendiente;

            $admission->documents()->updateOrCreate(
                ['type' => $documentType->value],
                [
                    'status' => $status->value,
                    'original_name' => $documentType->value.'.'.$extension,
                    'path' => $path,
                    'mime_type' => $extension === 'png' ? 'image/png' : 'application/pdf',
                    'size' => strlen($content),
                    'notes' => $notes[$documentType->value] ?? null,
                    'reviewed_by' => $reviewed ? $reviewerId : null,
                    'reviewed_at' => $reviewed ? now() : null,
                ],
            );
        }
    }

    /**
     * Genera el historial de estados de una solicitud de ejemplo.
     */
    private function history(Admission $admission, ?int $adminId): void
    {
        if ($admission->statusHistories()->exists()) {
            return;
        }

        $admission->statusHistories()->create([
            'from_status' => null,
            'to_status' => AdmissionStatus::Recibida->value,
            'note' => 'Solicitud recibida desde el formulario público.',
            'changed_by' => null,
        ]);

        if ($admission->status === AdmissionStatus::Recibida->value) {
            return;
        }

        $admission->statusHistories()->create([
            'from_status' => AdmissionStatus::Recibida->value,
            'to_status' => $admission->status,
            'note' => $admission->review_notes ?? 'Solicitud revisada por el equipo de admisión.',
            'changed_by' => $adminId,
        ]);
    }

    /**
     * Contenido mínimo de un PDF de demostración.
     */
    private function pdfContent(AdmissionDocumentType $type): string
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
