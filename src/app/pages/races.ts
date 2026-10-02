import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { delta, hours, longDate, minutes, shortDate } from '../core/format';
import { BAR, C, LINE, baseOptions, clockStep } from '../shared/chart-theme';
import { ChartView } from '../shared/chart';
import { RangeBar } from '../shared/range-bar';
import { StatTile } from '../shared/stat-tile';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-races',
  imports: [RangeBar, StatTile, ChartView, StateNote],
  template: `
    <div class="page-head">
      <h1>Race sims</h1>
      <p>Eight runs and eight stations, leg by leg</p>
    </div>
    <app-range-bar />

    @if (races.error()) {
      <app-state kind="error" />
    } @else if (!races.value()) {
      <app-state kind="loading" />
    } @else if (races.value()!.length === 0) {
      <app-state kind="empty" />
    } @else {
      @let s = summary();
      <div class="tiles">
        <app-stat label="Sims raced" [value]="'' + s.count" [note]="s.complete + ' finished'" />
        <app-stat label="Best finish" [value]="s.best == null ? '—' : hours(s.best)" />
        <app-stat
          label="Latest finish"
          [value]="s.latest == null ? '—' : hours(s.latest)"
          [note]="s.latestDate ? longDate(s.latestDate) : ''"
        />
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Finish time</h2>
              <p>Finished sims only — lower is faster</p>
            </div>
          </div>
          <app-chart
            [config]="finishChart()"
            label="Line chart of race sim finish times"
            [height]="380"
          />
        </section>
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Legs against target</h2>
              <p>Your average split for each leg</p>
            </div>
            <div class="legend">
              <span style="--swatch: var(--accent)">Average</span>
              <span style="--swatch: var(--second)">Target</span>
            </div>
          </div>
          <app-chart
            [config]="legsChart()"
            label="Bar chart of average split per leg against its target"
            [height]="380"
          />
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Splits</h2>
            <p>Against target: minus is ahead of it</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Leg</th>
                <th></th>
                <th class="num">Target</th>
                <th class="num">Average</th>
                <th class="num">Best</th>
                <th class="num">Latest</th>
                <th class="num">Avg vs target</th>
              </tr>
            </thead>
            <tbody>
              @for (l of legs.value() ?? []; track l.position) {
                <tr>
                  <td>{{ l.tag }}</td>
                  <td>{{ l.name }}</td>
                  <td class="num muted">
                    {{ l.targetSeconds == null ? '—' : minutes(l.targetSeconds) }}
                  </td>
                  <td class="num">{{ minutes(l.avgSeconds) }}</td>
                  <td class="num">{{ minutes(l.bestSeconds) }}</td>
                  <td class="num">{{ minutes(l.latestSeconds) }}</td>
                  <td
                    class="num"
                    [class.faster]="l.targetSeconds != null && l.avgSeconds < l.targetSeconds"
                    [class.slower]="l.targetSeconds != null && l.avgSeconds > l.targetSeconds"
                  >
                    {{ l.targetSeconds == null ? '—' : delta(l.avgSeconds - l.targetSeconds) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Sims</h2></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="num">Time</th>
                <th>Result</th>
                <th class="num">Legs raced</th>
              </tr>
            </thead>
            <tbody>
              @for (r of races.value(); track r.id) {
                <tr>
                  <td>{{ longDate(r.date) }}</td>
                  <td class="num">{{ hours(r.totalSeconds) }}</td>
                  <td>{{ r.complete ? 'Finished' : 'Ended early' }}</td>
                  <td class="num">{{ r.legs.length }} / 16</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export default class RacesPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly races = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.races(params),
  });
  protected readonly legs = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.legs(params),
  });

  protected readonly summary = computed(() => {
    const races = this.races.value() ?? [];
    const finished = races.filter((r) => r.complete);
    const latest = finished[0];
    return {
      count: races.length,
      complete: finished.length,
      best: finished.length ? Math.min(...finished.map((r) => r.totalSeconds)) : null,
      latest: latest?.totalSeconds ?? null,
      latestDate: latest?.date ?? null,
    };
  });

  protected readonly finishChart = computed<ChartConfiguration>(() => {
    const finished = (this.races.value() ?? []).filter((r) => r.complete).reverse();
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(finished[items[0].dataIndex].date),
      label: (item) => ` ${hours(item.raw as number)}`,
    };
    const times = finished.map((r) => r.totalSeconds);
    const step = clockStep(times.length ? Math.max(...times) - Math.min(...times) : 0);
    // Pinned to whole steps either side, or Chart.js picks its own ends and the steps go odd.
    if (times.length)
      Object.assign(options.scales!['y']!, {
        min: Math.floor(Math.min(...times) / step) * step - step,
        max: Math.ceil(Math.max(...times) / step) * step + step,
      });
    Object.assign(options.scales!['y']!.ticks as any, {
      callback: (v: number) => hours(v),
      stepSize: step,
    });
    return {
      type: 'line',
      data: {
        labels: finished.map((r) => shortDate(r.date)),
        datasets: [
          {
            label: 'Finish',
            data: finished.map((r) => r.totalSeconds),
            ...LINE,
            borderColor: C.accent,
            backgroundColor: C.accent,
            pointBackgroundColor: C.accent,
            pointRadius: 4,
            pointBorderWidth: 2,
            pointBorderColor: C.surface,
            tension: 0,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly legsChart = computed<ChartConfiguration>(() => {
    const legs = this.legs.value() ?? [];
    const options = baseOptions();
    (options as any).indexAxis = 'y';
    options.plugins!.tooltip!.callbacks = {
      title: (items) => `${legs[items[0].dataIndex].tag} · ${legs[items[0].dataIndex].name}`,
      label: (item) => ` ${item.dataset.label}: ${minutes(item.raw as number)}`,
    };
    // Horizontal: the value axis is x, the legs run down y.
    options.scales = {
      x: {
        ...options.scales!['y'],
        ticks: {
          ...(options.scales!['y']!.ticks as any),
          callback: (v: number) => minutes(v),
          stepSize: 60,
        },
      },
      // Every leg named: sixteen fit, and a skipped one would leave its bars unlabelled.
      y: {
        ...options.scales!['x'],
        ticks: { ...(options.scales!['x']!.ticks as any), autoSkip: false },
      },
    } as any;
    return {
      type: 'bar',
      data: {
        labels: legs.map((l) => l.tag),
        datasets: [
          {
            label: 'Average',
            data: legs.map((l) => l.avgSeconds),
            backgroundColor: C.accent,
            hoverBackgroundColor: C.accent,
            ...BAR,
            maxBarThickness: 8,
            borderSkipped: 'left',
          },
          {
            label: 'Target',
            data: legs.map((l) => l.targetSeconds),
            backgroundColor: C.second,
            hoverBackgroundColor: C.second,
            ...BAR,
            maxBarThickness: 8,
            borderSkipped: 'left',
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly delta = delta;
  protected readonly hours = hours;
  protected readonly longDate = longDate;
  protected readonly minutes = minutes;
}
