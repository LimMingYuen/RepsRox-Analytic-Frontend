import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  DateRange,
  ExerciseProgress,
  ExerciseSummary,
  ImportResult,
  Interval,
  LegStats,
  NutritionDay,
  Overview,
  Race,
  Session,
  SessionDetail,
  SheetImport,
  VolumePoint,
  WeightPoint,
} from './models';

/** The backend, reached on the same origin under `/api` (the dev server proxies it; see proxy.conf.json). */
@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);

  overview(range: DateRange) {
    return this.http.get<Overview>('/api/overview', { params: rangeParams(range) });
  }

  sessions(range: DateRange) {
    return this.http.get<Session[]>('/api/training/sessions', { params: rangeParams(range) });
  }

  session(id: number) {
    return this.http.get<SessionDetail>(`/api/training/sessions/${id}`);
  }

  volume(range: DateRange, interval: Interval) {
    return this.http.get<VolumePoint[]>('/api/training/volume', {
      params: rangeParams(range).set('interval', interval),
    });
  }

  exercises(range: DateRange) {
    return this.http.get<ExerciseSummary[]>('/api/training/exercises', {
      params: rangeParams(range),
    });
  }

  progress(exercise: string, range: DateRange) {
    return this.http.get<ExerciseProgress[]>('/api/training/progress', {
      params: rangeParams(range).set('exercise', exercise),
    });
  }

  nutrition(range: DateRange) {
    return this.http.get<NutritionDay[]>('/api/nutrition/daily', { params: rangeParams(range) });
  }

  races(range: DateRange) {
    return this.http.get<Race[]>('/api/races', { params: rangeParams(range) });
  }

  legs(range: DateRange) {
    return this.http.get<LegStats[]>('/api/races/legs', { params: rangeParams(range) });
  }

  weight(range: DateRange) {
    return this.http.get<WeightPoint[]>('/api/weight', { params: rangeParams(range) });
  }

  imports() {
    return this.http.get<SheetImport[]>('/api/imports');
  }

  upload(files: File[]) {
    const form = new FormData();
    for (const file of files) form.append('files', file, file.name);
    return this.http.post<ImportResult[]>('/api/imports', form);
  }

  deleteImport(id: number) {
    return this.http.delete<void>(`/api/imports/${id}`);
  }
}

export function rangeParams(range: DateRange): HttpParams {
  let params = new HttpParams();
  if (range.from) params = params.set('from', range.from);
  if (range.to) params = params.set('to', range.to);
  return params;
}
