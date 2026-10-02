import { Component, inject } from '@angular/core';
import { DateRangeState, RANGE_PRESETS } from '../core/date-range';

/** The filters row every page opens with: a range preset, or a custom from / to. */
@Component({
  selector: 'app-range-bar',
  template: `
    <div class="presets" role="group" aria-label="Date range">
      @for (p of presets; track p.id) {
        <button type="button" [class.on]="state.preset() === p.id" (click)="state.choose(p.id)">
          {{ p.label }}
        </button>
      }
    </div>
    <div class="custom">
      <label
        >From
        <input
          type="date"
          [value]="state.range().from ?? ''"
          (change)="set('from', $any($event.target).value)"
      /></label>
      <label
        >To
        <input
          type="date"
          [value]="state.range().to ?? ''"
          (change)="set('to', $any($event.target).value)"
      /></label>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px;
      background: var(--surface-raised);
      border: 1px solid var(--border-chip);
      border-radius: 8px;
    }
    button {
      background: none;
      border: 0;
      color: var(--text-subtle);
      font: inherit;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    button:hover {
      color: var(--text-primary);
    }
    button.on {
      color: var(--text-primary);
      background: var(--accent-tint);
      box-shadow: inset 0 0 0 1px var(--accent-line);
    }
    .custom {
      display: flex;
      gap: 12px;
      color: var(--text-meta);
      font-size: 12px;
    }
    input {
      margin-left: 6px;
      background: var(--surface-raised);
      color: var(--text-primary);
      border: 1px solid var(--border-chip);
      border-radius: 6px;
      padding: 5px 8px;
      font: inherit;
      font-size: 13px;
      color-scheme: dark;
    }
  `,
})
export class RangeBar {
  protected readonly state = inject(DateRangeState);
  protected readonly presets = RANGE_PRESETS;

  protected set(end: 'from' | 'to', value: string) {
    this.state.setCustom({ ...this.state.range(), [end]: value || null });
  }
}
