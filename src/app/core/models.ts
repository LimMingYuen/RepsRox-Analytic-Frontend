/** Shapes the RepsRox Analytic API returns. Dates are ISO `yyyy-MM-dd` strings. */

export type SheetKind = 'Training' | 'Meals' | 'Races' | 'Weight';
export type SetUnit = 'Reps' | 'Metres';
export type Interval = 'Week' | 'Month';

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface ImportResult {
  fileName: string;
  imported: boolean;
  kind: SheetKind | null;
  month: string | null;
  rows: number;
  replaced: boolean;
  error: string | null;
}

export interface SheetImport {
  id: number;
  kind: SheetKind;
  month: string;
  fileName: string;
  rowCount: number;
  importedAtUtc: string;
}

export interface Overview {
  firstDate: string | null;
  lastDate: string | null;
  training: { sessions: number; sets: number; volumeKg: number; minutes: number };
  nutrition: {
    daysLogged: number;
    mealsPlanned: number;
    mealsLogged: number;
    avgKcal: number | null;
    avgProteinG: number | null;
    avgCarbsG: number | null;
  };
  races: { count: number; completed: number; bestSeconds: number | null };
  weight: { latestDate: string | null; latestKg: number | null; changeKg: number | null };
}

export interface TopSet {
  exercise: string;
  reps: number;
  weightKg: number;
}

export interface Session {
  id: number;
  date: string;
  name: string;
  durationSeconds: number;
  exercises: number;
  sets: number;
  volumeKg: number;
  topSet: TopSet | null;
}

export interface SessionDetail {
  id: number;
  date: string;
  name: string;
  durationSeconds: number;
  exercises: {
    name: string;
    sets: { setNumber: number; amount: number; unit: SetUnit; weightKg: number | null }[];
  }[];
}

export interface VolumePoint {
  period: string;
  sessions: number;
  sets: number;
  volumeKg: number;
  minutes: number;
}

export interface ExerciseSummary {
  name: string;
  unit: SetUnit;
  sessions: number;
  sets: number;
  volumeKg: number;
  bestWeightKg: number | null;
  bestEstimated1RmKg: number | null;
  lastDate: string;
}

export interface ExerciseProgress {
  date: string;
  sets: number;
  totalAmount: number;
  topWeightKg: number | null;
  volumeKg: number;
  estimated1RmKg: number | null;
}

export interface NutritionDay {
  date: string;
  mealsPlanned: number;
  mealsLogged: number;
  plannedKcal: number;
  plannedProteinG: number;
  plannedCarbsG: number;
  loggedKcal: number;
  loggedProteinG: number;
  loggedCarbsG: number;
}

export interface RaceLeg {
  position: number;
  tag: string;
  name: string;
  seconds: number;
  targetSeconds: number | null;
}

export interface Race {
  id: number;
  date: string;
  totalSeconds: number;
  complete: boolean;
  legs: RaceLeg[];
}

export interface LegStats {
  position: number;
  tag: string;
  name: string;
  targetSeconds: number | null;
  races: number;
  avgSeconds: number;
  bestSeconds: number;
  latestSeconds: number;
}

export interface WeightPoint {
  date: string;
  weightKg: number;
  trendKg: number;
}
