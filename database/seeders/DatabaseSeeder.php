<?php

namespace Database\Seeders;

use Database\Seeders\Users\Professors\AmadaPrimSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            AcademicSeeder::class,
            BannerSlideSeeder::class,
            NewsPostSeeder::class,
            ClassroomSeeder::class,
            AdminSeeder::class,
            EstudiantesDemoSeeder::class,
            AmadaPrimSeeder::class,
            PensumSeeder::class,
            HighSchoolSeeder::class,
            DemoUserSeeder::class,
            DemoProfessorSeeder::class,
            AdmissionSeeder::class,
            TicStudentsSeeder::class,
        ]);
    }
}
