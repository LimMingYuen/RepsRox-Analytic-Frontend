import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnalyticsApi } from './core/analytics-api';
import { DateRangeState } from './core/date-range';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly nav = [
    { path: '/overview', label: 'Overview' },
    { path: '/training', label: 'Training' },
    { path: '/nutrition', label: 'Fuel' },
    { path: '/races', label: 'Race sims' },
    { path: '/weight', label: 'Body' },
    { path: '/import', label: 'Import' },
  ];

  constructor() {
    // Range presets count back from the newest data, so learn where that is.
    const range = inject(DateRangeState);
    inject(AnalyticsApi)
      .overview({ from: null, to: null })
      .subscribe({ next: (o) => range.latest.set(o.lastDate), error: () => {} });
  }
}
