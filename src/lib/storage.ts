import type { AppState } from '../types';

const KEY = 'godmode.state.v1';

export const empty: AppState = {
  profile: null,
  weightLogs: [],
  workoutLogs: [],
  nutritionLogs: [],
  programStartDate: null,
  program: null,
};

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function save(s: AppState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function reset() {
  localStorage.removeItem(KEY);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
