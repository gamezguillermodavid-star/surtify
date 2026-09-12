// Límites de periodo (semana/mes) usados para calcular el progreso real
// de misiones y aportes, en vez de datos de ejemplo.

export function startOfWeekISO(reference: Date = new Date()): string {
  const d = new Date(reference);
  const day = d.getDay(); // 0 = domingo ... 6 = sábado
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfMonthISO(reference: Date = new Date()): string {
  const d = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  return d.toISOString();
}
