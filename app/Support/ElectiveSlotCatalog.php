<?php

namespace App\Support;

/**
 * Bloques de unidades curriculares de libre elección (UNCLE) del pensum base.
 *
 * El plan curricular oficial reserva un bloque por cada unidad de libre
 * elección que se ofertará en un período académico. El bloque es un marcador
 * de posición: conserva los créditos y horas del plan y se sustituye por la
 * materia concreta cuando la coordinación la incorpora al horario del
 * estudiante.
 */
final class ElectiveSlotCatalog
{
    /**
     * Bloques de libre elección de Educación Primaria.
     *
     * @var array<int, array{semester: int, component: string, code: string, name: string, credits: int, theory_hours: int, practice_hours: int}>
     */
    private const EDPRI = [
        [
            'semester' => 1,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-101',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 2,
            'component' => 'CFPE',
            'code' => 'EDPRI-UNCLE-201',
            'name' => 'Uncle Del Componente De Formación Profesional Específico',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 3,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-301',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 4,
            'component' => 'CFPE',
            'code' => 'EDPRI-UNCLE-401',
            'name' => 'Uncle Del Componente De Formación Profesional Específico',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 5,
            'component' => 'CFD',
            'code' => 'EDPRI-UNCLE-501',
            'name' => 'Uncle Del Componente De Formación Docente',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 6,
            'component' => 'CFPE',
            'code' => 'EDPRI-UNCLE-601',
            'name' => 'Uncle Del Componente De Formación Profesional Específico',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 6,
            'component' => 'CFD',
            'code' => 'EDPRI-UNCLE-602',
            'name' => 'Uncle Del Componente De Formación Docente',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 6,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-603',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 7,
            'component' => 'CFD',
            'code' => 'EDPRI-UNCLE-701',
            'name' => 'Uncle Del Componente De Formación Docente',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
        ],
        [
            'semester' => 8,
            'component' => 'CFPE',
            'code' => 'EDPRI-UNCLE-801',
            'name' => 'Uncle Del Componente De Formación Profesional Específico',
            'credits' => 3,
            'theory_hours' => 3,
            'practice_hours' => 6,
        ],
        [
            'semester' => 8,
            'component' => 'CFD',
            'code' => 'EDPRI-UNCLE-802',
            'name' => 'Uncle Del Componente De Formación Docente',
            'credits' => 3,
            'theory_hours' => 3,
            'practice_hours' => 6,
        ],
        [
            'semester' => 8,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-803',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 3,
            'theory_hours' => 3,
            'practice_hours' => 6,
        ],
        [
            'semester' => 8,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-804',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 3,
            'theory_hours' => 3,
            'practice_hours' => 6,
        ],
        [
            'semester' => 8,
            'component' => 'CFC',
            'code' => 'EDPRI-UNCLE-805',
            'name' => 'Uncle Del Componente De Formación Contextualizada',
            'credits' => 3,
            'theory_hours' => 3,
            'practice_hours' => 6,
        ],
    ];

    /**
     * Bloques de libre elección de una carrera.
     *
     * @return array<int, array{semester: int, component: string, code: string, name: string, credits: int, theory_hours: int, practice_hours: int}>
     */
    public static function forCareer(string $careerCode): array
    {
        return match ($careerCode) {
            'EDPRI' => self::EDPRI,
            default => [],
        };
    }

    /**
     * Atributos del bloque para la tabla de materias.
     *
     * @param  array{semester: int, component: string, code: string, name: string, credits: int, theory_hours: int, practice_hours: int}  $slot
     * @return array<string, mixed>
     */
    public static function attributes(array $slot): array
    {
        return [
            'name' => $slot['name'],
            'semester' => $slot['semester'],
            'modality' => $slot['component'] === 'CFC' ? 'mixta' : 'presencial',
            'component' => $slot['component'],
            'type' => SubjectCode::ELECTIVE_TYPE,
            'area' => $slot['component'],
            'level' => match (true) {
                $slot['semester'] <= 2 => 'FUND',
                $slot['semester'] <= 4 => 'INTEG',
                default => 'PROF',
            },
            'credits' => $slot['credits'],
            'theory_hours' => $slot['theory_hours'],
            'practice_hours' => $slot['practice_hours'],
            'prerequisites' => null,
            'is_elective_slot' => true,
            'is_active' => true,
        ];
    }
}
