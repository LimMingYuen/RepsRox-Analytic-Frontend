/** Formatting that matches the app: clocks as m:ss and h:mm:ss, kilos to one place. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** m:ss — a split or a session's duration. Minutes run past sixty rather than rolling into hours. */
export function minutes(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** h:mm:ss — the race clock. */
export function hours(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** A split against its target, signed with a true minus: "−0:12", "+0:05". */
export function delta(seconds: number): string {
  if (seconds === 0) return '0:00';
  return `${seconds < 0 ? '−' : '+'}${minutes(Math.abs(seconds))}`;
}

export function kilos(kg: number | null | undefined): string {
  return kg == null ? '—' : kg.toFixed(1);
}

/** A signed change in kilos: "−2.8", "+0.4". */
export function signedKilos(kg: number | null | undefined): string {
  if (kg == null) return '—';
  if (Math.abs(kg) < 0.05) return '0.0';
  return `${kg < 0 ? '−' : '+'}${Math.abs(kg).toFixed(1)}`;
}

/** "7.8 t" from a tonne up, "840 kg" below — the app's short volume figure. */
export function volume(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`;
}

export function thousands(n: number | null | undefined): string {
  return n == null ? '—' : Math.round(n).toLocaleString('en-US');
}

/** "15 Aug 2026". */
export function longDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "15 Aug" — for axes, where the year is already in the range. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "Aug 2026". */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** A Date as `yyyy-MM-dd`, read in UTC so a date never slips a day across time zones. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
