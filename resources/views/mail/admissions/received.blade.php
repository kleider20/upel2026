<x-mail::message>
# Solicitud recibida

Hola **{{ $admission->fullName() }}**:

Recibimos tu solicitud de preinscripción para la carrera de
**{{ $admission->career?->name ?? 'la UPEL' }}** en la modalidad
**{{ $admission->modalityLabel() }}**.

**Código de aspirante:** {{ $admission->code }}

Guarda este código como referencia de tu expediente. Para consultar el estado
solo necesitas el correo y la cédula con los que te registraste.

<x-mail::button :url="$trackingUrl">
Consultar mi solicitud
</x-mail::button>

### Próximos pasos

1. Sube los documentos obligatorios desde el enlace de seguimiento.
2. El equipo de admisión revisará tu expediente.
3. Te avisaremos por este mismo correo cuando haya cambios en tu estado.

Si no realizaste esta solicitud, puedes ignorar este mensaje.

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
