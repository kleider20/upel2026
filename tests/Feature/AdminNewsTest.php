<?php

use App\Enums\Role;
use App\Models\NewsPost;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario con permisos para gestionar las noticias de la landing.
 */
function newsManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    return $user;
}

/**
 * @return array<string, mixed>
 */
function newsPayload(): array
{
    return [
        'category' => 'Académico',
        'date' => '2026-10-20',
        'title' => 'UPEL amplía su oferta de carreras 100% online para 2027',
        'excerpt' => 'Cinco nuevos programas de pregrado se suman al campus virtual.',
        'icon' => NewsPost::ICON_LAPTOP,
        'link_url' => '#noticias',
        'sort_order' => 2,
        'is_active' => true,
    ];
}

test('los invitados son redirigidos al login del administrador', function () {
    $this->get(route('admin.news.index'))
        ->assertRedirect(route('admin.login'));
});

test('el personal sin permiso no puede gestionar las noticias', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.news.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.news.create'))
        ->assertForbidden();
});

test('el administrador puede listar las noticias', function () {
    NewsPost::factory()->create([
        'category' => 'Internacional',
        'sort_order' => 2,
    ]);
    NewsPost::factory()->create([
        'category' => 'Académico',
        'sort_order' => 1,
    ]);

    $this->actingAs(newsManager())
        ->get(route('admin.news.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/news/index')
            ->has('posts', 2)
            ->where('posts.0.category', 'Académico')
            ->where('posts.0.icon_label', 'Tecnología')
            ->where('posts.1.category', 'Internacional')
            ->has('stats', 4)
            ->where('can_manage', true)
        );
});

test('el administrador puede crear, editar y eliminar una noticia', function () {
    $this->actingAs(newsManager())
        ->post(route('admin.news.store'), newsPayload())
        ->assertRedirect(route('admin.news.index'));

    $this->assertDatabaseHas('news_posts', [
        'category' => 'Académico',
        'title' => 'UPEL amplía su oferta de carreras 100% online para 2027',
        'icon' => 'laptop',
        'link_url' => '#noticias',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    $post = NewsPost::query()->where('title', newsPayload()['title'])->firstOrFail();

    $this->actingAs(newsManager())
        ->put(route('admin.news.update', $post), [
            ...newsPayload(),
            'category' => 'Graduación',
            'icon' => NewsPost::ICON_GRADUATION,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.news.index'));

    $post->refresh();

    expect($post->category)->toBe('Graduación')
        ->and($post->icon)->toBe('graduation')
        ->and($post->is_active)->toBeFalse();

    $this->actingAs(newsManager())
        ->delete(route('admin.news.destroy', $post))
        ->assertRedirect(route('admin.news.index'));

    expect(NewsPost::query()->find($post->id))->toBeNull();
});

test('se rechazan ilustraciones inválidas y enlaces inseguros', function () {
    $this->actingAs(newsManager())
        ->post(route('admin.news.store'), [
            ...newsPayload(),
            'icon' => 'sin-ilustracion',
        ])
        ->assertSessionHasErrors('icon');

    $this->actingAs(newsManager())
        ->post(route('admin.news.store'), [
            ...newsPayload(),
            'link_url' => 'javascript:alert(1)',
        ])
        ->assertSessionHasErrors('link_url');

    expect(NewsPost::query()->where('title', newsPayload()['title'])->exists())->toBeFalse();
});

test('la landing publica solo las noticias activas en el orden indicado', function () {
    NewsPost::factory()->create([
        'title' => 'Segunda noticia',
        'icon' => NewsPost::ICON_GLOBE,
        'sort_order' => 2,
    ]);
    NewsPost::factory()->create([
        'title' => 'Primera noticia',
        'icon' => NewsPost::ICON_LAPTOP,
        'sort_order' => 1,
    ]);
    NewsPost::factory()->create([
        'title' => 'Borrador',
        'sort_order' => 3,
        'is_active' => false,
    ]);

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('newsPosts', 2)
            ->where('newsPosts.0.title', 'Primera noticia')
            ->where('newsPosts.0.icon', 'laptop')
            ->where('newsPosts.1.title', 'Segunda noticia')
            ->where('newsPosts.1.icon', 'globe')
        );
});

test('la landing mantiene sus noticias de respaldo si no hay publicaciones', function () {
    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('newsPosts', 0)
        );
});
