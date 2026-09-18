// Parsea el campo "Horario" tal como lo devuelve la API del Ministerio,
// p.ej. "L-D: 24H" o "L-V: 07:00-22:00; S: 08:00-22:00; D: 10:00-22:00".

export type DayHours = { open: string; close: string; is24h: boolean } | null;

export const DAY_LABELS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

const DAY_LETTER_INDEX: Record<string, number> = {
  L: 0,
  M: 1,
  X: 2,
  J: 3,
  V: 4,
  S: 5,
  D: 6,
};

function expandDayPart(dayPart: string): number[] {
  const days = new Set<number>();
  for (const token of dayPart.split(',')) {
    const trimmed = token.trim().toUpperCase();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startLetter, endLetter] = trimmed.split('-').map((s) => s.trim());
      const start = DAY_LETTER_INDEX[startLetter];
      const end = DAY_LETTER_INDEX[endLetter];
      if (start == null || end == null) continue;
      if (start <= end) {
        for (let i = start; i <= end; i++) days.add(i);
      } else {
        for (let i = start; i <= 6; i++) days.add(i);
        for (let i = 0; i <= end; i++) days.add(i);
      }
    } else {
      const idx = DAY_LETTER_INDEX[trimmed];
      if (idx != null) days.add(idx);
    }
  }
  return [...days];
}

/** Devuelve un array de 7 posiciones (Lunes..Domingo), null si ese día está cerrado. */
export function parseSchedule(raw: string | null | undefined): DayHours[] | null {
  if (!raw) return null;

  const week: DayHours[] = [null, null, null, null, null, null, null];
  const segments = raw.split(';');

  for (const segment of segments) {
    const match = segment.trim().match(/^([A-ZÁÉÍÓÚ,\-]+)\s*:\s*(.+)$/i);
    if (!match) continue;
    const [, dayPart, timePart] = match;
    const days = expandDayPart(dayPart);
    if (days.length === 0) continue;

    const normalizedTime = timePart.trim().toUpperCase();
    let hours: DayHours;
    if (normalizedTime === '24H') {
      hours = { open: '00:00', close: '24:00', is24h: true };
    } else {
      const timeMatch = normalizedTime.match(
        /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/
      );
      if (!timeMatch) continue;
      hours = { open: timeMatch[1], close: timeMatch[2], is24h: false };
    }

    for (const dayIndex of days) {
      week[dayIndex] = hours;
    }
  }

  return week.some((d) => d != null) ? week : null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export type ScheduleStatus = {
  isOpen: boolean;
  label: string; // p.ej. "Abre a las 08:00" o "Cierra a las 22:00"
};

/** Calcula si está abierto ahora mismo y el próximo cambio de estado, en hora local. */
export function getScheduleStatus(
  week: DayHours[],
  now: Date = new Date()
): ScheduleStatus {
  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = week[todayIndex];

  if (today) {
    const openMin = toMinutes(today.open);
    const closeMin = toMinutes(today.close);
    if (nowMinutes >= openMin && nowMinutes < closeMin) {
      return today.is24h
        ? { isOpen: true, label: 'Abierto 24h' }
        : { isOpen: true, label: `Cierra a las ${today.close}` };
    }
    if (nowMinutes < openMin) {
      return { isOpen: false, label: `Abre a las ${today.open}` };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const dayIndex = (todayIndex + i) % 7;
    const day = week[dayIndex];
    if (day) {
      const prefix = i === 1 ? 'Abre mañana a las' : `Abre ${DAY_LABELS[dayIndex]} a las`;
      return { isOpen: false, label: `${prefix} ${day.open}` };
    }
  }

  return { isOpen: false, label: 'Cerrado' };
}

export function formatDayHours(hours: DayHours): string {
  if (!hours) return 'Cerrado';
  if (hours.is24h) return '24 horas';
  return `${hours.open} - ${hours.close}`;
}
