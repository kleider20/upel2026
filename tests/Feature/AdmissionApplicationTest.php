<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Mail\AdmissionReceived;
use App\Models\Admission;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\HighSchool;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Carrera con una oferta activa lista para la preinscripción.
 *
 * @param  array<string, mixed>  $attributes
 */
function offeredCareer(array $attributes = []): Career
{
    $career = Career::factory()->create($attributes);

    CareerOffering::factory()->create([
        'career_id' => $career->id,
        'modality' => 'mixta',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
        'is_active' => true,
    ]);

    return $career;
}

/**
 * Datos válidos para el formulario público de preinscripción.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validAdmissionPayload(Career $career, array $overrides = []): array
{
    return array_merge([
        'first_name' => 'María Fernanda',
        'last_name' => 'Rodríguez Pérez',
        'nationality' => 'V',
        'id_number' => '18765432',
        'birth_date' => '2004-03-14',
        'gender' => 'femenino',
        'email' => 'maria.rodriguez@example.com',
        'phone' => '0414 1234567',
        'address' => 'Caracas, Municipio Libertador.',
        'career_id' => $career->id,
        'modality' => 'mixta',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
        'high_school' => 'Unidad Educativa Nacional Andrés Bello',
        'high_school_year' => 2022,
        'high_school_average' => 18.45,
        'terms' => true,
    ], $overrides);
}

test('la preinscripción se muestra cerrada antes del 2 de noviembre', function () {
    $this->travelTo(Carbon::parse('2026-10-24T12:00:00-04:00'));

    $this->get(route('admissions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/closed')
            ->where('periodYear', 2027)
            ->where('remainingDays', 9)
        );
});

test('la preinscripción se habilita a partir del 2 de noviembre', function () {
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));
    offeredCareer();
    HighSchool::factory()->create(['name' => 'Liceo Fermín Toro']);
    HighSchool::factory()->create(['name' => 'Liceo Andrés Bello']);

    $this->get(route('admissions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/apply')
            ->where('periodYear', 2027)
            ->has('careers', 1)
            ->has('documentTypes', 4)
            ->has('highSchools', 2)
            ->where('highSchools.0', 'Liceo Andrés Bello')
            ->where('highSchools.1', 'Liceo Fermín Toro')
        );
});

test('solo se muestran las carreras activas con ofertas activas', function () {
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $offered = offeredCareer(['name' => 'Carrera Ofertada']);
    offeredCareer(['name' => 'Carrera Inactiva', 'is_active' => false]);
    Career::factory()->create(['name' => 'Carrera Sin Ofertas']);

    $inactiveOffering = Career::factory()->create(['name' => 'Carrera con Oferta Inactiva']);
    CareerOffering::factory()->create([
        'career_id' => $inactiveOffering->id,
        'modality' => 'mixta',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
        'is_active' => false,
    ]);

    CareerOffering::factory()->create([
        'career_id' => $offered->id,
        'modality' => 'online',
        'schedule' => 'sabatino',
        'shift' => 'diurno',
        'is_active' => false,
    ]);

    $this->get(route('admissions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/apply')
            ->has('careers', 1)
            ->where('careers.0.name', 'Carrera Ofertada')
            ->has('careers.0.offerings', 1)
            ->where('careers.0.offerings.0.modality', 'mixta')
            ->where('careers.0.offerings.0.schedule', 'lunes_viernes')
            ->where('careers.0.offerings.0.shift', 'diurno')
        );
});

test('un aspirante puede registrar su solicitud y recibe su código', function () {
    Mail::fake();
    Storage::fake('local');
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $response = $this->post(
        route('admissions.store'),
        validAdmissionPayload($career),
    );

    $admission = Admission::query()->firstOrFail();

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($response->headers->get('Location'))
        ->toContain('/preinscripcion/solicitud/'.$admission->code)
        ->toContain('signature=');

    expect($admission->code)->toMatch('/^ASP-2027-\d{6}$/')
        ->and($admission->status)->toBe(AdmissionStatus::Recibida->value)
        ->and($admission->period_year)->toBe(2027)
        ->and($admission->submitted_at)->not->toBeNull()
        ->and($admission->statusHistories()->count())->toBe(1);

    Storage::disk('local')->assertExists('admissions/18765432');
    Mail::assertQueued(AdmissionReceived::class);
});

test('el plantel escrito se guarda en el catálogo al enviar la solicitud', function () {
    Mail::fake();
    Storage::fake('local');
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'high_school' => 'Unidad Educativa Nueva Esperanza',
    ]))->assertSessionHasNoErrors();

    expect(HighSchool::query()->where('name', 'Unidad Educativa Nueva Esperanza')->exists())
        ->toBeTrue();
});

test('el plantel existente no se duplica al enviar la solicitud', function () {
    Mail::fake();
    Storage::fake('local');
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    HighSchool::factory()->create(['name' => 'Liceo Andrés Bello']);

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'high_school' => 'Liceo Andrés Bello',
    ]))->assertSessionHasNoErrors();

    expect(HighSchool::query()->where('name', 'Liceo Andrés Bello')->count())
        ->toBe(1);
});

test('no se puede registrar una solicitud fuera de la ventana', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-10-24T12:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career))
        ->assertForbidden();

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('la cédula no puede repetirse en la misma convocatoria', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    $payload = validAdmissionPayload($career);

    $this->post(route('admissions.store'), $payload)
        ->assertSessionHasNoErrors();

    $this->post(route('admissions.store'), [
        ...$payload,
        'email' => 'otro.aspirante@example.com',
    ])->assertSessionHasErrors('id_number');
});

test('el correo no puede repetirse en una solicitud de la misma convocatoria', function () {
    Mail::fake();
    Storage::fake('local');
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    $payload = validAdmissionPayload($career);

    $this->post(route('admissions.store'), $payload)
        ->assertSessionHasNoErrors();

    $this->post(route('admissions.store'), [
        ...$payload,
        'id_number' => '19876543',
    ])->assertSessionHasErrors([
        'email' => 'Ya existe una cuenta o solicitud asociada a este correo.',
    ]);

    expect(Admission::query()->count())->toBe(1);
});

test('no se puede preinscribir con la cédula o el correo de un estudiante existente', function () {
    Mail::fake();
    Storage::fake('local');
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    $student = User::factory()->create(['email' => 'estudiante@example.com']);
    Admission::factory()->create([
        'period_year' => 2026,
        'id_number' => '18765432',
        'email' => $student->email,
        'converted_user_id' => $student->id,
        'status' => AdmissionStatus::Convertida->value,
    ]);

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'id_number' => '18.765.432',
        'email' => 'ESTUDIANTE@example.com',
    ]))->assertSessionHasErrors([
        'id_number' => 'Ya existe una solicitud o un estudiante registrado con esta cédula.',
        'email' => 'Ya existe una cuenta o solicitud asociada a este correo.',
    ]);

    expect(Admission::query()->count())->toBe(1);
});

test('la preinscripción rechaza cédulas y correos de solicitudes de convocatorias anteriores', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    Admission::factory()->create([
        'period_year' => 2026,
        'id_number' => '18765432',
        'email' => 'aspirante.anterior@example.com',
    ]);

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'id_number' => '18.765.432',
        'email' => 'ASPIRANTE.ANTERIOR@example.com',
    ]))->assertSessionHasErrors([
        'id_number' => 'Ya existe una solicitud o un estudiante registrado con esta cédula.',
        'email' => 'Ya existe una cuenta o solicitud asociada a este correo.',
    ]);

    expect(Admission::query()->count())->toBe(1);
    Mail::assertNothingQueued();
});

test('la preinscripción rechaza el correo personal de un estudiante existente', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();
    StudentProfile::factory()
        ->for(User::factory()->create(['email' => 'estudiante.usuario@example.com']))
        ->create(['personal_email' => 'estudiante.personal@example.com']);

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'email' => 'ESTUDIANTE.PERSONAL@example.com',
    ]))->assertSessionHasErrors([
        'email' => 'Ya existe una cuenta o solicitud asociada a este correo.',
    ]);

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('la validación previa rechaza cédulas y correos duplicados antes de enviar la solicitud', function () {
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));
    Admission::factory()->create([
        'period_year' => 2026,
        'id_number' => '18765432',
        'email' => 'aspirante.anterior@example.com',
    ]);

    $this->postJson(route('admissions.identity'), [
        'id_number' => '18.765.432',
        'email' => 'ASPIRANTE.ANTERIOR@example.com',
    ])
        ->assertUnprocessable()
        ->assertJsonPath(
            'errors.id_number.0',
            'Ya existe una solicitud o un estudiante registrado con esta cédula.',
        )
        ->assertJsonPath(
            'errors.email.0',
            'Ya existe una cuenta o solicitud asociada a este correo.',
        );
});

test('la validación previa permite una identidad disponible sin crear una solicitud', function () {
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $this->postJson(route('admissions.identity'), [
        'id_number' => '18765432',
        'email' => 'nueva.aspirante@example.com',
    ])->assertOk()
        ->assertExactJson([]);

    expect(Admission::query()->count())->toBe(0);
});

test('un aspirante menor de 15 años no puede preinscribirse', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'birth_date' => now()->subYears(14)->toDateString(),
    ]))->assertSessionHasErrors('birth_date');
});

test('no se puede elegir una modalidad que la carrera no oferta', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'modality' => 'online',
    ]))->assertSessionHasErrors('modality');

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('no se puede elegir un horario que la carrera no oferta', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'schedule' => 'sabatino',
    ]))->assertSessionHasErrors('schedule');

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('no se puede elegir un turno que la carrera no oferta', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = offeredCareer();

    $this->post(route('admissions.store'), validAdmissionPayload($career, [
        'shift' => 'nocturno',
    ]))->assertSessionHasErrors('shift');

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('no se puede preinscribir en una carrera sin ofertas activas', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $career = Career::factory()->create();

    $this->post(route('admissions.store'), validAdmissionPayload($career))
        ->assertSessionHasErrors('career_id');

    expect(Admission::query()->count())->toBe(0);
    Mail::assertNothingQueued();
});

test('el aspirante consulta su solicitud con correo y cédula', function () {
    $admission = Admission::factory()->create([
        'code' => 'ASP-2027-000001',
        'email' => 'ana@example.com',
        'id_number' => '18765432',
    ]);

    $response = $this->post(route('admissions.lookup.submit'), [
        'email' => 'Ana@Example.com',
        'id_number' => '18.765.432',
    ]);

    $response->assertRedirect();
    expect($response->headers->get('Location'))
        ->toContain('/preinscripcion/solicitud/'.$admission->code)
        ->toContain('signature=');
});

test('la consulta falla cuando el correo o la cédula no coinciden', function () {
    Admission::factory()->create([
        'code' => 'ASP-2027-000002',
        'email' => 'ana@example.com',
        'id_number' => '18765432',
    ]);

    $this->post(route('admissions.lookup.submit'), [
        'email' => 'otra@example.com',
        'id_number' => '18765432',
    ])->assertSessionHasErrors([
        'email' => 'No encontramos una solicitud con ese correo y cédula. Verifica los datos e inténtalo de nuevo.',
    ]);

    $this->post(route('admissions.lookup.submit'), [
        'email' => 'ana@example.com',
        'id_number' => '99999999',
    ])->assertSessionHasErrors([
        'email' => 'No encontramos una solicitud con ese correo y cédula. Verifica los datos e inténtalo de nuevo.',
    ]);
});

test('la consulta abre la solicitud más reciente del aspirante', function () {
    $previous = Admission::factory()->create([
        'code' => 'ASP-2026-000010',
        'email' => 'ana@example.com',
        'id_number' => '18765432',
        'period_year' => 2026,
    ]);
    $previous->forceFill(['created_at' => now()->subYear()])->save();

    $latest = Admission::factory()->create([
        'code' => 'ASP-2027-000011',
        'email' => 'ana@example.com',
        'id_number' => '18765432',
    ]);

    $response = $this->post(route('admissions.lookup.submit'), [
        'email' => 'ana@example.com',
        'id_number' => '18765432',
    ]);

    expect($response->headers->get('Location'))
        ->toContain('/preinscripcion/solicitud/'.$latest->code);
});

test('la consulta exige el correo y la cédula', function () {
    $this->post(route('admissions.lookup.submit'), [])
        ->assertSessionHasErrors(['email', 'id_number']);
});

test('el expediente solo se muestra con un enlace firmado', function () {
    $admission = Admission::factory()->create();

    $this->get($admission->trackingUrl(60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/status')
            ->where('admission.code', $admission->code)
        );

    $this->get(route('admissions.show', ['admission' => $admission->code]))
        ->assertForbidden();
});

test('el seguimiento muestra el estado del documento y su revisión en el historial', function () {
    $admission = Admission::factory()->create();
    $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/'.$admission->code.'/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);
    $admission->statusHistories()->create([
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::Recibida->value,
        'note' => 'Se ha validado tu Cédula de identidad.',
    ]);

    $this->get($admission->trackingUrl(60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/status')
            ->where('admission.documents.0.status_label', 'Validado')
            ->where('admission.history.0.title', 'Se ha validado tu Cédula de identidad.')
            ->where('admission.history.0.note', null)
        );
});

test('el aspirante puede cargar un documento desde el seguimiento', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'titulo_bachiller',
        'document' => UploadedFile::fake()->create('titulo.pdf', 120, 'application/pdf'),
    ])->assertRedirect();

    $document = $admission->documents()->firstOrFail();

    expect($document->type)->toBe('titulo_bachiller')
        ->and($document->status)->toBe('pendiente')
        ->and($document->original_name)->toBe('titulo.pdf')
        ->and($document->path)->toStartWith('admissions/'.$admission->id_number.'/titulo_bachiller/');

    Storage::disk('local')->assertExists($document->path);

    $document->forceFill([
        'created_at' => now()->subDay(),
        'updated_at' => now(),
    ])->save();

    $this->get($admission->trackingUrl(60))
        ->assertInertia(fn (Assert $page) => $page
            ->where('admission.documents.0.uploaded_at', now()->format('d/m/Y'))
        );
});

test('los documentos distintos de la foto solo aceptan archivos PDF', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'cedula',
        'document' => UploadedFile::fake()->image('cedula.jpg'),
    ])->assertSessionHasErrors([
        'document' => 'El formato del archivo no es válido para este documento.',
    ]);

    expect($admission->documents()->count())->toBe(0);
});

test('los documentos PDF también deben tener extensión PDF', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'cedula',
        'document' => UploadedFile::fake()->createWithContent('cedula.jpg', "%PDF-1.4\n"),
    ])->assertSessionHasErrors([
        'document' => 'La extensión del archivo no es válida para este documento.',
    ]);

    expect($admission->documents()->count())->toBe(0);
});

test('la fotografía tipo carnet acepta imágenes', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'foto',
        'document' => UploadedFile::fake()->image('foto.png'),
    ])->assertRedirect();

    $document = $admission->documents()->firstOrFail();

    expect($document->type)->toBe('foto')
        ->and($document->original_name)->toBe('foto.png');

    Storage::disk('local')->assertExists($document->path);
});

test('la fotografía tipo carnet no acepta documentos PDF', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'foto',
        'document' => UploadedFile::fake()->create('foto.pdf', 120, 'application/pdf'),
    ])->assertSessionHasErrors([
        'document' => 'La fotografía tipo carnet debe ser una imagen JPG, JPEG o PNG.',
    ]);

    expect($admission->documents()->count())->toBe(0);
});

test('el rechazo de PHP por tamaño muestra el motivo de la carga fallida', function () {
    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );
    $file = UploadedFile::fake()->create('titulo.pdf');
    $failedUpload = new UploadedFile(
        $file->getPathname(),
        'titulo.pdf',
        'application/pdf',
        UPLOAD_ERR_INI_SIZE,
        true,
    );

    $this->post($url, [
        'type' => 'titulo_bachiller',
        'document' => $failedUpload,
    ])->assertSessionHasErrors([
        'document' => 'El servidor rechazó el archivo porque supera el límite de carga de PHP. Reduce el tamaño del archivo o aumenta upload_max_filesize.',
    ]);
});

test('el fallo al escribir el temporal muestra el motivo de la carga fallida', function () {
    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );
    $file = UploadedFile::fake()->create('titulo.pdf');
    $failedUpload = new UploadedFile(
        $file->getPathname(),
        'titulo.pdf',
        'application/pdf',
        UPLOAD_ERR_CANT_WRITE,
        true,
    );

    $this->post($url, [
        'type' => 'titulo_bachiller',
        'document' => $failedUpload,
    ])->assertSessionHasErrors([
        'document' => 'El servidor no pudo escribir el archivo temporal. Revisa el espacio disponible y los permisos de la carpeta temporal.',
    ]);
});

test('la falta de carpeta temporal muestra el motivo real de la carga fallida', function () {
    $admission = Admission::factory()->create();
    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );
    $file = UploadedFile::fake()->create('titulo.pdf');
    $failedUpload = new UploadedFile(
        $file->getPathname(),
        'titulo.pdf',
        'application/pdf',
        UPLOAD_ERR_NO_TMP_DIR,
        true,
    );

    $this->post($url, [
        'type' => 'titulo_bachiller',
        'document' => $failedUpload,
    ])->assertSessionHasErrors([
        'document' => 'El servidor no tiene disponible una carpeta temporal para recibir archivos.',
    ]);
});

test('no se pueden cargar documentos en una solicitud cerrada', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create([
        'status' => AdmissionStatus::Rechazada->value,
    ]);

    $url = URL::temporarySignedRoute(
        'admissions.documents.store',
        now()->addDay(),
        ['admission' => $admission->code],
    );

    $this->post($url, [
        'type' => 'cedula',
        'document' => UploadedFile::fake()->create('cedula.pdf', 120, 'application/pdf'),
    ])->assertSessionHasErrors('document');

    expect($admission->documents()->count())->toBe(0);
});

test('el aspirante puede eliminar un documento para reemplazarlo', function () {
    Storage::fake('local');

    $admission = Admission::factory()->create();
    $path = 'admissions/'.$admission->code.'/cedula.pdf';

    Storage::disk('local')->put($path, 'contenido');

    $document = $admission->documents()->create([
        'type' => 'cedula',
        'status' => 'pendiente',
        'original_name' => 'cedula.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 9,
    ]);

    $url = URL::temporarySignedRoute(
        'admissions.documents.destroy',
        now()->addDay(),
        ['admission' => $admission->code, 'document' => $document->id],
    );

    $this->delete($url)->assertRedirect();

    expect($admission->documents()->count())->toBe(0);
    Storage::disk('local')->assertMissing($path);
});

test('la solicitud convertida muestra el acceso del estudiante en el seguimiento', function () {
    $user = User::factory()->create([
        'name' => 'María Rodríguez',
        'email' => 'maria.estudiante@example.com',
        'must_change_password' => true,
    ]);
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'student_code' => 'EST-2027-001',
    ]);

    $admission = Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
    ]);

    $this->get($admission->trackingUrl(60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/status')
            ->where('admission.status', AdmissionStatus::Convertida->value)
            ->where('admission.student.student_code', 'EST-2027-001')
            ->where('admission.student.email', 'maria.estudiante@example.com')
            ->where('admission.student.career', $admission->career?->name)
            ->where('admission.student.period_year', $admission->period_year)
            ->where('admission.student.login_url', route('login'))
            ->where('admission.student.initial_password', $admission->id_number)
        );
});

test('una solicitud sin convertir no expone datos de acceso', function () {
    $admission = Admission::factory()->create();

    $this->get($admission->trackingUrl(60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/status')
            ->where('admission.student', null)
        );
});

test('el seguimiento no repite la cédula cuando la contraseña ya fue definida', function () {
    $user = User::factory()->create(['must_change_password' => false]);
    StudentProfile::factory()->create(['user_id' => $user->id]);
    $admission = Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
    ]);

    $this->get($admission->trackingUrl(60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/status')
            ->where('admission.student.initial_password', null)
        );
});
