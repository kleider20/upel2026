<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\BannerRequest;
use App\Models\BannerSlide;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminBannerController extends Controller
{
    /**
     * Listado de las publicaciones del baner principal.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $slides = BannerSlide::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(static fn (BannerSlide $slide): array => [
                'id' => $slide->id,
                'tag' => $slide->tag,
                'title_start' => $slide->title_start,
                'title_highlight' => $slide->title_highlight,
                'title_end' => $slide->title_end,
                'description' => $slide->description,
                'visual' => $slide->visual,
                'visual_label' => $slide->visualLabel(),
                'primary_label' => $slide->primary_label,
                'primary_url' => $slide->primary_url,
                'secondary_label' => $slide->secondary_label,
                'secondary_url' => $slide->secondary_url,
                'sort_order' => $slide->sort_order,
                'is_active' => $slide->is_active,
                'edit_url' => route('admin.banners.edit', $slide),
                'delete_url' => route('admin.banners.destroy', $slide),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/banners/index', [
            'banners' => $slides,
            'stats' => [
                ['label' => 'Publicaciones', 'value' => (string) count($slides), 'tone' => 'blue'],
                ['label' => 'Activas', 'value' => (string) collect($slides)->where('is_active', true)->count(), 'tone' => 'green'],
                ['label' => 'Inactivas', 'value' => (string) collect($slides)->where('is_active', false)->count(), 'tone' => 'slate'],
                ['label' => 'Tarjetas', 'value' => (string) count(BannerSlide::visualOptions()), 'tone' => 'gold'],
            ],
            'can_manage' => $request->user()?->can(Permission::BannersManage->value) ?? false,
        ]);
    }

    /**
     * Formulario de creación de una publicación.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/banners/form', [
            'banner' => null,
            'visual_options' => $this->visualOptions(),
        ]);
    }

    /**
     * Registra una nueva publicación del baner.
     */
    public function store(BannerRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $image = $request->file('image');
        unset($data['image'], $data['remove_image']);

        if ($image !== null) {
            $data['image_path'] = $image->store('banners', 'public');
        }

        BannerSlide::query()->create($data);

        return redirect()
            ->route('admin.banners.index')
            ->with('success', 'La publicación del baner fue creada correctamente.');
    }

    /**
     * Formulario de edición de una publicación.
     */
    public function edit(Request $request, BannerSlide $banner): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/banners/form', [
            'banner' => [
                'id' => $banner->id,
                'tag' => $banner->tag,
                'title_start' => $banner->title_start,
                'title_highlight' => $banner->title_highlight,
                'title_end' => $banner->title_end,
                'description' => $banner->description,
                'visual' => $banner->visual,
                'image_url' => $banner->imageUrl(),
                'countdown_at' => $banner->countdown_at,
                'countdown_label' => $banner->countdown_label,
                'primary_label' => $banner->primary_label,
                'primary_url' => $banner->primary_url,
                'secondary_label' => $banner->secondary_label,
                'secondary_url' => $banner->secondary_url,
                'sort_order' => $banner->sort_order,
                'is_active' => $banner->is_active,
            ],
            'visual_options' => $this->visualOptions(),
        ]);
    }

    /**
     * Actualiza una publicación del baner.
     */
    public function update(BannerRequest $request, BannerSlide $banner): RedirectResponse
    {
        $data = $request->validated();
        $image = $request->file('image');
        $removeImage = $request->boolean('remove_image');
        unset($data['image'], $data['remove_image']);

        if ($image !== null) {
            $this->deleteImage($banner->image_path);
            $data['image_path'] = $image->store('banners', 'public');
        } elseif ($removeImage) {
            $this->deleteImage($banner->image_path);
            $data['image_path'] = null;
        }

        $banner->update($data);

        return redirect()
            ->route('admin.banners.index')
            ->with('success', 'La publicación del baner fue actualizada correctamente.');
    }

    /**
     * Elimina una publicación del baner.
     */
    public function destroy(Request $request, BannerSlide $banner): RedirectResponse
    {
        $this->authorizeManage($request);

        $this->deleteImage($banner->image_path);
        $banner->delete();

        return redirect()
            ->route('admin.banners.index')
            ->with('success', 'La publicación del baner fue eliminada correctamente.');
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::BannersView->value),
            403,
            'No tienes permiso para ver las publicaciones del baner.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::BannersManage->value),
            403,
            'No tienes permiso para gestionar las publicaciones del baner.',
        );
    }

    /**
     * Elimina del disco público la imagen anterior de una diapositiva.
     */
    private function deleteImage(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function visualOptions(): array
    {
        return collect(BannerSlide::visualOptions())
            ->map(static fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }
}
