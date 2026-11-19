<?php

use App\Enums\Role;
use App\Models\BannerSlide;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario con permisos para gestionar las publicaciones del baner.
 */
function bannerManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    return $user;
}

/**
 * @return array<string, mixed>
 */
function bannerPayload(): array
{
    return [
        'tag' => '🎓 Educación que transforma',
        'title_start' => 'Formamos a los',
        'title_highlight' => 'maestros',
        'title_end' => 'que construyen el futuro de Venezuela',
        'description' => 'Más de 40 años formando a los educadores de Venezuela.',
        'visual' => BannerSlide::VISUAL_IMAGEN,
        'primary_label' => 'Explora nuestras carreras',
        'primary_url' => '#carreras',
        'secondary_label' => 'Conoce la UPEL',
        'secondary_url' => '#nosotros',
        'sort_order' => 3,
        'is_active' => true,
    ];
}

test('los invitados son redirigidos al login del administrador', function () {
    $this->get(route('admin.banners.index'))
        ->assertRedirect(route('admin.login'));
});

test('el personal administrativo sin permiso no puede gestionar el baner', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.banners.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.banners.create'))
        ->assertForbidden();
});

test('el administrador puede listar las publicaciones del baner', function () {
    BannerSlide::factory()->create([
        'tag' => '📰 Noticia del día',
        'sort_order' => 2,
    ]);
    BannerSlide::factory()->create([
        'tag' => '🎓 Educación que transforma',
        'sort_order' => 1,
    ]);

    $this->actingAs(bannerManager())
        ->get(route('admin.banners.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/banners/index')
            ->has('banners', 2)
            ->where('banners.0.tag', '🎓 Educación que transforma')
            ->where('banners.0.visual_label', 'Imagen del banner')
            ->where('banners.1.tag', '📰 Noticia del día')
            ->has('stats', 4)
            ->where('can_manage', true)
        );
});

test('el formulario expone la configuración necesaria para la vista previa', function () {
    $this->actingAs(bannerManager())
        ->get(route('admin.banners.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/banners/form')
            ->where('banner', null)
            ->has('visual_options', 2)
        );

    $banner = BannerSlide::factory()->create();

    $this->actingAs(bannerManager())
        ->get(route('admin.banners.edit', $banner))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/banners/form')
            ->where('banner.id', $banner->id)
            ->has('visual_options', 2)
        );
});

test('el administrador puede crear una publicación del baner', function () {
    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), bannerPayload())
        ->assertRedirect(route('admin.banners.index'));

    $this->assertDatabaseHas('banner_slides', [
        'tag' => '🎓 Educación que transforma',
        'title_highlight' => 'maestros',
        'visual' => 'imagen',
        'primary_label' => 'Explora nuestras carreras',
        'primary_url' => '#carreras',
        'sort_order' => 3,
        'is_active' => true,
    ]);
});

test('el administrador puede editar y eliminar una publicación del baner', function () {
    $banner = BannerSlide::factory()->create();

    $this->actingAs(bannerManager())
        ->put(route('admin.banners.update', $banner), [
            ...bannerPayload(),
            'tag' => '🌎 Evento internacional',
            'visual' => BannerSlide::VISUAL_COUNTDOWN,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.banners.index'));

    $banner->refresh();

    expect($banner->tag)->toBe('🌎 Evento internacional')
        ->and($banner->visual)->toBe('countdown')
        ->and($banner->is_active)->toBeFalse();

    $this->actingAs(bannerManager())
        ->delete(route('admin.banners.destroy', $banner))
        ->assertRedirect(route('admin.banners.index'));

    expect(BannerSlide::query()->find($banner->id))->toBeNull();
});

test('se rechazan tarjetas inválidas y enlaces inseguros', function () {
    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'visual' => 'tarjeta-inexistente',
        ])
        ->assertSessionHasErrors('visual');

    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'primary_url' => 'javascript:alert(1)',
        ])
        ->assertSessionHasErrors('primary_url');

    expect(BannerSlide::query()->where('tag', '🎓 Educación que transforma')->exists())->toBeFalse();
});

test('la landing publica solo las diapositivas activas en el orden indicado', function () {
    BannerSlide::factory()->create([
        'tag' => '📰 Noticia del día',
        'visual' => BannerSlide::VISUAL_IMAGEN,
        'sort_order' => 2,
    ]);
    BannerSlide::factory()->create([
        'tag' => '🎓 Educación que transforma',
        'visual' => BannerSlide::VISUAL_IMAGEN,
        'sort_order' => 1,
    ]);
    BannerSlide::factory()->create([
        'tag' => '💻 Comunidad UPEL',
        'visual' => BannerSlide::VISUAL_COUNTDOWN,
        'sort_order' => 3,
        'is_active' => false,
    ]);

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('heroSlides', 2)
            ->where('heroSlides.0.tag', '🎓 Educación que transforma')
            ->where('heroSlides.0.visual', 'imagen')
            ->where('heroSlides.1.tag', '📰 Noticia del día')
            ->where('heroSlides.1.visual', 'imagen')
            ->has('admissionWindow.opens_at')
        );
});

test('la landing mantiene sus diapositivas de respaldo si no hay publicaciones', function () {
    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('heroSlides', 0)
        );
});

test('el administrador puede subir, reemplazar y quitar la imagen del baner', function () {
    Storage::fake('public');

    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'image' => UploadedFile::fake()->image('banner.jpg'),
        ])
        ->assertRedirect(route('admin.banners.index'));

    $banner = BannerSlide::query()->firstOrFail();
    $firstPath = $banner->image_path;

    expect($firstPath)->not->toBeNull()
        ->and($banner->imageUrl())->toContain('/storage/banners/');
    Storage::disk('public')->assertExists($firstPath);

    $this->actingAs(bannerManager())
        ->put(route('admin.banners.update', $banner), [
            ...bannerPayload(),
            'image' => UploadedFile::fake()->image('nuevo.png'),
        ])
        ->assertRedirect(route('admin.banners.index'));

    $banner->refresh();

    expect($banner->image_path)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($banner->image_path);

    $secondPath = $banner->image_path;

    $this->actingAs(bannerManager())
        ->put(route('admin.banners.update', $banner), [
            ...bannerPayload(),
            'remove_image' => true,
        ])
        ->assertRedirect(route('admin.banners.index'));

    $banner->refresh();

    expect($banner->image_path)->toBeNull();
    Storage::disk('public')->assertMissing($secondPath);
});

test('se rechaza una imagen inválida en el baner', function () {
    Storage::fake('public');

    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'image' => UploadedFile::fake()->create('banner.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('image');

    expect(BannerSlide::query()->count())->toBe(0);
});

test('la cuenta regresiva guarda la fecha elegida y se publica en la landing', function () {
    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'visual' => BannerSlide::VISUAL_COUNTDOWN,
            'countdown_at' => '2026-11-20T08:00',
            'countdown_label' => 'Apertura de inscripciones',
        ])
        ->assertRedirect(route('admin.banners.index'));

    $banner = BannerSlide::query()->firstOrFail();

    expect($banner->visual)->toBe('countdown')
        ->and($banner->countdown_at)->toBe('2026-11-20T08:00:00-04:00')
        ->and($banner->countdown_label)->toBe('Apertura de inscripciones');

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('heroSlides.0.visual', 'countdown')
            ->where('heroSlides.0.countdown_at', '2026-11-20T08:00:00-04:00')
            ->where('heroSlides.0.countdown_label', 'Apertura de inscripciones')
        );
});

test('se rechaza una fecha de cuenta regresiva inválida', function () {
    $this->actingAs(bannerManager())
        ->post(route('admin.banners.store'), [
            ...bannerPayload(),
            'visual' => BannerSlide::VISUAL_COUNTDOWN,
            'countdown_at' => 'no-es-una-fecha',
        ])
        ->assertSessionHasErrors('countdown_at');
});
