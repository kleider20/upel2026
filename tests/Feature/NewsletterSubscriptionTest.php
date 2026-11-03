<?php

use App\Models\NewsletterSubscriber;

test('un visitante puede suscribirse al boletín', function () {
    $response = $this->from(route('landing'))->post(route('newsletter.store'), [
        'email' => 'Docente@UPEL.edu.ve',
    ]);

    $response
        ->assertRedirect(route('landing'))
        ->assertSessionHas('success');

    expect(NewsletterSubscriber::sole()->email)->toBe('docente@upel.edu.ve');
});

test('el correo debe ser válido para suscribirse', function () {
    $response = $this->from(route('landing'))->post(route('newsletter.store'), [
        'email' => 'no-es-un-correo',
    ]);

    $response->assertRedirect(route('landing'))->assertSessionHasErrors('email');
    expect(NewsletterSubscriber::count())->toBe(0);
});

test('un correo no puede suscribirse dos veces', function () {
    NewsletterSubscriber::create(['email' => 'docente@upel.edu.ve']);

    $response = $this->from(route('landing'))->post(route('newsletter.store'), [
        'email' => 'docente@upel.edu.ve',
    ]);

    $response->assertRedirect(route('landing'))->assertSessionHasErrors('email');
    expect(NewsletterSubscriber::count())->toBe(1);
});
