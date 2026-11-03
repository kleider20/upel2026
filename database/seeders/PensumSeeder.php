<?php

namespace Database\Seeders;

use App\Models\Career;
use App\Models\Subject;
use App\Support\SubjectCode;
use Illuminate\Database\Seeder;

class PensumSeeder extends Seeder
{
    /**
     * Carga los pensum oficiales de las carreras de pregrado.
     *
     * Los datos provienen de los planes curriculares del Vicerrectorado de
     * Docencia: Educación Primaria, Educación Especial, Lengua y Literatura y
     * Geografía e Historia. Las unidades de libre elección (UNCLE) se cargan
     * aparte porque varían en cada período académico.
     */
    public function run(): void
    {
        $plans = $this->plans();

        $careers = Career::query()
            ->whereIn('code', array_keys($plans))
            ->get()
            ->keyBy('code');

        $created = 0;
        $updated = 0;

        foreach ($plans as $careerCode => $subjects) {
            $career = $careers->get($careerCode);

            if ($career === null) {
                continue;
            }

            foreach ($subjects as $index => $subjectData) {
                $subjectData = array_pad($subjectData, 8, null);

                [
                    $name,
                    $semester,
                    $component,
                    $type,
                    $credits,
                    $theoryHours,
                    $practiceHours,
                    $prerequisites,
                ] = $subjectData;

                $subject = Subject::query()->firstOrNew([
                    'career_id' => $career->id,
                    'name' => $name,
                ]);

                $subject->fill([
                    'semester' => $semester,
                    'modality' => match (true) {
                        str_contains($name, 'TIC') => 'online',
                        $component === 'ECU' => 'presencial',
                        $component === 'CFC' => 'mixta',
                        default => 'presencial',
                    },
                    'component' => $component ?? 'CFPE',
                    'type' => $type ?? 'UNCO',
                    'area' => $component ?? 'CFPE',
                    'level' => match (true) {
                        $semester <= 2 => 'FUND',
                        $semester <= 4 => 'INTEG',
                        default => 'PROF',
                    },
                    'credits' => $credits ?? 4,
                    'theory_hours' => $theoryHours ?? 4,
                    'practice_hours' => $practiceHours ?? 8,
                    'prerequisites' => $prerequisites,
                    'is_active' => true,
                ]);

                if (! $subject->exists) {
                    $subject->code = $this->availableCode(
                        $career,
                        sprintf('%s-%03d', $career->code, $index + 1),
                    );
                    $created++;
                } else {
                    $updated++;
                }

                $subject->save();
            }
        }

        foreach ($this->electives() as $careerCode => $subjects) {
            $career = $careers->get($careerCode);

            if ($career === null) {
                continue;
            }

            foreach ($subjects as $data) {
                $subject = Subject::query()->firstOrNew([
                    'career_id' => $career->id,
                    'name' => $data['name'],
                ]);

                $subject->fill([
                    'semester' => $data['semester'],
                    'modality' => $data['modality'],
                    'component' => $data['component'],
                    'type' => SubjectCode::ELECTIVE_TYPE,
                    'area' => $data['component'],
                    'level' => match (true) {
                        $data['semester'] <= 2 => 'FUND',
                        $data['semester'] <= 4 => 'INTEG',
                        default => 'PROF',
                    },
                    'credits' => $data['credits'],
                    'theory_hours' => $data['theory_hours'],
                    'practice_hours' => $data['practice_hours'],
                    'prerequisites' => null,
                    'is_active' => true,
                ]);

                if (! $subject->exists) {
                    $subject->code = SubjectCode::generate(
                        $data['name'],
                        $data['semester'],
                        $data['modality'],
                        SubjectCode::ELECTIVE_TYPE,
                    );
                    $created++;
                } else {
                    $updated++;
                }

                $subject->save();
            }
        }

        $this->command?->info(
            "Pensum: {$created} materias creadas, {$updated} actualizadas.",
        );
    }

    /**
     * Busca el primer código libre para evitar colisiones al agregar materias
     * nuevas a pensum ya cargados.
     */
    private function availableCode(Career $career, string $preferred): string
    {
        $suffix = (int) substr($preferred, strrpos($preferred, '-') + 1);
        $code = $preferred;

        while (
            Subject::query()
                ->where('career_id', $career->id)
                ->where('code', $code)
                ->exists()
        ) {
            $suffix++;
            $code = sprintf('%s-%03d', $career->code, $suffix);
        }

        return $code;
    }

    /**
     * Estructura de cada materia:
     * [nombre, semestre, componente, tipo, créditos, HAD, HLE, prerrequisito].
     *
     * @return array<string, array<int, array<int, mixed>>>
     */
    private function plans(): array
    {
        return [
            'EDPRI' => [
                ['Fundamentos de la Educación Primaria', 1],
                ['Introducción al Estudio de la Lengua', 1],
                ['Sociedad y Educación', 1, 'CFD'],
                ['Desarrollo de Procesos Cognitivos', 1, 'CFD'],
                ['Investigación I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['Aprendizaje Matemático I', 2],
                ['Pensamiento Filosófico y Pedagógico', 2, 'CFD'],
                ['Psicología del Aprendizaje', 2, 'CFD'],
                ['Expresión Oral y Escrita', 2, 'CFC'],
                ['Práctica Profesional I', 2, 'ECU', 'UNCO', 8, 8, 6],
                ['Historia de Venezuela y Ciudadanía', 3],
                ['Ciencias Naturales', 3],
                ['Didáctica General', 3, 'CFD'],
                ['Desarrollo Curricular', 3, 'CFD'],
                ['Investigación II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['Aprendizaje Matemático II', 4],
                ['Geografía de Venezuela', 4],
                ['Planificación de la Enseñanza y del Aprendizaje', 4, 'CFD'],
                ['Discursos Especializados en Idioma Inglés', 4, 'CFC'],
                ['Práctica Profesional II', 4, 'ECU', 'UNCO', 8, 8, 6],
                ['Adquisición y Desarrollo del Lenguaje', 5],
                ['Atención a Niños y Jóvenes con Discapacidad', 5],
                ['Evaluación del Aprendizaje', 5, 'CFD'],
                ['Actividad Física, Deporte y Recreación', 5, 'CFC'],
                ['Investigación III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['Didáctica de la Lectura y Escritura', 6],
                ['Geometría', 6],
                ['Gerencia y Legislación', 6, 'CFD'],
                ['Práctica Profesional III', 6, 'ECU', 'UNCO', 8, 8, 6],
                ['Didáctica en la Educación Primaria', 7],
                ['Educación para las Artes', 7],
                ['Orientación Educativa y Diversidad', 7, 'CFD'],
                ['Educación Ambiental', 7, 'CFC'],
                ['Investigación IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['Práctica Profesional IV', 8, 'ECU', 'UNCO', 8, 8, 6],
            ],
            'EDESP' => [
                ['Psicología Evolutiva', 1],
                ['Legislación de la Educación Especial', 1],
                ['Sociedad y Educación', 1, 'CFD'],
                ['Desarrollo de Procesos Cognitivos', 1, 'CFD'],
                ['Investigación I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['Discapacidad y Diferencia', 2, 'CFPE', 'UNCO', 4, 4, 8, 'Legislación de la Educación Especial'],
                ['Pensamiento Filosófico y Pedagógico', 2, 'CFD'],
                ['Psicología del Aprendizaje', 2, 'CFD'],
                ['Expresión Oral y Escrita', 2, 'CFC'],
                ['Práctica Profesional I', 2, 'ECU', 'UNCO', 8, 8, 6],
                ['Perspectiva de la Situación de Discapacidad', 3, 'CFPE', 'UNCO', 4, 4, 8, 'Discapacidad y Diferencia'],
                ['Neurociencia', 3, 'CFPE', 'UNCO', 4, 4, 8, 'Psicología Evolutiva'],
                ['Didáctica General', 3, 'CFD'],
                ['Desarrollo Curricular', 3, 'CFD'],
                ['Investigación II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['Abordaje Pedagógico de la Situación de Discapacidad en la Primera Infancia (0 a 6 años)', 4, 'CFPE', 'UNCO', 4, 4, 8, 'Perspectiva de la Situación de Discapacidad'],
                ['Evaluación de la Situación de Discapacidad', 4, 'CFPE', 'UNCO', 4, 4, 8, 'Didáctica General'],
                ['Planificación de la Enseñanza y del Aprendizaje', 4, 'CFD'],
                ['Discurso Especializado del Idioma Inglés', 4, 'CFC'],
                ['Práctica Profesional II', 4, 'ECU', 'UNCO', 8, 8, 6],
                ['Abordaje Pedagógico de la Situación de Discapacidad en la Edad Escolar (6 a 12 años)', 5, 'CFPE', 'UNCO', 4, 4, 8, 'Abordaje Pedagógico de la Situación de Discapacidad en la Primera Infancia (0 a 6 años)'],
                ['Orientación para la Atención de Personas en Situación de Discapacidad', 5, 'CFPE', 'UNCO', 4, 4, 8, 'Evaluación de la Situación de Discapacidad'],
                ['Evaluación del Aprendizaje', 5, 'CFD'],
                ['Educación Física, Deporte y Recreación', 5, 'CFC'],
                ['Investigación III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['Abordaje Pedagógico de la Situación de Discapacidad en la Adolescencia y la Adultez', 6, 'CFPE', 'UNCO', 4, 4, 8, 'Abordaje Pedagógico de la Situación de Discapacidad en la Edad Escolar (6 a 12 años)'],
                ['Tendencias Actuales y Futuras para la Atención de la Persona en Situación de Discapacidad', 6, 'CFPE', 'UNCO', 4, 4, 8, 'Orientación para la Atención de Personas en Situación de Discapacidad'],
                ['Gerencia y Legislación Educativa', 6, 'CFD'],
                ['Práctica Profesional III', 6, 'ECU', 'UNCO', 8, 8, 6],
                ['Adaptaciones Curriculares', 7, 'CFPE', 'UNCO', 4, 4, 8, 'Abordaje Pedagógico de la Situación de Discapacidad en la Adolescencia y la Adultez'],
                ['Visión Socioantropológica de la Discapacidad', 7, 'CFPE', 'UNCO', 4, 4, 8, 'Tendencias Actuales y Futuras para la Atención de la Persona en Situación de Discapacidad'],
                ['Orientación Educativa y Diversidad', 7, 'CFD'],
                ['Educación Ambiental', 7, 'CFC'],
                ['Investigación IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['Práctica Profesional IV', 8, 'ECU', 'UNCO', 8, 8, 6],
            ],
            'LENLI' => [
                ['Introducción a los Estudios de la Lengua', 1],
                ['Cultura y Discurso Literario', 1],
                ['Sociedad y Educación', 1, 'CFD'],
                ['Desarrollo de Procesos Cognitivos', 1, 'CFD'],
                ['Investigación I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['Tendencias de la Lingüística', 2],
                ['Pensamiento Filosófico y Pedagógico', 2, 'CFD'],
                ['Psicología del Aprendizaje', 2, 'CFD'],
                ['Expresión Oral y Escrita', 2, 'CFC'],
                ['Práctica Profesional I', 2, 'ECU', 'UNCO', 8, 8, 6],
                ['Gramática', 3],
                ['Visiones de la Literatura', 3],
                ['Didáctica General', 3, 'CFD'],
                ['Desarrollo Curricular', 3, 'CFD'],
                ['Investigación II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['Comprensión de Textos Orales y Escritos', 4],
                ['Literatura Venezolana', 4],
                ['Planificación de la Enseñanza y del Aprendizaje', 4, 'CFD'],
                ['Discursos Especializados en Idioma Inglés', 4, 'CFC'],
                ['Práctica Profesional II', 4, 'ECU', 'UNCO', 8, 8, 6],
                ['Léxico-Semántica y Semiótica', 5],
                ['Literatura Latinoamericana y Caribeña', 5],
                ['Evaluación del Aprendizaje', 5, 'CFD'],
                ['Actividad Física, Deporte y Recreación', 5, 'CFC'],
                ['Investigación III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['Latín', 6],
                ['Literatura Juvenil', 6],
                ['Gerencia y Legislación', 6, 'CFD'],
                ['Práctica Profesional III', 6, 'ECU', 'UNCO', 8, 8, 6],
                ['Español de Venezuela', 7],
                ['Lengua, Literatura y Sociedad', 7],
                ['Orientación Educativa y Diversidad', 7, 'CFD'],
                ['Educación Ambiental', 7, 'CFC'],
                ['Investigación IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['Práctica Profesional IV', 8, 'ECU', 'UNCO', 8, 8, 6],
            ],
            'GEHIS' => [
                ['Historia Originaria y Colonial de Venezuela', 1],
                ['Geografía General', 1],
                ['Sociedad y Educación', 1, 'CFD'],
                ['Desarrollo de Procesos Cognitivos', 1, 'CFD'],
                ['Investigación I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC I', 1, 'ECU', 'UNCO', 4, 4, 0],
                ['Interpretación de Recursos Cartográficos', 2],
                ['Pensamiento Filosófico y Pedagógico', 2, 'CFD'],
                ['Psicología del Aprendizaje', 2, 'CFD'],
                ['Expresión Oral y Escrita', 2, 'CFC'],
                ['Práctica Profesional I', 2, 'ECU', 'UNCO', 8, 8, 6],
                ['Análisis y Organización del Espacio Geográfico', 3, 'CFPE', 'UNCO', 4, 4, 8, 'Interpretación de Recursos Cartográficos'],
                ['Procesos Históricos del Mundo I', 3],
                ['Didáctica General', 3, 'CFD'],
                ['Desarrollo Curricular', 3, 'CFD'],
                ['Investigación II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC II', 3, 'ECU', 'UNCO', 4, 4, 0],
                ['Pensamiento Bolivariano', 4, 'CFPE', 'UNCO', 4, 4, 8, 'Historia Originaria y Colonial de Venezuela'],
                ['Ecogeografía de Venezuela', 4, 'CFPE', 'UNCO', 4, 4, 8, 'Geografía General'],
                ['Planificación de la Enseñanza y del Aprendizaje', 4, 'CFD'],
                ['Discurso Especializado en Idioma Inglés', 4, 'CFC'],
                ['Práctica Profesional II', 4, 'ECU', 'UNCO', 8, 8, 6],
                ['Geografía Social y Económica de Venezuela', 5, 'CFPE', 'UNCO', 4, 4, 8, 'Análisis y Organización del Espacio Geográfico'],
                ['Procesos Históricos del Mundo II', 5, 'CFPE', 'UNCO', 4, 4, 8, 'Procesos Históricos del Mundo I'],
                ['Evaluación del Aprendizaje', 5, 'CFD'],
                ['Actividad Física, Deporte y Recreación', 5, 'CFC'],
                ['Investigación III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC III', 5, 'ECU', 'UNCO', 4, 4, 0],
                ['Historia Republicana de Venezuela', 6, 'CFPE', 'UNCO', 4, 4, 8, 'Pensamiento Bolivariano'],
                ['Didáctica de la Geografía y la Historia', 6, 'CFPE', 'UNCO', 4, 4, 8, 'Ecogeografía de Venezuela'],
                ['Gerencia y Legislación', 6, 'CFD'],
                ['Práctica Profesional III', 6, 'ECU', 'UNCO', 8, 8, 6],
                ['Procesos Históricos de América y el Caribe', 7, 'CFPE', 'UNCO', 4, 4, 8, 'Procesos Históricos del Mundo II'],
                ['Geografía Económica y Social del Mundo', 7],
                ['Orientación Educativa y Diversidad', 7, 'CFD'],
                ['Educación Ambiental', 7, 'CFC'],
                ['Investigación IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['TIC IV', 7, 'ECU', 'UNCO', 4, 4, 0],
                ['Práctica Profesional IV', 8, 'ECU', 'UNCO', 8, 8, 6],
            ],
        ];
    }

    /**
     * Unidades curriculares de libre elección (UNCLE).
     *
     * Se siembran aparte del pensum base y su código se genera con la misma
     * regla del formulario, por lo que termina en el sufijo UNCLE.
     *
     * @return array<string, array<int, array{name: string, semester: int, component: string, modality: string, credits: int, theory_hours: int, practice_hours: int}>>
     */
    private function electives(): array
    {
        return [
            'EDPRI' => [
                [
                    'name' => 'Desarrollo Socio Afectivo y Sexualidad',
                    'semester' => 2,
                    'component' => 'CFPE',
                    'modality' => 'online',
                    'credits' => 2,
                    'theory_hours' => 2,
                    'practice_hours' => 4,
                ],
                [
                    'name' => 'Educación Alimentaria y Nutrición',
                    'semester' => 1,
                    'component' => 'CFC',
                    'modality' => 'online',
                    'credits' => 2,
                    'theory_hours' => 2,
                    'practice_hours' => 4,
                ],
            ],
        ];
    }
}
