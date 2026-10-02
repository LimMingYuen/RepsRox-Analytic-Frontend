import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { kilos, longDate, minutes, monthLabel, shortDate, thousands, volume } from '../core/format';
import { Interval, SetUnit } from '../core/models';
import { BAR, C, LINE, baseOptions } from '../shared/chart-theme';
import { ChartView } from '../shared/chart';
import { RangeBar } from '../shared/range-bar';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-training',
  imports: [RangeBar, ChartView, StateNote],
  template: `
    <div class="page-head">
      <h1>Training</h1>
      <p>Strength sessions banked on the live screen</p>
    </div>
    <app-range-bar />

    @if (sessions.error()) {
      <app-state kind="error" />
    } @else if (!sessions.value()) {
      <app-state kind="loading" />
    } @else if (sessions.value()!.length === 0) {
      <app-state kind="empty" />
    } @else {
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Volume</h2>
            <p>
              Kilograms moved a {{ interval() === 'Week' ? 'week' : 'month' }} — reps × load, sets
              in metres left out
            </p>
          </div>
          <div class="segmented" role="group" aria-label="Group by">
            <button type="button" [class.on]="interval() === 'Week'" (click)="interval.set('Week')">
              Week
            </button>
            <button
              type="button"
              [class.on]="interval() === 'Month'"
              (click)="interval.set('Month')"
            >
              Month
            </button>
          </div>
        </div>
        <app-chart [config]="volumeChart()" label="Bar chart of training volume per period" />
      </section>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Exercises</h2>
              <p>Pick one to chart its progress</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th class="num">Sessions</th>
                  <th class="num">Sets</th>
                  <th class="num">Best kg</th>
                  <th class="num">Est. 1RM</th>
                </tr>
              </thead>
              <tbody>
                @for (e of exercises.value() ?? []; track e.name) {
                  <tr
                    class="clickable"
                    [class.selected]="e.name === selected()"
                    (click)="exercise.set(e.name)"
                    tabindex="0"
                    (keydown.enter)="exercise.set(e.name)"
                  >
                    <td>
                      {{ e.name }}
                      @if (e.unit === 'Metres') {
                        <span class="muted">· m</span>
                      }
                    </td>
                    <td class="num">{{ e.sessions }}</td>
                    <td class="num">{{ e.sets }}</td>
                    <td class="num">{{ kilos(e.bestWeightKg) }}</td>
                    <td class="num">{{ kilos(e.bestEstimated1RmKg) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>{{ selected() ?? 'Progress' }}</h2>
              <p>Heaviest set each session, and Epley's estimated one-rep max</p>
            </div>
            <div class="legend">
              <span class="line" style="--swatch: var(--accent)">Top set kg</span>
              @if (hasEstimate()) {
                <span class="line" style="--swatch: var(--second)">Est. 1RM kg</span>
              }
            </div>
          </div>
          @if (selected()) {
            <app-chart
              [config]="progressChart()"
              [label]="'Line chart of ' + selected() + ' progress'"
              [height]="300"
            />
          } @else {
            <p class="muted">Choose an exercise from the list.</p>
          }
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Sessions</h2>
            <p>{{ sessions.value()!.length }} in range — open one to see its sets</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th class="num">Duration</th>
                <th class="num">Exercises</th>
                <th class="num">Sets</th>
                <th class="num">Volume</th>
                <th>Top set</th>
              </tr>
            </thead>
            <tbody>
              @for (
                s of showAll() ? sessions.value()! : sessions.value()!.slice(0, PAGE);
                track s.id
              ) {
                <tr
                  class="clickable"
                  [class.selected]="s.id === openId()"
                  (click)="toggle(s.id)"
                  tabindex="0"
                  (keydown.enter)="toggle(s.id)"
                >
                  <td>{{ longDate(s.date) }}</td>
                  <td>{{ s.name }}</td>
                  <td class="num">{{ minutes(s.durationSeconds) }}</td>
                  <td class="num">{{ s.exercises }}</td>
                  <td class="num">{{ s.sets }}</td>
                  <td class="num">{{ volume(s.volumeKg) }}</td>
                  <td>
                    @if (s.topSet; as top) {
                      {{ top.exercise }} · {{ top.reps }} × {{ kilos(top.weightKg) }} kg
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                </tr>
                @if (s.id === openId()) {
                  <tr class="detail">
                    <td colspan="7">
                      @if (detail.value(); as d) {
                        @for (e of d.exercises; track e.name) {
                          <div class="ex">
                            <span class="ex-name">{{ e.name }}</span>
                            @for (set of e.sets; track set.setNumber) {
                              <span class="chip"
                                >{{ set.amount }}{{ set.unit === 'Metres' ? ' m' : '' }}
                                @if (set.weightKg != null) {
                                  × {{ kilos(set.weightKg) }}
                                }
                              </span>
                            }
                          </div>
                        }
                      } @else {
                        <span class="muted">Loading…</span>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        @if (!showAll() && sessions.value()!.length > PAGE) {
          <button class="action more" type="button" (click)="showAll.set(true)">
            Show all {{ sessions.value()!.length }} sessions
          </button>
        }
      </section>
    }
  `,
  styles: `
    .detail td {
      background: var(--surface-raised);
      white-space: normal;
    }
    .ex {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
    }
    .ex-name {
      min-width: 160px;
      color: var(--text-subtle);
    }
    .chip {
      font-variant-numeric: tabular-nums;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 5px;
      background: var(--accent-wash);
      border: 1px solid var(--border-chip);
    }
  `,
})
export default class TrainingPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly interval = signal<Interval>('Week');
  protected readonly exercise = signal<string | null>(null);
  protected readonly openId = signal<number | null>(null);
  protected readonly showAll = signal(false);
  protected readonly PAGE = 15;

  protected readonly sessions = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.sessions(params),
  });
  protected readonly exercises = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.exercises(params),
  });
  /** The exercise asked for, or else the one trained most often. */
  protected readonly selected = computed(
    () => this.exercise() ?? this.exercises.value()?.[0]?.name ?? null,
  );

  private readonly periods = rxResource({
    params: () => ({ range: this.range.range(), interval: this.interval() }),
    stream: ({ params }) => this.api.volume(params.range, params.interval),
  });
  private readonly progress = rxResource({
    params: () => {
      const name = this.selected();
      return name ? { name, range: this.range.range() } : undefined;
    },
    stream: ({ params }) => this.api.progress(params.name, params.range),
  });
  protected readonly detail = rxResource({
    params: () => this.openId() ?? undefined,
    stream: ({ params }) => this.api.session(params),
  });

  protected readonly hasEstimate = computed(() =>
    (this.progress.value() ?? []).some((p) => p.estimated1RmKg != null),
  );

  protected readonly volumeChart = computed<ChartConfiguration>(() => {
    const points = this.periods.value() ?? [];
    const byMonth = this.interval() === 'Month';
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) =>
        byMonth
          ? monthLabel(points[items[0].dataIndex].period)
          : `Week of ${longDate(points[items[0].dataIndex].period)}`,
      label: (item) => ` ${volume(item.raw as number)}`,
      afterLabel: (item) => {
        const p = points[item.dataIndex];
        return `${p.sessions} sessions · ${p.sets} sets · ${(p.minutes / 60).toFixed(1)} h`;
      },
    };
    (options.scales!['y']!.ticks as any).callback = (v: number) => volume(v);
    return {
      type: 'bar',
      data: {
        labels: points.map((p) => (byMonth ? monthLabel(p.period) : shortDate(p.period))),
        datasets: [
          {
            label: 'Volume',
            data: points.map((p) => p.volumeKg),
            backgroundColor: C.accent,
            hoverBackgroundColor: C.accent,
            ...BAR,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly progressChart = computed<ChartConfiguration>(() => {
    const points = this.progress.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(points[items[0].dataIndex].date),
      label: (item) => ` ${item.dataset.label}: ${kilos(item.raw as number)} kg`,
      afterBody: (items) => {
        const p = points[items[0].dataIndex];
        return `${p.sets} sets · ${thousands(p.totalAmount)} ${this.unitOf(this.selected()) === 'Metres' ? 'm' : 'reps'}`;
      },
    };
    const dot = {
      pointRadius: points.length > 40 ? 0 : 4,
      pointBorderWidth: 2,
      pointBorderColor: C.surface,
    };
    return {
      type: 'line',
      data: {
        labels: points.map((p) => shortDate(p.date)),
        datasets: [
          {
            label: 'Top set',
            data: points.map((p) => p.topWeightKg),
            borderColor: C.accent,
            backgroundColor: C.accent,
            pointBackgroundColor: C.accent,
            ...LINE,
            ...dot,
          },
          {
            label: 'Est. 1RM',
            data: points.map((p) => p.estimated1RmKg),
            borderColor: C.second,
            backgroundColor: C.second,
            pointBackgroundColor: C.second,
            ...LINE,
            ...dot,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected toggle(id: number) {
    this.openId.update((open) => (open === id ? null : id));
  }

  private unitOf(name: string | null): SetUnit | undefined {
    return this.exercises.value()?.find((e) => e.name === name)?.unit;
  }

  protected readonly kilos = kilos;
  protected readonly longDate = longDate;
  protected readonly minutes = minutes;
  protected readonly volume = volume;
}
