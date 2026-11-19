<?php

namespace Database\Factories;

use App\Models\NewsPost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsPost>
 */
class NewsPostFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category' => 'Académico',
            'date' => fake()->date(),
            'title' => fake()->sentence(8),
            'excerpt' => fake()->sentence(16),
            'icon' => NewsPost::ICON_LAPTOP,
            'link_url' => null,
            'sort_order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
