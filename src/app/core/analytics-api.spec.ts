import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalyticsApi } from './analytics-api';

describe('AnalyticsApi', () => {
  let api: AnalyticsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AnalyticsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the ends of the range that are set', () => {
    api.sessions({ from: '2026-08-01', to: null }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/training/sessions');
    expect(req.request.params.get('from')).toBe('2026-08-01');
    expect(req.request.params.has('to')).toBe(false);
    req.flush([]);
  });

  it('puts the exercise name in the query, where spaces and slashes are safe', () => {
    api.progress('Bench press / close', { from: null, to: null }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/training/progress');
    expect(req.request.params.get('exercise')).toBe('Bench press / close');
    req.flush([]);
  });

  it('uploads every file under "files"', () => {
    const files = [
      new File(['a'], 'repsrox-meals-2026-08.csv'),
      new File(['b'], 'repsrox-weight-2026-08.csv'),
    ];
    api.upload(files).subscribe();
    const req = http.expectOne('/api/imports');
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).getAll('files').length).toBe(2);
    req.flush([]);
  });
});
