import type { AppState } from '../types';
import { macroTargets } from './calculations';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

// Walk backwards from today, counting consecutive days that satisfy `hit`.
function streak(hit: (date: string) => boolean): number {
  let n = 0;
  for (let i = 0; i < 366; i++) {
    const date = daysAgo(i);
    if (hit(date)) n++;
    else break;
  }
  return n;
}

export interface Streaks {
  workout: number;       // days with workout OR rest day
  protein: number;       // days hit protein target
  weighIn: number;       // days logged weight
  overall: number;       // min of the three
}

export function computeStreaks(state: AppState): Streaks {
  if (!state.profile) return { workout: 0, protein: 0, weighIn: 0, overall: 0 };
  const targets = macroTargets(state.profile);
  const workoutByDate = new Set(state.workoutLogs.map(w => w.date));
  const proteinByDate = new Map(state.nutritionLogs.map(n => [n.date, n.proteinG]));
  const weightByDate = new Set(state.weightLogs.map(w => w.date));

  const workout = streak(d => workoutByDate.has(d));
  const protein = streak(d => (proteinByDate.get(d) ?? 0) >= targets.proteinG * 0.9);
  const weighIn = streak(d => weightByDate.has(d));
  const overall = Math.min(workout, protein, weighIn);
  return { workout, protein, weighIn, overall };
}

// Phrasing for streaks — tied to the title's transformation, not Duolingo flames.
export function streakPhrase(s: Streaks): string {
  if (s.overall >= 30) return `${s.overall} days. The transformation is no longer a phase. It's who you are.`;
  if (s.overall >= 14) return `${s.overall} days locked in. The old you is unrecognizable.`;
  if (s.overall >= 7) return `${s.overall} consecutive days hitting everything. The title cracks deeper.`;
  if (s.overall >= 3) return `${s.overall} days clean. Don't be the person who broke it on day ${s.overall + 1}.`;
  if (s.protein >= 5) return `${s.protein} days of protein hit. Muscle is being built right now.`;
  if (s.workout >= 5) return `${s.workout} workouts in a row. Discipline is showing up.`;
  if (s.weighIn >= 5) return `${s.weighIn} days of weigh-ins. Measurement is the first step.`;
  return 'Start a streak. Hit protein, hit workouts, weigh in. The title moves only with consistency.';
}

// Weekly summary for share card
export interface WeekSummary {
  weekNum: number;
  weightStart: number | null;
  weightEnd: number | null;
  weightDelta: number;
  workoutsHit: number;
  workoutsPlanned: number;
  proteinDaysHit: number;
  daysLogged: number;
  startDate: string;
  endDate: string;
}

export function weekSummary(state: AppState): WeekSummary {
  const p = state.profile!;
  const programStart = state.programStartDate || p.createdAt;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // last 7 days
  const startISO = isoDate(startDate);
  const endISO = isoDate(new Date());

  const targets = macroTargets(p);
  const weekLogs = state.nutritionLogs.filter(n => n.date >= startISO && n.date <= endISO);
  const weekWorkouts = state.workoutLogs.filter(w => w.date >= startISO && w.date <= endISO);
  const weekWeights = state.weightLogs.filter(w => w.date >= startISO && w.date <= endISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weightStart = weekWeights[0]?.weightLb ?? null;
  const weightEnd = weekWeights[weekWeights.length - 1]?.weightLb ?? null;
  const weightDelta = (weightStart != null && weightEnd != null) ? +(weightEnd - weightStart).toFixed(1) : 0;
  const proteinDaysHit = weekLogs.filter(n => n.proteinG >= targets.proteinG * 0.9).length;
  const daysLogged = weekLogs.length;
  const workoutsHit = weekWorkouts.length;

  // How many planned lifting+cardio days were in the past week
  const workoutsPlanned = (p.liftDays || 0) + (p.cardioDays || 0);

  const weekNum = Math.max(1, Math.floor(
    (Date.now() - new Date(programStart).getTime()) / (7 * 86_400_000)
  ) + 1);

  return {
    weekNum,
    weightStart,
    weightEnd,
    weightDelta,
    workoutsHit,
    workoutsPlanned,
    proteinDaysHit,
    daysLogged,
    startDate: startISO,
    endDate: endISO,
  };
}
