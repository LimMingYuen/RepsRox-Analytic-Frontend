import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { kilos, longDate, shortDate, signedKilos } from '../core/format';
import { C, LINE, baseOptions } from '../shared/chart-theme';
import { ChartView } from '../shared/chart';
import { RangeBar } from '../shared/range-bar';
import { StatTile } from '../shared/stat-tile';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-weight',
  imports: [RangeBar, StatTile, ChartView, StateNote],
  template: `
    <div class="page-head">
      <h1>Body</h1>
      <p>Weigh-ins and their seven-day trend</p>
    </div>
    <app-range-bar />

    @if (points.error()) {
      <app-state kind="error" />
    } @else if (!points.value()) {
      <app-state kind="loading" />
    } @else if (points.value()!.length === 0) {
      <app-state kind="empty" />
    } @else {
      @let s = summary();
      <div class="tiles">
        <app-stat
          label="Latest"
          [value]="kilos(s.latest.weightKg)"
          unit="kg"
          [note]="longDate(s.latest.date)"
        />
        <app-stat
          label="Trend"
          [value]="kilos(s.latest.trendKg)"
          unit="kg"
          note="Seven-day average"
        />
        <app-stat
          label="Change over range"
          [value]="signedKilos(s.change)"
          unit="kg"
          [note]="'by trend, since ' + longDate(s.first.date)"
        />
        <app-stat
          label="Lightest"
          [value]="kilos(s.low)"
          unit="kg"
          [note]="'heaviest ' + kilos(s.high) + ' kg · ' + s.count + ' weigh-ins'"
        />
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Weight</h2>
            <p>Kilograms</p>
          </div>
          <div class="legend">
            <span class="line" style="--swatch: var(--accent)">Trend</span>
            <span style="--swatch: var(--second)">Weigh-in</span>
          </div>
        </div>
        <app-chart
          [config]="chart()"
          label="Weigh-ins with their seven-day trend line"
          [height]="320"
        />
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Weigh-ins</h2></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="num">Weight kg</th>
                <th class="num">Trend kg</th>
              </tr>
            </thead>
            <tbody>
              @for (p of showAll() ? newestFirst() : newestFirst().slice(0, PAGE); track p.date) {
                <tr>
                  <td>{{ longDate(p.date) }}</td>
                  <td class="num">{{ kilos(p.weightKg) }}</td>
                  <td class="num muted">{{ kilos(p.trendKg) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!showAll() && newestFirst().length > PAGE) {
          <button class="action more" type="button" (click)="showAll.set(true)">
            Show all {{ newestFirst().length }} weigh-ins
          </button>
        }
      </section>
    }
  `,
})
export default class WeightPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly points = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.weight(params),
  });

  protected readonly showAll = signal(false);
  protected readonly PAGE = 14;

  protected readonly newestFirst = computed(() => [...(this.points.value() ?? [])].reverse());

  protected readonly summary = computed(() => {
    const points = this.points.value()!;
    const first = points[0];
    const latest = points[points.length - 1];
    const kg = points.map((p) => p.weightKg);
    return {
      first,
      latest,
      change: latest.trendKg - first.trendKg,
      low: Math.min(...kg),
      high: Math.max(...kg),
      count: points.length,
    };
  });

  protected readonly chart = computed<ChartConfiguration>(() => {
    const points = this.points.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(points[items[0].dataIndex].date),
      label: (item) => ` ${item.dataset.label}: ${kilos(item.raw as number)} kg`,
    };
    return {
      type: 'line',
      data: {
        labels: points.map((p) => shortDate(p.date)),
        datasets: [
          {
            label: 'Trend',
            data: points.map((p) => p.trendKg),
            borderColor: C.accent,
            backgroundColor: C.accent,
            pointHoverBackgroundColor: C.accent,
            ...LINE,
            order: 1,
          },
          {
            label: 'Weigh-in',
            data: points.map((p) => p.weightKg),
            showLine: false,
            backgroundColor: C.second,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderWidth: 2,
            pointBorderColor: C.surface,
            order: 2,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly kilos = kilos;
  protected readonly longDate = longDate;
  protected readonly signedKilos = signedKilos;
}
