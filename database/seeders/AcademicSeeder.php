<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\Program;
use Illuminate\Database\Seeder;

class AcademicSeeder extends Seeder
{
    /**
     * Carga la oferta académica, los períodos y los programas de la UPEL.
     *
     * Los pensum de materias se cargan en PensumSeeder.
     */
    public function run(): void
    {
        $careers = $this->careers();

        // Renombra los códigos históricos para conservar sus pensum y ofertas.
        Career::query()->where('code', 'GEOHIS')->update(['code' => 'GEHIS']);
        Career::query()->where('code', 'LENLIT')->update(['code' => 'LENLI']);

        foreach ($careers as $careerData) {
            $career = Career::updateOrCreate(
                ['code' => $careerData['code']],
                $careerData,
            );

            foreach ($this->offeringsFor($careerData) as $offering) {
                CareerOffering::updateOrCreate(
                    [
                        'career_id' => $career->id,
                        'modality' => $offering['modality'],
                        'schedule' => $offering['schedule'],
                        'shift' => $offering['shift'],
                    ],
                    ['is_active' => true],
                );
            }
        }

        // Solo se mantienen las cuatro carreras oficiales del sistema.
        Career::query()
            ->whereNotIn('code', array_column($careers, 'code'))
            ->delete();

        $periods = [
            ['name' => '2025-II', 'starts_at' => '2025-09-15', 'ends_at' => '2026-01-31', 'is_active' => false],
            ['name' => '2026-I', 'starts_at' => '2026-02-01', 'ends_at' => '2026-07-31', 'is_active' => false],
            ['name' => '2026-II', 'starts_at' => '2026-09-01', 'ends_at' => '2027-01-31', 'is_active' => true],
        ];

        foreach ($periods as $period) {
            AcademicPeriod::updateOrCreate(
                ['name' => $period['name']],
                $period,
            );
        }

        $programs = [
            [
                'name' => 'Especialización en Didáctica de la Lengua',
                'type' => 'especializacion',
                'description' => 'Profundiza en la enseñanza de la lectura, la escritura y la literatura en todos los niveles educativos.',
                'duration' => '18 meses',
                'modality' => 'online',
            ],
            [
                'name' => 'Especialización en Educación Especial',
                'type' => 'especializacion',
                'description' => 'Formación avanzada para la atención educativa de personas en situación de discapacidad.',
                'duration' => '18 meses',
                'modality' => 'mixta',
            ],
            [
                'name' => 'Maestría en Educación Primaria',
                'type' => 'maestria',
                'description' => 'Investiga y transforma las prácticas pedagógicas de la educación primaria venezolana.',
                'duration' => '24 meses',
                'modality' => 'mixta',
            ],
            [
                'name' => 'Maestría en Gestión Educativa',
                'type' => 'maestria',
                'description' => 'Desarrolla competencias de liderazgo, planificación y gerencia de instituciones educativas.',
                'duration' => '24 meses',
                'modality' => 'online',
            ],
            [
                'name' => 'Doctorado en Educación',
                'type' => 'doctorado',
                'description' => 'Programa de investigación avanzada para la producción de conocimiento educativo original.',
                'duration' => '36 meses',
                'modality' => 'presencial',
            ],
            [
                'name' => 'Curso: Evaluación por Competencias',
                'type' => 'curso',
                'description' => 'Diseña instrumentos y estrategias para evaluar aprendizajes desde un enfoque por competencias.',
                'duration' => '8 semanas',
                'modality' => 'online',
            ],
            [
                'name' => 'Curso: Innovación Docente con TIC',
                'type' => 'curso',
                'description' => 'Integra herramientas digitales y metodologías activas en el aula.',
                'duration' => '10 semanas',
                'modality' => 'online',
            ],
            [
                'name' => 'Taller: Diseño de Materiales Didácticos',
                'type' => 'taller',
                'description' => 'Crea recursos concretos, visuales y digitales para acompañar los procesos de aprendizaje.',
                'duration' => '6 semanas',
                'modality' => 'mixta',
            ],
            [
                'name' => 'Taller: Convivencia Escolar y Mediación',
                'type' => 'taller',
                'description' => 'Herramientas para la resolución pacífica de conflictos y la construcción de comunidades escolares.',
                'duration' => '6 semanas',
                'modality' => 'presencial',
            ],
        ];

        foreach ($programs as $program) {
            Program::updateOrCreate(
                ['name' => $program['name']],
                [...$program, 'is_active' => true],
            );
        }
    }

    /**
     * Ofertas base de cada carrera: la modalidad principal en dos horarios y
     * una variante online los sábados para las carreras presenciales o mixtas.
     *
     * @param  array<string, mixed>  $career
     * @return array<int, array{modality: string, schedule: string, shift: string}>
     */
    private function offeringsFor(array $career): array
    {
        $modality = (string) $career['modality'];

        $offerings = [
            ['modality' => $modality, 'schedule' => 'lunes_viernes', 'shift' => 'diurno'],
            ['modality' => $modality, 'schedule' => 'sabatino', 'shift' => 'diurno'],
        ];

        if ($modality !== 'online') {
            $offerings[] = ['modality' => 'online', 'schedule' => 'sabatino', 'shift' => 'diurno'];
        }

        return $offerings;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function careers(): array
    {
        return [
            [
                'name' => 'Educación Primaria',
                'code' => 'EDPRI',
                'description' => 'Formación integral para acompañar el desarrollo de niños y niñas en la etapa primaria.',
                'modality' => 'mixta',
                'duration_semesters' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Educación Especial para Personas en Situación de Discapacidad',
                'code' => 'EDESP',
                'description' => 'Atención educativa a personas en situación de discapacidad desde un enfoque inclusivo.',
                'modality' => 'online',
                'duration_semesters' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Geografía e Historia',
                'code' => 'GEHIS',
                'description' => 'Comprensión del espacio geográfico y los procesos históricos para la enseñanza de las ciencias sociales.',
                'modality' => 'mixta',
                'duration_semesters' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Lengua y Literatura',
                'code' => 'LENLI',
                'description' => 'Desarrollo de la competencia comunicativa y la enseñanza de la lengua y la literatura.',
                'modality' => 'online',
                'duration_semesters' => 8,
                'is_active' => true,
            ],
        ];
    }
}
