import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { longDate, monthLabel } from '../core/format';
import { ImportResult, SheetImport } from '../core/models';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-import',
  imports: [StateNote],
  template: `
    <div class="page-head">
      <h1>Import</h1>
      <p>Bring in the CSV files the app's Export month shares</p>
    </div>

    <section class="panel">
      <label
        class="drop"
        [class.over]="over()"
        (dragover)="$event.preventDefault(); over.set(true)"
        (dragleave)="over.set(false)"
        (drop)="drop($event)"
      >
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          (change)="pick($event)"
          [disabled]="busy()"
        />
        <span class="big">{{ busy() ? 'Importing…' : 'Drop CSV files here, or choose them' }}</span>
        <span class="muted"
          >training, meals, races and weight — one month or several at once. A month sent again
          replaces what it held.</span
        >
      </label>

      @if (results().length) {
        <ul class="results" aria-live="polite">
          @for (r of results(); track $index) {
            <li [class.bad]="!r.imported">
              <span class="badge">{{
                r.imported ? (r.replaced ? 'Replaced' : 'Added') : 'Skipped'
              }}</span>
              <span class="file">{{ r.fileName }}</span>
              @if (r.imported) {
                <span class="muted"
                  >{{ r.kind }} · {{ monthLabel(r.month!) }} · {{ r.rows }} rows</span
                >
              } @else {
                <span class="error">{{ r.error }}</span>
              }
            </li>
          }
        </ul>
      }
      @if (uploadError()) {
        <p class="error">{{ uploadError() }}</p>
      }
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Imported months</h2>
          <p>Each sheet a month; delete one to take its rows out of every chart</p>
        </div>
      </div>
      @if (imports.error()) {
        <app-state kind="error" />
      } @else if (byMonth().length === 0) {
        <p class="muted">Nothing imported yet.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Sheet</th>
                <th>File</th>
                <th class="num">Rows</th>
                <th>Imported</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (group of byMonth(); track group.month) {
                @for (i of group.sheets; track i.id; let first = $first) {
                  <tr>
                    <td>
                      @if (first) {
                        {{ monthLabel(group.month) }}
                      }
                    </td>
                    <td>{{ i.kind }}</td>
                    <td class="muted">{{ i.fileName }}</td>
                    <td class="num">{{ i.rowCount }}</td>
                    <td class="muted">{{ longDate(i.importedAtUtc.slice(0, 10)) }}</td>
                    <td class="num">
                      @if (confirming() === i.id) {
                        <button class="action small" type="button" (click)="confirming.set(null)">
                          Keep
                        </button>
                        <button class="action small accent" type="button" (click)="remove(i)">
                          Delete
                        </button>
                      } @else {
                        <button
                          class="action small"
                          type="button"
                          (click)="confirming.set(i.id)"
                          [attr.aria-label]="'Delete ' + i.fileName"
                        >
                          Delete
                        </button>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 36px 20px;
      border: 1px dashed var(--border-action);
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
    }
    .drop:hover,
    .drop.over {
      border-color: var(--accent);
      background: var(--accent-wash);
    }
    .drop input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
    .drop:focus-within {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .big {
      font-family: var(--font-figure);
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .results {
      list-style: none;
      padding: 0;
      margin: 16px 0 0;
    }
    .results li {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: baseline;
      padding: 8px 0;
      border-bottom: 1px solid var(--hairline);
      font-size: 13px;
    }
    .badge {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 1px 7px;
      border-radius: 4px;
      border: 1px solid var(--accent-line);
    }
    .bad .badge {
      border-color: var(--border-action);
      color: var(--text-subtle);
    }
    .error {
      color: #ec835a;
    }
    td .action + .action {
      margin-left: 6px;
    }
  `,
})
export default class ImportPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly over = signal(false);
  protected readonly busy = signal(false);
  protected readonly results = signal<ImportResult[]>([]);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly confirming = signal<number | null>(null);

  protected readonly imports = rxResource({ stream: () => this.api.imports() });

  protected readonly byMonth = computed(() => {
    const groups = new Map<string, SheetImport[]>();
    for (const i of this.imports.value() ?? [])
      groups.set(i.month, [...(groups.get(i.month) ?? []), i]);
    return [...groups].map(([month, sheets]) => ({ month, sheets }));
  });

  protected drop(event: DragEvent) {
    event.preventDefault();
    this.over.set(false);
    this.upload([...(event.dataTransfer?.files ?? [])]);
  }

  protected pick(event: Event) {
    const input = event.target as HTMLInputElement;
    this.upload([...(input.files ?? [])]);
    input.value = '';
  }

  private upload(files: File[]) {
    if (!files.length || this.busy()) return;
    this.busy.set(true);
    this.uploadError.set(null);
    this.api.upload(files).subscribe({
      next: (results) => {
        this.results.set(results);
        this.refresh();
      },
      error: () => {
        this.uploadError.set('The upload did not reach the analytics API. Is the backend running?');
        this.busy.set(false);
      },
      complete: () => this.busy.set(false),
    });
  }

  protected remove(sheet: SheetImport) {
    this.confirming.set(null);
    this.api
      .deleteImport(sheet.id)
      .subscribe({ next: () => this.refresh(), error: () => this.refresh() });
  }

  /** The list, and where the newest data now ends — the range presets count back from it. */
  private refresh() {
    this.imports.reload();
    this.api
      .overview({ from: null, to: null })
      .subscribe({ next: (o) => this.range.latest.set(o.lastDate), error: () => {} });
  }

  protected readonly longDate = longDate;
  protected readonly monthLabel = monthLabel;
}
