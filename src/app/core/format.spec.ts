import { delta, hours, longDate, minutes, signedKilos, volume } from './format';

describe('format', () => {
  it('writes clocks as the app does', () => {
    expect(minutes(3492)).toBe('58:12');
    expect(minutes(65)).toBe('1:05');
    expect(hours(3866)).toBe('1:04:26');
    expect(hours(600)).toBe('0:10:00');
  });

  it('signs splits and kilos with a true minus', () => {
    expect(delta(-18)).toBe('−0:18');
    expect(delta(5)).toBe('+0:05');
    expect(delta(0)).toBe('0:00');
    expect(signedKilos(-3.25)).toBe('−3.3');
    expect(signedKilos(0.01)).toBe('0.0');
  });

  it('shortens volume to tonnes from a tonne up', () => {
    expect(volume(840)).toBe('840 kg');
    expect(volume(187828.5)).toBe('187.8 t');
  });

  it('reads dates without slipping a day across time zones', () => {
    expect(longDate('2026-08-01')).toBe('1 Aug 2026');
    expect(longDate(null)).toBe('—');
  });
});
