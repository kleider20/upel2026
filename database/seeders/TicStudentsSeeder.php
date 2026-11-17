<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Admission;
use App\Models\Career;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\StudentCodeGenerator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Nómina de estudiantes de TIC I (período 2025-II).
 *
 * La lista proviene de la planilla oficial del curso: cada fila trae la cédula,
 * la especialidad con su código de planilla (P = Primaria, L = Lengua y
 * Literatura, G = Geografía e Historia), el cohorte y el nombre completo.
 *
 * El seeder es idempotente: si el estudiante ya existe (misma cédula, por
 * perfil o por solicitud convertida) solo se completan su cédula y su cohorte;
 * nunca se duplica la cuenta ni se reescribe su año de ingreso.
 */
class TicStudentsSeeder extends Seeder
{
    /**
     * Códigos de carrera usados por la planilla de la asignatura.
     *
     * @var array<string, string>
     */
    private const CAREERS = [
        'P' => 'EDPRI',
        'L' => 'LENLI',
        'G' => 'GEHIS',
    ];

    /**
     * Conectores que se escriben en minúscula dentro de los nombres.
     *
     * @var array<int, string>
     */
    private const PARTICLES = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];

    /**
     * Nómina tal como aparece en la planilla: cédula, especialidad, cohorte y nombre.
     *
     * @var array<int, array{0: string, 1: string, 2: string, 3: string}>
     */
    private const STUDENTS = [
        ['15267143', 'P', '2021-I', 'YERLY AYMARA VÁSQUEZ LUCERO'],
        ['20190193', 'P', '2021-I', 'LUISBELYS GERALDINE CORREA GARCIA'],
        ['11553708', 'L', '2023', 'YASMIN SIRA TORRES'],
        ['10829387', 'L', '2024', 'KATTY DEL CARMEN RAMOS'],
        ['12864647', 'L', '2025-I', 'BOGAR SIMÓN ACOSTA TOVAR'],
        ['20007104', 'L', '2025-I', 'STEFFANY LORRAINE CHACÓN CONTRERAS'],
        ['24802126', 'L', '2025-I', 'ZAILET NAHOMI CAMPOS MELO'],
        ['28013279', 'L', '2025-I', 'IRMA GRISSEL LONGAR MATEO'],
        ['30811536', 'L', '2025-I', 'EDELITZA JOSEFINA MARCANO PEÑA'],
        ['10262426', 'L', '2025-II', 'MARIA GREGORIA HIDALGO LINARES'],
        ['11058372', 'L', '2025-II', 'CRISOID DEL VALLE ROMERO SOTO'],
        ['11639799', 'L', '2025-II', 'GLADYS CAROLINA ALAS OMAÑA'],
        ['11681865', 'L', '2025-II', 'THAIS COROMOTO GODOY PÉREZ'],
        ['13042459', 'L', '2025-II', 'MARIA EMILIA HERNÁNDEZ OSUNA'],
        ['14073078', 'L', '2025-II', 'YAMANI ELEAZAR FRANCO VELASQUEZ'],
        ['14312791', 'L', '2025-II', 'NORKA ESMERALDA LEIVA RODRÍGUEZ'],
        ['15504678', 'L', '2025-II', 'YOISE CATHERINE DUQUE LÓPEZ'],
        ['17166541', 'L', '2025-II', 'ANDREA DEL CARMEN MACHADO ANNUNZIATA'],
        ['17482122', 'L', '2025-II', 'ANMAR MAYDOLIS ARRIETA ROMERO'],
        ['18131388', 'L', '2025-II', 'JENIFER LORENA GUERRERO ORTEGA'],
        ['18534434', 'L', '2025-II', 'YENIFER DESIRE MARIÑO ESTEVES'],
        ['19203481', 'L', '2025-II', 'RUBEN DARIO BLANCO GÓMEZ'],
        ['26822516', 'L', '2025-II', 'ANGEL DE LA TRINIDAD ESCOBAR HENRÍQUEZ'],
        ['29547703', 'L', '2025-II', 'RITA GEORGETTE RODRÍGUEZ ALVAREZ'],
        ['12459024', 'P', '2025-II', 'JOSÉ DE JESÚS HERRERA BOZZO'],
        ['15545705', 'P', '2025-II', 'NATHALY CLARET SUBERO RODRÍGUEZ'],
        ['15934968', 'P', '2025-II', 'NILSIA DE JESÊS RIVAS MENESES'],
        ['17384031', 'P', '2025-II', 'YESSICA YESENIA SUÁREZ LEÓN'],
        ['17815966', 'P', '2025-II', 'CRISTIARBEL DOMÍNGUEZ BLANCO'],
        ['18534451', 'P', '2025-II', 'KLEIDER KEITH ROSAMILIA ROJAS'],
        ['18930359', 'P', '2025-II', 'RAYMAR JOSEPH ROMERO ROMERO'],
        ['20559360', 'P', '2025-II', 'YASKARY MARÍA BOLÍVAR GLOD'],
        ['20560773', 'P', '2025-II', 'ANGELI ANDREINA PERAZA ÁLVAREZ'],
        ['20782755', 'P', '2025-II', 'MARIANA JOSE QUINTERO MARTINEZ'],
        ['21192641', 'P', '2025-II', 'YISBELY MARIA CANELON ADRIAN'],
        ['21253160', 'P', '2025-II', 'STEFANY DEL VALLE PEREZ RANGEL'],
        ['21632071', 'P', '2025-II', 'JORLENE VICTORIA VASQUEZ CAMPOS'],
        ['22281700', 'P', '2025-II', 'STEFANY ELIZABETH RODRÍGUEZ CORDOVA'],
        ['22282645', 'P', '2025-II', 'YINETSY LUCIA GONZÁLEZ OROPEZA'],
        ['24182276', 'P', '2025-II', 'VANESA MARINA CHACÍN ROMERO'],
        ['24465662', 'P', '2025-II', 'GLORIANA ISABEL VÁSQUEZ NOGUERA'],
        ['24805344', 'P', '2025-II', 'WILNIRY JEAN CARLIS MENDEZ ACOSTA'],
        ['26828521', 'P', '2025-II', 'STEFANY ENMARY LEDEZMA CORDERO'],
        ['28306196', 'P', '2025-II', 'DAVID ALEJANDRO ROJAS GUATARAMA'],
        ['29665920', 'P', '2025-II', 'AIRAM DEL CARMEN GUAREGUA LUNA'],
        ['30633438', 'P', '2025-II', 'MOISES EDUARDO CASTILLO ROMERO'],
        ['30887695', 'P', '2025-II', 'ALEXANYELA DEL VALLE UGUETO RODRÍGUEZ'],
        ['7990129', 'P', '2025-II', 'JESÚS RAMON TORRES BELLO'],
        ['11031317', 'G', '2025-II', 'RICHARD ALEXANDER GONZÁLEZ AZPURUA'],
        ['14139141', 'G', '2025-II', 'KEILA HERMELINA CORDERO KEILA'],
        ['15545793', 'G', '2025-II', 'YANATA JOSEFINA ALONZO DE BOXILL'],
        ['15780718', 'G', '2025-II', 'MARY LUZ ROMERO GONZÁLEZ'],
        ['17153142', 'G', '2025-II', 'JESÚS GREGORIO LINARES SALAZAR'],
        ['18039759', 'G', '2025-II', 'ANGEL LUIS REY GIL'],
        ['18072884', 'G', '2025-II', 'SANDRA DELGADO BRICEÑO'],
        ['18535052', 'G', '2025-II', 'JOULIETH DEL VALLE DÍAZ SALAZAR'],
        ['30092296', 'G', '2025-II', 'JESÚS ALBERTO OSORIO GARCÍA'],
        ['31308762', 'G', '2025-II', 'GENESIS ALBANIS LOZANO COLMENARES'],
        ['31748199', 'G', '2025-II', 'ALBERT IGNACIO MONTIEL COLÓN'],
        ['34805942', 'G', '2025-II', 'DORIANNY ALBERLYN MARTÍNEZ CEDEÑO'],
    ];

    /**
     * Crea las cuentas y los perfiles faltantes de la nómina.
     */
    public function run(): void
    {
        $codes = app(StudentCodeGenerator::class);

        foreach (self::STUDENTS as [$idNumber, $especialidad, $cohort, $name]) {
            $career = Career::query()->where('code', self::CAREERS[$especialidad])->first();

            if ($career === null) {
                $this->command?->warn('No existe la carrera '.self::CAREERS[$especialidad].'; se omite a '.$name.'.');

                continue;
            }

            $profile = $this->existingProfile($idNumber);

            if ($profile !== null) {
                $profile->update([
                    'identity_document' => $profile->identity_document ?? $idNumber,
                    'cohort' => $cohort,
                    'career_id' => $profile->career_id ?? $career->id,
                ]);

                continue;
            }

            $this->createStudent($name, $idNumber, $career, $cohort, $codes);
        }
    }

    /**
     * Perfil existente con esa cédula, venga del propio perfil o de una
     * solicitud de admisión ya convertida.
     */
    private function existingProfile(string $idNumber): ?StudentProfile
    {
        $profile = StudentProfile::query()->where('identity_document', $idNumber)->first();

        if ($profile !== null) {
            return $profile;
        }

        $userId = Admission::query()
            ->where('id_number', $idNumber)
            ->whereNotNull('converted_user_id')
            ->value('converted_user_id');

        return $userId !== null
            ? StudentProfile::query()->where('user_id', $userId)->first()
            : null;
    }

    /**
     * Cuenta, rol y perfil académico de un estudiante de la nómina.
     */
    private function createStudent(
        string $name,
        string $idNumber,
        Career $career,
        string $cohort,
        StudentCodeGenerator $codes,
    ): void {
        $email = 'v'.$idNumber.'@estudiante.upel.edu.ve';

        if (User::query()->where('email', $email)->exists()) {
            $this->command?->warn('El correo '.$email.' ya está registrado; se omite a '.$name.'.');

            return;
        }

        $year = (int) substr($cohort, 0, 4);

        DB::transaction(function () use ($name, $idNumber, $career, $cohort, $codes, $email, $year): void {
            $user = User::query()->create([
                'name' => $this->displayName($name),
                'email' => $email,
                'password' => $idNumber,
                'must_change_password' => true,
            ]);

            $user->markEmailAsVerified();
            $user->assignRole(Role::Estudiante->value);

            StudentProfile::query()->create([
                'user_id' => $user->id,
                'identity_document' => $idNumber,
                'career_id' => $career->id,
                'student_code' => $codes->generate($year),
                'current_semester' => 1,
                'status' => 'activo',
                'personal_email' => $email,
                'admission_year' => $year,
                'cohort' => $cohort,
            ]);
        });
    }

    /**
     * Convierte el nombre en mayúsculas de la planilla a formato de título,
     * conservando los conectores en minúscula.
     */
    private function displayName(string $name): string
    {
        $words = preg_split('/\s+/', mb_strtolower(trim($name), 'UTF-8')) ?: [];

        $normalized = array_map(
            static function (string $word, int $position): string {
                if ($position > 0 && in_array($word, self::PARTICLES, true)) {
                    return $word;
                }

                return mb_convert_case($word, MB_CASE_TITLE, 'UTF-8');
            },
            $words,
            array_keys($words),
        );

        return implode(' ', $normalized);
    }
}
