// Compatibility shim: previously workouts.ts held the static programs.
// Now programs are dynamically generated and stored in AppState.program.
// This file just exposes accessors used by views.

import type { AppState, Profile, WorkoutDay } from '../types';
import { buildProgram } from './program-builder';

export type { WorkoutDay } from '../types';

export function programFor(state: AppState, profile?: Profile): WorkoutDay[] {
  if (state.program && state.program.length === 7) return state.program;
  // Fallback if profile exists but program was never built (older user)
  if (profile || state.profile) return buildProgram(profile ?? state.profile!);
  return [];
}

// Backwards-compatible signature: components called todayWorkout(profile, startDate).
// Now expects (state, startDate) and reads the saved program.
export function todayWorkout(state: AppState, programStartDate: string): WorkoutDay {
  const prog = programFor(state);
  if (prog.length === 0) {
    return {
      name: 'Rest',
      focus: 'Set up your program in Settings',
      warmup: [],
      exercises: [],
      cooldown: [],
      estMinutes: 0,
      kind: 'rest',
    };
  }
  const start = new Date(programStartDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const idx = ((days % prog.length) + prog.length) % prog.length;
  return prog[idx];
}
