import { ChartOptions } from 'chart.js';

/**
 * Chart colours, from the app's palette. The accent leads and a blue is the one
 * second series; the pair is checked colour-blind safe on the card surface.
 * Text never takes a series colour — it stays in the ink ramp.
 */
export const C = {
  accent: '#ff3b14',
  accentWash: 'rgba(255, 59, 20, 0.10)',
  second: '#3987e5',
  secondWash: 'rgba(57, 135, 229, 0.10)',
  surface: '#1a1b1e',
  ink: '#e9e9ed',
  inkSecondary: 'rgba(233, 233, 237, 0.60)',
  inkMuted: 'rgba(233, 233, 237, 0.45)',
  grid: 'rgba(233, 233, 237, 0.08)',
};

const FONT = 'Inter, system-ui, sans-serif';

/** Hairline grid, quiet axes, a tooltip on hover across every series at the hovered point. */
export function baseOptions(): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: C.inkSecondary,
          font: { family: FONT, size: 12 },
          boxWidth: 10,
          boxHeight: 10,
          useBorderRadius: true,
          borderRadius: 2,
        },
      },
      tooltip: {
        backgroundColor: '#22242a',
        borderColor: 'rgba(233, 233, 237, 0.12)',
        borderWidth: 1,
        titleColor: C.ink,
        bodyColor: C.inkSecondary,
        titleFont: { family: FONT, weight: 600, size: 12 },
        bodyFont: { family: FONT, size: 12 },
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: C.grid },
        ticks: {
          color: C.inkMuted,
          font: { family: FONT, size: 11 },
          maxRotation: 0,
          autoSkipPadding: 16,
        },
      },
      y: {
        grid: { color: C.grid },
        border: { display: false },
        ticks: { color: C.inkMuted, font: { family: FONT, size: 11 } },
      },
    },
  } as ChartOptions;
}

/** A tick step for a clock axis, in seconds: round minutes rather than Chart.js's decimal steps. */
export function clockStep(spanSeconds: number): number {
  const steps = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  return steps.find((s) => spanSeconds / s <= 7) ?? 7200;
}

/** Bars: capped thickness, a rounded data end and a square foot on the baseline. */
export const BAR = { maxBarThickness: 24, borderRadius: 4, borderSkipped: 'start' as const };

/** Lines: 2px, with points only on hover, ringed in the surface colour. */
export const LINE = {
  borderWidth: 2,
  pointRadius: 0,
  pointHoverRadius: 5,
  pointHoverBorderWidth: 2,
  pointHoverBorderColor: C.surface,
  tension: 0.25,
  borderCapStyle: 'round' as const,
  borderJoinStyle: 'round' as const,
};
