import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** What a page shows while it loads, when the API cannot be reached, or when the range holds nothing. */
@Component({
  selector: 'app-state',
  imports: [RouterLink],
  template: `
    @switch (kind()) {
      @case ('loading') {
        <p>Loading…</p>
      }
      @case ('error') {
        <p class="error">Could not reach the analytics API.</p>
        <p>Is the backend running on <code>http://localhost:5080</code>?</p>
      }
      @case ('empty') {
        <p>Nothing in this range yet.</p>
        <p>
          Export a month from the app (Train → Export month) and
          <a routerLink="/import">import the CSV files</a>.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 32px 20px;
      text-align: center;
      color: var(--text-faint);
      background: var(--surface);
      border: 1px dashed var(--border-chip);
      border-radius: 10px;
    }
    p {
      margin: 4px 0;
      font-size: 13px;
    }
    .error {
      color: var(--text-primary);
    }
    a {
      color: var(--text-primary);
      text-decoration-color: var(--accent);
      text-underline-offset: 3px;
    }
  `,
})
export class StateNote {
  readonly kind = input.required<'loading' | 'error' | 'empty'>();
}
