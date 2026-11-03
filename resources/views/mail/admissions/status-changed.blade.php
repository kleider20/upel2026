<x-mail::message>
# Actualización de tu solicitud

Hola **{{ $admission->fullName() }}**:

Tu solicitud **{{ $admission->code }}** pasó de **{{ $previousStatus->label() }}** a
**{{ $admission->statusLabel() }}**.

{{ $admission->statusEnum()->description() }}

@if ($note)
<x-mail::panel>
**Observación del equipo de admisión:**<br>
{{ $note }}
</x-mail::panel>
@endif

@if ($admission->missingRequiredDocuments() !== [])
### Documentos pendientes

@foreach ($admission->missingRequiredDocuments() as $document)
- {{ $document->label() }}
@endforeach
@endif

<x-mail::button :url="$trackingUrl">
Ver mi solicitud
</x-mail::button>

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
