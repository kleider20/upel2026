<?php

namespace Database\Seeders;

use App\Models\NewsPost;
use Illuminate\Database\Seeder;

/**
 * Noticias originales de la landing, respetando las ediciones del panel.
 */
class NewsPostSeeder extends Seeder
{
    /**
     * @return array<int, array<string, mixed>>
     */
    private function posts(): array
    {
        return [
            [
                'category' => 'Académico',
                'date' => '2026-10-20',
                'title' => 'UPEL amplía su oferta de carreras 100% online para 2027',
                'excerpt' => 'Cinco nuevos programas de pregrado se suman al campus virtual, con acompañamiento docente y prácticas en entornos digitales.',
                'icon' => NewsPost::ICON_LAPTOP,
                'sort_order' => 1,
            ],
            [
                'category' => 'Graduación',
                'date' => '2026-10-15',
                'title' => 'Acto de grado: 1.200 nuevos licenciados en educación',
                'excerpt' => 'La promoción “Maestros que transforman” celebró su graduación en el auditorio principal de la sede Caracas.',
                'icon' => NewsPost::ICON_GRADUATION,
                'sort_order' => 2,
            ],
            [
                'category' => 'Internacional',
                'date' => '2026-10-08',
                'title' => 'Congreso Internacional de Pedagogía reunirá a 40 países',
                'excerpt' => 'Investigadores y docentes compartirán experiencias sobre inclusión, tecnología y ciudadanía global.',
                'icon' => NewsPost::ICON_GLOBE,
                'sort_order' => 3,
            ],
            [
                'category' => 'Investigación',
                'date' => '2026-09-29',
                'title' => 'Estudiantes UPEL ganan premio nacional de investigación',
                'excerpt' => 'El proyecto sobre lectura crítica en zonas rurales recibió el reconocimiento del Ministerio de Educación.',
                'icon' => NewsPost::ICON_TROPHY,
                'sort_order' => 4,
            ],
            [
                'category' => 'Alianzas',
                'date' => '2026-09-18',
                'title' => 'Nueva alianza con universidades de Latinoamérica',
                'excerpt' => 'El convenio permitirá movilidad estudiantil, pasantías internacionales y proyectos de investigación conjuntos.',
                'icon' => NewsPost::ICON_HANDSHAKE,
                'sort_order' => 5,
            ],
            [
                'category' => 'Extensión',
                'date' => '2026-09-05',
                'title' => 'Inscripciones abiertas para talleres virtuales de octubre',
                'excerpt' => 'Oratoria, neuroeducación e inteligencia artificial son algunas de las propuestas de formación continua.',
                'icon' => NewsPost::ICON_CALENDAR,
                'sort_order' => 6,
            ],
        ];
    }

    public function run(): void
    {
        foreach ($this->posts() as $post) {
            NewsPost::query()->firstOrCreate(
                ['title' => $post['title']],
                $post,
            );
        }
    }
}
