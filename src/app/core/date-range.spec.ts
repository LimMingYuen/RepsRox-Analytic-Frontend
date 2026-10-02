import { TestBed } from '@angular/core/testing';
import { DateRangeState, monthsBack } from './date-range';

describe('DateRangeState', () => {
  it('counts whole months back from the newest data', () => {
    expect(monthsBack('2026-09-30', 1)).toBe('2026-09-01');
    expect(monthsBack('2026-09-30', 3)).toBe('2026-07-01');
    expect(monthsBack('2026-02-14', 12)).toBe('2025-03-01');
  });

  it('runs to the edges of the data until it knows where they are', () => {
    const state = TestBed.inject(DateRangeState);
    state.choose('3m');
    expect(state.range()).toEqual({ from: null, to: null });

    state.latest.set('2026-09-30');
    expect(state.range()).toEqual({ from: '2026-07-01', to: '2026-09-30' });
  });

  it('switches to custom when a date is typed', () => {
    const state = TestBed.inject(DateRangeState);
    state.setCustom({ from: '2026-08-01', to: null });
    expect(state.preset()).toBe('custom');
    expect(state.range()).toEqual({ from: '2026-08-01', to: null });
  });
});
