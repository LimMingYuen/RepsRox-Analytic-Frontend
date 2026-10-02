import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { DateRangeState } from './core/date-range';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists every page in the nav', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Overview', 'Training', 'Fuel', 'Race sims', 'Body', 'Import']);
  });

  it('learns where the data ends, for the range presets', () => {
    TestBed.createComponent(App);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/overview')
      .flush({ lastDate: '2026-09-30' });
    expect(TestBed.inject(DateRangeState).latest()).toBe('2026-09-30');
  });
});
