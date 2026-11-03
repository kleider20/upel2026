<x-mail::message>
# ¡Bienvenido a la UPEL!

Hola **{{ $user->name }}**:

Tu solicitud **{{ $admission->code }}** fue aprobada y ya creamos tu cuenta de
estudiante en el campus virtual.

**Correo de acceso:** {{ $user->email }}<br>
**Contraseña inicial:** {{ $admission->id_number }} (tu cédula, sin la letra V ni puntos)<br>
**Carrera:** {{ $admission->career?->name ?? '—' }}<br>
**Código de estudiante:** {{ $user->studentProfile?->student_code ?? '—' }}<br>
**Período de ingreso:** {{ $admission->period_year }}

Ingresa al portal de estudiantes con tu correo y tu cédula como contraseña. La
primera vez te pediremos **definir una contraseña personal**; desde ese momento
usarás esa nueva contraseña.

<x-mail::button :url="route('login')">
Ingresar al campus
</x-mail::button>

Si olvidas tu contraseña, usa la opción **¿La olvidaste?** en la página de
acceso y recibirás un enlace para restablecerla.

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
