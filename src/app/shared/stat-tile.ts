import { Component, input } from '@angular/core';

/** A label, one figure, and an optional note beneath — for a number that needs no chart. */
@Component({
  selector: 'app-stat',
  template: `
    <div class="label">{{ label() }}</div>
    <div class="value">
      {{ value() }}
      @if (unit()) {
        <span class="unit">{{ unit() }}</span>
      }
    </div>
    @if (note()) {
      <div class="note">{{ note() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
    }
    .label {
      color: var(--text-meta);
      font-size: 12px;
    }
    .value {
      font-family: var(--font-figure);
      font-size: 30px;
      font-weight: 500;
      margin-top: 6px;
      line-height: 1.1;
    }
    .unit {
      font-family: var(--font-text);
      font-size: 13px;
      color: var(--text-secondary);
      margin-left: 4px;
    }
    .note {
      color: var(--text-faint);
      font-size: 12px;
      margin-top: 6px;
    }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input<string>();
  readonly note = input<string>();
}
