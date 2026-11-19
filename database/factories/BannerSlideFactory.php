<?php

namespace Database\Factories;

use App\Models\BannerSlide;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BannerSlide>
 */
class BannerSlideFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tag' => '🎓 Educación que transforma',
            'title_start' => 'Formamos a los',
            'title_highlight' => 'maestros',
            'title_end' => 'que construyen el futuro de Venezuela',
            'description' => fake()->sentence(16),
            'visual' => BannerSlide::VISUAL_IMAGEN,
            'countdown_at' => null,
            'countdown_label' => null,
            'primary_label' => null,
            'primary_url' => null,
            'secondary_label' => null,
            'secondary_url' => null,
            'sort_order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
