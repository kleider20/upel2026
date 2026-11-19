<?php

namespace Database\Seeders;

use App\Models\BannerSlide;
use Illuminate\Database\Seeder;

/**
 * Publicaciones iniciales del baner de la landing.
 *
 * Usa firstOrCreate para no sobrescribir las ediciones que el administrador
 * haya hecho desde el panel.
 */
class BannerSlideSeeder extends Seeder
{
    /**
     * @return array<int, array<string, mixed>>
     */
    private function slides(): array
    {
        return [
            [
                'tag' => '🎓 Educación que transforma',
                'title_start' => 'Formamos a los',
                'title_highlight' => 'maestros',
                'title_end' => 'que construyen el futuro de Venezuela',
                'description' => 'Más de 40 años de excelencia académica, investigación pedagógica y compromiso con la educación pública, ahora también en modalidad 100% online.',
                'visual' => BannerSlide::VISUAL_IMAGEN,
                'sort_order' => 1,
            ],
            [
                'tag' => '📰 Noticia del día',
                'title_start' => 'La UPEL amplía su oferta',
                'title_highlight' => '100% online',
                'title_end' => 'para el año 2027',
                'description' => 'Cinco nuevas carreras de pregrado se suman al Campus Virtual, con acompañamiento docente, prácticas supervisadas y acceso desde cualquier lugar del país.',
                'visual' => BannerSlide::VISUAL_IMAGEN,
                'sort_order' => 2,
            ],
            [
                'tag' => '🌎 Evento internacional',
                'title_start' => 'Congreso Internacional de',
                'title_highlight' => 'Pedagogía',
                'title_end' => '2026',
                'description' => 'Del 18 al 20 de noviembre, más de 40 países se reunirán en Caracas para compartir investigaciones sobre inclusión, tecnología y ciudadanía global.',
                'visual' => BannerSlide::VISUAL_IMAGEN,
                'sort_order' => 3,
            ],
            [
                'tag' => '📝 Nuevo ingreso',
                'title_start' => 'Preinscripciones',
                'title_highlight' => '2027',
                'title_end' => 'abren el 2 de noviembre',
                'description' => 'Prepara tus documentos y asegura tu cupo en la universidad de los educadores. El proceso será 100% en línea desde el portal de admisión.',
                'visual' => BannerSlide::VISUAL_COUNTDOWN,
                'countdown_at' => '2026-11-20T08:00:00-04:00',
                'countdown_label' => 'Apertura de preinscripciones',
                'sort_order' => 4,
            ],
            [
                'tag' => '💻 Comunidad UPEL',
                'title_start' => 'Tu',
                'title_highlight' => 'portal estudiantil',
                'title_end' => 'en un solo lugar',
                'description' => 'Consulta tus materias, notas, récord académico y servicios en línea. Los estudiantes regulares podrán inscribirse a partir del 12 de enero de 2027.',
                'visual' => BannerSlide::VISUAL_COUNTDOWN,
                'countdown_at' => '2027-01-12T08:00:00-04:00',
                'countdown_label' => 'Apertura de inscripciones',
                'sort_order' => 5,
            ],
        ];
    }

    public function run(): void
    {
        foreach ($this->slides() as $slide) {
            BannerSlide::query()->firstOrCreate(
                ['tag' => $slide['tag']],
                $slide,
            );
        }
    }
}
