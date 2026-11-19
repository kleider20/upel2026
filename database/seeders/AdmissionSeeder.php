<?php

namespace Database\Seeders;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Models\Admission;
use Database\Seeders\Concerns\GeneratesDummyFiles;
use Database\Seeders\Concerns\ResolvesAcademicEntities;
use Database\Seeders\Concerns\TracksAdmissionStatus;
use Illuminate\Database\Seeder;

class AdmissionSeeder extends Seeder
{
    use GeneratesDummyFiles, ResolvesAcademicEntities, TracksAdmissionStatus;

    /**
     * Carga solicitudes de ejemplo para probar la bandeja administrativa.
     */
    public function run(): void
    {
        $adminId = $this->getAdminUser()->id;
        $periodYear = (int) config('admissions.period_year');

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
                'career_id' => $this->getCareer('EDPRI')->id,
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
                'career_id' => $this->getCareer('LENLI')->id,
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
                'career_id' => $this->getCareer('EDESP')->id,
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
                'career_id' => $this->getCareer('EDPRI')->id,
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
                'career_id' => $this->getCareer('LENLI')->id,
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
                'career_id' => $this->getCareer('EDESP')->id,
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

        /**
         * @var array<int, array{
         *     0: Admission,
         *     1: array<string, AdmissionDocumentStatus>,
         *     2: int,
         *     3: array<string, string>
         * }> $documentsByAdmission
         */
        $documentsByAdmission = [
            [$maria, [
                AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Validado,
            ], $adminId, []],
            [$jose, [
                AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Pendiente,
                AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Pendiente,
            ], $adminId, []],
            [$ana, [
                AdmissionDocumentType::TituloBachiller->value => AdmissionDocumentStatus::Rechazado,
                AdmissionDocumentType::NotasCertificadas->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::Cedula->value => AdmissionDocumentStatus::Validado,
                AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Pendiente,
            ], $adminId, [
                AdmissionDocumentType::TituloBachiller->value => 'El archivo está borroso. Debes escanearlo de nuevo a 300 dpi.',
            ]],
            [$luis, [
                AdmissionDocumentType::Foto->value => AdmissionDocumentStatus::Pendiente,
            ], $adminId, []],
        ];

        foreach ($documentsByAdmission as [$admission, $statuses, $reviewerId, $notes]) {
            foreach ($statuses as $type => $status) {
                $documentType = AdmissionDocumentType::from($type);
                $reviewed = $status !== AdmissionDocumentStatus::Pendiente;

                $admission->documents()->updateOrCreate(
                    ['type' => $documentType->value],
                    [
                        ...$this->storeDummyDocument($admission->code, $documentType),
                        'status' => $status->value,
                        'notes' => $notes[$documentType->value] ?? null,
                        'reviewed_by' => $reviewed ? $reviewerId : null,
                        'reviewed_at' => $reviewed ? now() : null,
                    ],
                );
            }
        }

        $this->seedAdmissionHistory($maria, $adminId);
        $this->seedAdmissionHistory($jose, $adminId);
        $this->seedAdmissionHistory($ana, $adminId);
        $this->seedAdmissionHistory($carlos, null);
        $this->seedAdmissionHistory($daniela, $adminId);
        $this->seedAdmissionHistory($luis, null);
    }
}
