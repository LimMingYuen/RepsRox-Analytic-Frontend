import { Injectable, computed, signal } from '@angular/core';
import { DateRange } from './models';
import { isoDate } from './format';

export type RangePreset = '1m' | '3m' | '6m' | '12m' | 'all' | 'custom';

export const RANGE_PRESETS: { id: RangePreset; label: string }[] = [
  { id: '1m', label: 'Last month' },
  { id: '3m', label: '3 months' },
  { id: '6m', label: '6 months' },
  { id: '12m', label: '12 months' },
  { id: 'all', label: 'All time' },
];

/**
 * The one date range every page reads. The app sends a month only once it is over,
 * so "last 3 months" counts back from the newest data rather than from today —
 * otherwise a range would open on weeks nothing has been sent for yet.
 */
@Injectable({ providedIn: 'root' })
export class DateRangeState {
  readonly preset = signal<RangePreset>('all');
  readonly custom = signal<DateRange>({ from: null, to: null });

  /** The last date any sheet holds, once known. */
  readonly latest = signal<string | null>(null);

  readonly range = computed<DateRange>(() => {
    const preset = this.preset();
    if (preset === 'custom') return this.custom();
    const latest = this.latest();
    if (preset === 'all' || !latest) return { from: null, to: null };
    return { from: monthsBack(latest, Number.parseInt(preset, 10)), to: latest };
  });

  choose(preset: RangePreset) {
    this.preset.set(preset);
  }

  setCustom(range: DateRange) {
    this.custom.set(range);
    this.preset.set('custom');
  }
}

/** The first of the month, [months] whole months back to and including the month of [latest]. */
export function monthsBack(latest: string, months: number): string {
  const [y, m] = latest.split('-').map(Number);
  return isoDate(new Date(Date.UTC(y, m - months, 1)));
}
