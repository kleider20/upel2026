import type { StudentScheduleWeek } from '@/types/student';

const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const WEEKDAYS = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
];

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const WEEKDAY_LETTERS: Record<number, string> = {
    1: 'L',
    2: 'M',
    3: 'X',
    4: 'J',
    5: 'V',
};

export type ClassDate = {
    date: string;
    month: string;
    month_key: string;
    day: string;
    weekday: string;
    weekday_short: string;
    week: number;
    week_number: number;
};

type DateRange = {
    starts_on: string;
    ends_on: string;
    study_schedule: string;
};

function parseDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function isoWeek(date: Date): string {
    const target = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNumber = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNumber + 3);

    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const week =
        1 +
        Math.round(
            (target.getTime() - firstThursday.getTime()) /
                (7 * 24 * 60 * 60 * 1000),
        );

    return `${target.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

function classDate(date: Date, week: number): ClassDate {
    return {
        date: dateKey(date),
        month: MONTHS[date.getMonth()],
        month_key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        day: String(date.getDate()).padStart(2, '0'),
        weekday: WEEKDAYS[date.getDay()],
        weekday_short: WEEKDAYS_SHORT[date.getDay()],
        week,
        week_number: week,
    };
}

export function buildClassDates({
    starts_on,
    ends_on,
    study_schedule,
}: DateRange): ClassDate[] {
    const start = parseDate(starts_on);
    const end = parseDate(ends_on);

    if (start === null || end === null || end < start) {
        return [];
    }

    const dates: ClassDate[] = [];
    const current = new Date(start);
    const isSaturday = study_schedule === 'sabatino';

    while (current <= end) {
        const allowed = isSaturday
            ? current.getDay() === 6
            : current.getDay() >= 1 && current.getDay() <= 5;

        if (allowed) {
            dates.push(classDate(current, dates.length + 1));
        }

        current.setDate(current.getDate() + 1);
    }

    return dates;
}

export function buildScheduleWeeks({
    starts_on,
    ends_on,
    study_schedule,
}: DateRange): StudentScheduleWeek[] {
    const dates = buildClassDates({ starts_on, ends_on, study_schedule });

    if (dates.length === 0) {
        return [];
    }

    if (study_schedule === 'sabatino') {
        return dates.map((date) => ({
            date: date.date,
            week: date.week,
            week_number: date.week_number,
            month: date.month,
            tone: date.month.toLowerCase(),
            day: date.day,
            weekday: date.weekday,
            dates: [date.date],
            highlight: null,
        }));
    }

    const groups = new Map<string, ClassDate[]>();

    for (const date of dates) {
        const parsed = parseDate(date.date);

        if (parsed === null) {
            continue;
        }

        const key = isoWeek(parsed);
        groups.set(key, [...(groups.get(key) ?? []), date]);
    }

    return Array.from(groups.entries()).map(([key, group], index) => {
        const first = group[0];
        const last = group[group.length - 1];
        const firstDate = parseDate(first.date);
        const lastDate = parseDate(last.date);
        const spansMonths =
            firstDate !== null &&
            lastDate !== null &&
            firstDate.getMonth() !== lastDate.getMonth();
        const day = spansMonths
            ? `${first.day}/${String((firstDate?.getMonth() ?? 0) + 1).padStart(2, '0')}-${last.day}/${String((lastDate?.getMonth() ?? 0) + 1).padStart(2, '0')}`
            : `${first.day}-${last.day}`;

        return {
            date: `week-${key}`,
            week: index + 1,
            week_number: index + 1,
            month: first.month,
            tone: first.month.toLowerCase(),
            day,
            weekday: 'Lunes a Viernes',
            dates: group.map((date) => date.date),
            highlight: null,
        };
    });
}

export function selectedScheduleWeeks(
    weeks: StudentScheduleWeek[],
    selectedDates: string[],
): StudentScheduleWeek[] {
    const selectedDateSet = new Set(selectedDates);

    return weeks.flatMap((week) => {
        const dates = (week.dates ?? []).filter((date) =>
            selectedDateSet.has(date),
        );

        if (dates.length === 0) {
            return [];
        }

        const firstDate = parseDate(dates[0]);
        const months = new Set(dates.map((date) => date.slice(5, 7)));

        return [
            {
                ...week,
                date: dates[0],
                month:
                    firstDate === null
                        ? week.month
                        : MONTHS[firstDate.getMonth()],
                tone:
                    firstDate === null
                        ? week.tone
                        : MONTHS[firstDate.getMonth()].toLowerCase(),
                day: dates
                    .map((date) =>
                        months.size > 1
                            ? `${date.slice(8, 10)}/${date.slice(5, 7)}`
                            : date.slice(8, 10),
                    )
                    .join(', '),
                dates,
            },
        ];
    });
}

export function formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);

    if (Number.isNaN(hours)) {
        return value;
    }

    const hour = hours % 12 === 0 ? 12 : hours % 12;
    const suffix = hours < 12 ? 'am' : 'pm';

    return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startsAt: string, endsAt: string): string {
    if (startsAt === '' || endsAt === '') {
        return '';
    }

    return `${formatTime(startsAt)} - ${formatTime(endsAt)}`;
}

export function daysLabel(dates: string[]): string {
    const days = Array.from(
        new Set(
            dates
                .map((date) => parseDate(date))
                .filter((date): date is Date => date !== null)
                .map((date) => date.getDay()),
        ),
    ).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

    if (days.length === 5 && days.every((day) => day >= 1 && day <= 5)) {
        return 'Lun a Vie';
    }

    return days.map((day) => WEEKDAYS_SHORT[day]).join(', ');
}

export function compactDays(dates: string[]): string {
    const days = Array.from(
        new Set(
            dates
                .map((date) => parseDate(date))
                .filter((date): date is Date => date !== null)
                .map((date) => (date.getDay() === 0 ? 7 : date.getDay())),
        ),
    ).sort((a, b) => a - b);

    if (days.length === 5 && days.every((day) => day >= 1 && day <= 5)) {
        return 'L-V';
    }

    return days.map((day) => WEEKDAY_LETTERS[day] ?? '').join('');
}

export function monthsBetween({
    starts_on,
    ends_on,
}: Pick<DateRange, 'starts_on' | 'ends_on'>): {
    month: string;
    month_key: string;
}[] {
    const start = parseDate(starts_on);
    const end = parseDate(ends_on);

    if (start === null || end === null || end < start) {
        return [];
    }

    const months: { month: string; month_key: string }[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= last) {
        months.push({
            month: MONTHS[current.getMonth()],
            month_key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
        });
        current.setMonth(current.getMonth() + 1);
    }

    return months;
}

export function timeSlotLabels(
    subjects: { starts_at: string; ends_at: string }[],
): string[] {
    const slots = new Map<string, string>();

    for (const subject of subjects) {
        if (subject.starts_at === '' || subject.ends_at === '') {
            continue;
        }

        const label = formatTimeRange(subject.starts_at, subject.ends_at);
        slots.set(`${subject.starts_at}-${subject.ends_at}`, label);
    }

    return Array.from(slots.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, label], index) => `${index + 1}.- ${label}`);
}

export function groupClassDates(dates: ClassDate[]): {
    month: string;
    month_key: string;
    dates: ClassDate[];
}[] {
    const groups = new Map<string, ClassDate[]>();

    for (const date of dates) {
        groups.set(date.month_key, [
            ...(groups.get(date.month_key) ?? []),
            date,
        ]);
    }

    return Array.from(groups.entries()).map(([monthKey, group]) => ({
        month: group[0].month,
        month_key: monthKey,
        dates: group,
    }));
}
