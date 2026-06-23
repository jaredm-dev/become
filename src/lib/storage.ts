import type { AppState } from '../types';

const KEY = 'godmode.state.v1';

export const empty: AppState = {
  profile: null,
  weightLogs: [],
  workoutLogs: [],
  nutritionLogs: [],
  bodyMeasurements: [],
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

export function exportData(): string {
  const raw = localStorage.getItem(KEY) ?? JSON.stringify(empty);
  return raw;
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (typeof parsed !== 'object' || parsed === null) return false;
    localStorage.setItem(KEY, json);
    return true;
  } catch {
    return false;
  }
}
