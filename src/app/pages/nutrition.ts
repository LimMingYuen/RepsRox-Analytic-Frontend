import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApi } from '../core/analytics-api';
import { DateRangeState } from '../core/date-range';
import { longDate, shortDate, thousands } from '../core/format';
import { BAR, C, LINE, baseOptions } from '../shared/chart-theme';
import { ChartView } from '../shared/chart';
import { RangeBar } from '../shared/range-bar';
import { StatTile } from '../shared/stat-tile';
import { StateNote } from '../shared/states';

@Component({
  selector: 'app-nutrition',
  imports: [RangeBar, StatTile, ChartView, StateNote],
  template: `
    <div class="page-head">
      <h1>Fuel</h1>
      <p>Meals planned, and the ones checked in as eaten</p>
    </div>
    <app-range-bar />

    @if (days.error()) {
      <app-state kind="error" />
    } @else if (!days.value()) {
      <app-state kind="loading" />
    } @else if (days.value()!.length === 0) {
      <app-state kind="empty" />
    } @else {
      @let s = summary();
      <div class="tiles">
        <app-stat
          label="Avg kcal eaten"
          [value]="thousands(s.kcal)"
          [note]="'over ' + s.eatenDays + ' days with check-ins'"
        />
        <app-stat label="Avg protein" [value]="thousands(s.protein)" unit="g" />
        <app-stat label="Avg carbs" [value]="thousands(s.carbs)" unit="g" />
        <app-stat
          label="Meals eaten as planned"
          [value]="s.adherence"
          unit="%"
          [note]="s.logged + ' of ' + s.planned + ' meals checked in'"
        />
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Calories a day</h2>
            <p>Eaten (checked in) against the day's plan</p>
          </div>
          <div class="legend">
            <span style="--swatch: var(--accent)">Eaten</span>
            <span class="line" style="--swatch: var(--second)">Planned</span>
          </div>
        </div>
        <app-chart
          [config]="kcalChart()"
          label="Daily calories eaten against planned"
          [height]="280"
        />
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Protein a day</h2>
            <p>Grams eaten</p>
          </div>
        </div>
        <app-chart
          [config]="proteinChart()"
          label="Line chart of daily protein eaten"
          [height]="220"
        />
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Days</h2></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="num">Meals</th>
                <th class="num">Kcal eaten</th>
                <th class="num">Kcal planned</th>
                <th class="num">Protein g</th>
                <th class="num">Carbs g</th>
              </tr>
            </thead>
            <tbody>
              @for (d of showAll() ? newestFirst() : newestFirst().slice(0, PAGE); track d.date) {
                <tr>
                  <td>{{ longDate(d.date) }}</td>
                  <td class="num">{{ d.mealsLogged }} / {{ d.mealsPlanned }}</td>
                  <td class="num">{{ thousands(d.loggedKcal) }}</td>
                  <td class="num muted">{{ thousands(d.plannedKcal) }}</td>
                  <td class="num">{{ d.loggedProteinG }}</td>
                  <td class="num">{{ d.loggedCarbsG }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!showAll() && newestFirst().length > PAGE) {
          <button class="action more" type="button" (click)="showAll.set(true)">
            Show all {{ newestFirst().length }} days
          </button>
        }
      </section>
    }
  `,
})
export default class NutritionPage {
  private readonly api = inject(AnalyticsApi);
  private readonly range = inject(DateRangeState);

  protected readonly days = rxResource({
    params: () => this.range.range(),
    stream: ({ params }) => this.api.nutrition(params),
  });

  protected readonly showAll = signal(false);
  protected readonly PAGE = 14;

  protected readonly newestFirst = computed(() => [...(this.days.value() ?? [])].reverse());

  protected readonly summary = computed(() => {
    const days = this.days.value() ?? [];
    const eaten = days.filter((d) => d.mealsLogged > 0);
    const avg = (pick: (d: (typeof days)[number]) => number) =>
      eaten.length ? eaten.reduce((sum, d) => sum + pick(d), 0) / eaten.length : null;
    const planned = days.reduce((n, d) => n + d.mealsPlanned, 0);
    const logged = days.reduce((n, d) => n + d.mealsLogged, 0);
    return {
      eatenDays: eaten.length,
      kcal: avg((d) => d.loggedKcal),
      protein: avg((d) => d.loggedProteinG),
      carbs: avg((d) => d.loggedCarbsG),
      planned,
      logged,
      adherence: planned ? String(Math.round((logged / planned) * 100)) : '—',
    };
  });

  protected readonly kcalChart = computed<ChartConfiguration>(() => {
    const days = this.days.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(days[items[0].dataIndex].date),
      label: (item) => ` ${item.dataset.label}: ${thousands(item.raw as number)} kcal`,
      afterBody: (items) =>
        `${days[items[0].dataIndex].mealsLogged} of ${days[items[0].dataIndex].mealsPlanned} meals eaten`,
    };
    return {
      type: 'bar',
      data: {
        labels: days.map((d) => shortDate(d.date)),
        datasets: [
          {
            type: 'bar',
            label: 'Eaten',
            data: days.map((d) => d.loggedKcal),
            backgroundColor: C.accent,
            hoverBackgroundColor: C.accent,
            order: 2,
            ...BAR,
          },
          {
            type: 'line',
            label: 'Planned',
            data: days.map((d) => d.plannedKcal),
            borderColor: C.second,
            backgroundColor: C.second,
            pointHoverBackgroundColor: C.second,
            order: 1,
            ...LINE,
            tension: 0,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly proteinChart = computed<ChartConfiguration>(() => {
    const days = this.days.value() ?? [];
    const options = baseOptions();
    options.plugins!.tooltip!.callbacks = {
      title: (items) => longDate(days[items[0].dataIndex].date),
      label: (item) => ` ${item.raw} g protein`,
    };
    return {
      type: 'line',
      data: {
        labels: days.map((d) => shortDate(d.date)),
        datasets: [
          {
            label: 'Protein',
            data: days.map((d) => d.loggedProteinG),
            borderColor: C.accent,
            backgroundColor: C.accentWash,
            fill: 'origin',
            pointHoverBackgroundColor: C.accent,
            ...LINE,
          },
        ],
      },
      options,
    } as ChartConfiguration;
  });

  protected readonly longDate = longDate;
  protected readonly thousands = thousands;
}
