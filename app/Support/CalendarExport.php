<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Genera un calendario iCalendar sin dependencias externas.
 */
final class CalendarExport
{
    /**
     * @param  array<int, array{uid: string, title: string, starts_at: Carbon, ends_at: Carbon, location?: string|null, description?: string|null}>  $events
     */
    public static function make(array $events): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//UPEL//Horarios academicos//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Horarios UPEL',
        ];

        foreach ($events as $event) {
            $lines = array_merge($lines, [
                'BEGIN:VEVENT',
                'UID:'.$event['uid'],
                'DTSTAMP:'.Carbon::now('UTC')->format('Ymd\THis\Z'),
                'DTSTART;TZID=America/Caracas:'.$event['starts_at']->format('Ymd\THis'),
                'DTEND;TZID=America/Caracas:'.$event['ends_at']->format('Ymd\THis'),
                'SUMMARY:'.self::escape($event['title']),
                'LOCATION:'.self::escape((string) ($event['location'] ?? '')),
                'DESCRIPTION:'.self::escape((string) ($event['description'] ?? '')),
                'END:VEVENT',
            ]);
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", array_map(static fn (string $line): string => self::fold($line), $lines))."\r\n";
    }

    /**
     * Escapa los caracteres reservados de las propiedades de texto.
     */
    private static function escape(string $value): string
    {
        return str_replace(
            ['\\', ';', ',', "\r\n", "\r", "\n"],
            ['\\\\', '\;', '\,', '\n', '\n', '\n'],
            $value,
        );
    }

    /**
     * Divide líneas largas según exige el estándar iCalendar.
     */
    private static function fold(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }

        $parts = str_split($line, 75);

        return implode("\r\n ", $parts);
    }
}
