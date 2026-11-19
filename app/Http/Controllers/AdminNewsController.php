<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\NewsPostRequest;
use App\Models\NewsPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminNewsController extends Controller
{
    /**
     * Listado de las noticias publicadas en la landing.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $posts = NewsPost::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(static fn (NewsPost $post): array => [
                'id' => $post->id,
                'category' => $post->category,
                'date' => $post->date->toDateString(),
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'icon' => $post->icon,
                'icon_label' => $post->iconLabel(),
                'link_url' => $post->link_url,
                'sort_order' => $post->sort_order,
                'is_active' => $post->is_active,
                'edit_url' => route('admin.news.edit', $post),
                'delete_url' => route('admin.news.destroy', $post),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/news/index', [
            'posts' => $posts,
            'stats' => [
                ['label' => 'Noticias', 'value' => (string) count($posts), 'tone' => 'blue'],
                ['label' => 'Publicadas', 'value' => (string) collect($posts)->where('is_active', true)->count(), 'tone' => 'green'],
                ['label' => 'Borradores', 'value' => (string) collect($posts)->where('is_active', false)->count(), 'tone' => 'slate'],
                ['label' => 'Categorías', 'value' => (string) collect($posts)->pluck('category')->unique()->count(), 'tone' => 'gold'],
            ],
            'can_manage' => $request->user()?->can(Permission::NewsManage->value) ?? false,
        ]);
    }

    /**
     * Formulario de creación de una noticia.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/news/form', [
            'post' => null,
            'icon_options' => $this->iconOptions(),
        ]);
    }

    /**
     * Registra una nueva noticia.
     */
    public function store(NewsPostRequest $request): RedirectResponse
    {
        NewsPost::query()->create($request->validated());

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'La noticia fue publicada correctamente.');
    }

    /**
     * Formulario de edición de una noticia.
     */
    public function edit(Request $request, NewsPost $newsPost): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/news/form', [
            'post' => [
                'id' => $newsPost->id,
                'category' => $newsPost->category,
                'date' => $newsPost->date->toDateString(),
                'title' => $newsPost->title,
                'excerpt' => $newsPost->excerpt,
                'icon' => $newsPost->icon,
                'link_url' => $newsPost->link_url,
                'sort_order' => $newsPost->sort_order,
                'is_active' => $newsPost->is_active,
            ],
            'icon_options' => $this->iconOptions(),
        ]);
    }

    /**
     * Actualiza una noticia.
     */
    public function update(NewsPostRequest $request, NewsPost $newsPost): RedirectResponse
    {
        $newsPost->update($request->validated());

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'La noticia fue actualizada correctamente.');
    }

    /**
     * Elimina una noticia.
     */
    public function destroy(Request $request, NewsPost $newsPost): RedirectResponse
    {
        $this->authorizeManage($request);

        $newsPost->delete();

        return redirect()
            ->route('admin.news.index')
            ->with('success', 'La noticia fue eliminada correctamente.');
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::NewsView->value),
            403,
            'No tienes permiso para ver las noticias.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::NewsManage->value),
            403,
            'No tienes permiso para gestionar las noticias.',
        );
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function iconOptions(): array
    {
        return collect(NewsPost::iconOptions())
            ->map(static fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }
}
