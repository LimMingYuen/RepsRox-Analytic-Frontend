import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { hours, kilos, longDate, shortDate, signedKilos, thousands, volume } from '../core/format';
import { BAR, C, LINE, baseOptions } from '../shared/chart-theme';
import { ChartView } from '../shared/chart';
import { RangeBar } from '../shared/range-bar';
import { StatTile } from '../shared/stat-tile';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-overview',
  imports: [RangeBar, StatTile, ChartView, StateNote],
  template: `
    <div class="page-head">
      <h1>Overview</h1>
      @if (o(); as o) {
        @if (o.firstDate) {
          <p>{{ longDate(o.firstDate) }} – {{ longDate(o.lastDate) }}</p>
        }
      }
    </div>
    <app-range-bar />

    @if (overview.error()) {
      <app-state kind="error" />
    } @else if (!o()) {
      <app-state kind="loading" />
    } @else if (!o()!.firstDate) {
      <app-state kind="empty" />
    } @else {
      @let t = o()!;
      <div class="tiles">
        <app-stat
          label="Sessions"
          [value]="thousands(t.training.sessions)"
          [note]="thousands(t.training.sets) + ' sets worked'"
        />
        <app-stat
          label="Volume moved"
          [value]="volume(t.training.volumeKg)"
          note="Reps × load; metres left out"
        />
        <app-stat label="Time training" [value]="(t.training.minutes / 60).toFixed(1)" unit="h" />
        <app-stat
          label="Avg kcal a day"
          [value]="thousands(t.nutrition.avgKcal)"
          [note]="t.nutrition.daysLogged + ' days with meals checked in'"
        />
        <app-stat label="Avg protein a day" [value]="thousands(t.nutrition.avgProteinG)" unit="g" />
        <app-stat
          label="Best race sim"
          [value]="t.races.bestSeconds == null ? '—' : hours(t.races.bestSeconds)"
          [note]="t.races.completed + ' of ' + t.races.count + ' sims finished'"
        />
        <app-stat
          label="Weight"
          [value]="kilos(t.weight.latestKg)"
          unit="kg"
          [note]="signedKilos(t.weight.changeKg) + ' kg over the range'"
        />
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Weekly volume</h2>
              <p>Kilograms moved, Monday to Sunday</p>
            </div>
          </div>
          <app-chart [config]="volumeChart()" label="Bar chart of kilograms moved each week" />
        </section>
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Weight trend</h2>
              <p>Seven-day average of weigh-ins, kg</p>
            </div>
          </div>
          <app-chart [config]="weightChart()" label="Line chart of the seven-day weight trend" />
        </section>
      </div>
    }
  `,
})
export default class OverviewPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly overview = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.overview(params),
  });
  private readonly weeks = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.volume(params, 'Week'),
  });
  private readonly weight = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.weight(params),
  });

  protected readonly o = computed(() => this.overview.value());

  protected readonly volumeChart = computed<ChartConfiguration>(() => {
    const weeks = this.weeks.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => `Week of ${longDate(weeks[items[0].dataIndex].period)}`,
      label: (item) => ` ${volume(item.raw as number)}`,
      afterLabel: (item) =>
        `${weeks[item.dataIndex].sessions} sessions · ${weeks[item.dataIndex].sets} sets`,
    };
    (options.scales!['y']!.ticks as any).callback = (v: number) => volume(v);
    return {
      type: 'bar',
      data: {
        labels: weeks.map((w) => shortDate(w.period)),
        datasets: [
          {
            label: 'Volume',
            data: weeks.map((w) => w.volumeKg),
            backgroundColor: C.accent,
            hoverBackgroundColor: C.accent,
            ...BAR,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly weightChart = computed<ChartConfiguration>(() => {
    const points = this.weight.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(points[items[0].dataIndex].date),
      label: (item) => ` Trend ${kilos(item.raw as number)} kg`,
      afterLabel: (item) => `Weighed ${kilos(points[item.dataIndex].weightKg)} kg`,
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
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly hours = hours;
  protected readonly kilos = kilos;
  protected readonly longDate = longDate;
  protected readonly signedKilos = signedKilos;
  protected readonly thousands = thousands;
  protected readonly volume = volume;
}
