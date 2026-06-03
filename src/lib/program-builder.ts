import type { Profile, WorkoutDay, Exercise, MuscleGroup } from '../types';
import { EXERCISES, pickExercise, type Pattern, type ExerciseDef } from './exercises';

type DayKind = 'lift-push' | 'lift-pull' | 'lift-legs' | 'lift-upper' | 'lift-lower' | 'lift-full-a' | 'lift-full-b' | 'lift-full-c' | 'cardio-z2' | 'cardio-hiit' | 'rest';

// 7-day templates per lift-day count
function liftLayout(liftDays: number): DayKind[] {
  switch (liftDays) {
    case 2: return ['lift-full-a', 'rest',  'lift-full-b', 'rest', 'rest', 'rest', 'rest'];
    case 3: return ['lift-full-a', 'rest',  'lift-full-b', 'rest', 'lift-full-c', 'rest', 'rest'];
    case 4: return ['lift-upper',  'lift-lower', 'rest', 'lift-upper', 'lift-lower', 'rest', 'rest'];
    case 5: return ['lift-push', 'lift-pull', 'lift-legs', 'rest', 'lift-upper', 'lift-lower', 'rest'];
    case 6: return ['lift-push', 'lift-pull', 'lift-legs', 'lift-push', 'lift-pull', 'lift-legs', 'rest'];
    default: return ['lift-full-a', 'rest', 'lift-full-b', 'rest', 'lift-full-c', 'rest', 'rest'];
  }
}

// Fill cardio days into rest slots. If there are more cardio days than rest days,
// append cardio onto end of a lift day (becomes lift+cardio).
function applyCardio(layout: DayKind[], cardioDays: number, kinds: ('cardio-z2' | 'cardio-hiit')[]): DayKind[] {
  const out = [...layout];
  const restIdx = out.map((d, i) => d === 'rest' ? i : -1).filter(i => i >= 0);
  let placed = 0;
  for (const i of restIdx) {
    if (placed >= cardioDays) break;
    out[i] = kinds[placed % kinds.length];
    placed++;
  }
  return out;
}

// Patterns each day should hit
const DAY_PATTERNS: Record<DayKind, Pattern[]> = {
  'lift-push':  ['push-horiz', 'push-vert', 'push-horiz', 'shoulder-iso', 'arm-tri', 'arm-tri'],
  'lift-pull':  ['hinge', 'pull-vert', 'pull-horiz', 'pull-horiz', 'rear-delt', 'arm-bi', 'arm-bi'],
  'lift-legs':  ['squat', 'hinge', 'lunge', 'glute-iso', 'quad-iso', 'ham-iso', 'calf'],
  'lift-upper': ['pull-vert', 'push-horiz', 'pull-horiz', 'push-vert', 'shoulder-iso', 'arm-bi', 'arm-tri'],
  'lift-lower': ['squat', 'hinge', 'lunge', 'glute-iso', 'quad-iso', 'ham-iso', 'calf'],
  'lift-full-a': ['squat', 'push-horiz', 'pull-vert', 'hinge', 'shoulder-iso', 'core'],
  'lift-full-b': ['hinge', 'push-vert', 'pull-horiz', 'lunge', 'arm-bi', 'core-anti'],
  'lift-full-c': ['squat', 'push-horiz', 'pull-horiz', 'glute-iso', 'arm-tri', 'core'],
  'cardio-z2':  [],
  'cardio-hiit': [],
  'rest':       [],
};

const DAY_NAMES: Record<DayKind, string> = {
  'lift-push':  'Push',
  'lift-pull':  'Pull',
  'lift-legs':  'Legs',
  'lift-upper': 'Upper',
  'lift-lower': 'Lower',
  'lift-full-a': 'Full Body A',
  'lift-full-b': 'Full Body B',
  'lift-full-c': 'Full Body C',
  'cardio-z2':  'Cardio (Z2)',
  'cardio-hiit': 'HIIT + Core',
  'rest':       'Rest',
};

const DAY_FOCUS: Record<DayKind, string> = {
  'lift-push':  'Chest / Shoulders / Triceps',
  'lift-pull':  'Back / Biceps',
  'lift-legs':  'Quads / Hamstrings / Glutes',
  'lift-upper': 'Heavy upper body',
  'lift-lower': 'Heavy lower body',
  'lift-full-a': 'Full body, foundation',
  'lift-full-b': 'Full body, hinge focus',
  'lift-full-c': 'Full body, posterior chain',
  'cardio-z2':  'Aerobic base (zone 2)',
  'cardio-hiit': 'VO2 max + core',
  'rest':       'Recovery',
};

function liftWarmup(kind: DayKind): string[] {
  if (kind.startsWith('lift-leg') || kind === 'lift-lower') {
    return ['5 min bike', 'Bodyweight squats 2×15', 'Glute bridges 2×15'];
  }
  if (kind === 'lift-pull') {
    return ['5 min row', 'Scapular pulls 2×10', 'Cat-cow 1 min'];
  }
  if (kind === 'lift-push') {
    return ['5 min row or jog', 'Band pull-aparts 2×15', 'Arm circles 30s each direction'];
  }
  return ['5 min easy bike or row', 'Dynamic warm-up 3 min'];
}

function liftCooldown(_kind: DayKind): string[] {
  return ['Foam roll 2 min', 'Stretch worked muscles 30s each'];
}

function makeCardioDay(kind: 'cardio-z2' | 'cardio-hiit'): WorkoutDay {
  if (kind === 'cardio-hiit') {
    return {
      name: 'HIIT + Core',
      focus: DAY_FOCUS[kind],
      warmup: ['5 min easy bike/jog', 'A-skips, B-skips 20m each'],
      exercises: [
        { name: 'Bike Intervals (or Hill Sprints)', sets: 6, reps: '30s ALL OUT / 90s easy', type: 'cardio', notes: 'You should hate yourself by set 4' },
        { name: 'Hanging Leg Raise', sets: 3, reps: '10-12', rir: '1', type: 'isolation', muscles: ['core'] },
        { name: 'Plank', sets: 3, reps: '45-60s', rir: '0', type: 'isolation', muscles: ['core'] },
        { name: 'Cable Woodchoppers', sets: 3, reps: '10/side', rir: '1', type: 'isolation', muscles: ['core'] },
      ],
      cooldown: ['10 min easy spin or walk', 'Full body stretch 5 min'],
      estMinutes: 50,
      kind: 'cardio',
    };
  }
  return {
    name: 'Cardio (Z2)',
    focus: DAY_FOCUS[kind],
    warmup: ['5 min easy spin/walk', 'Dynamic leg swings 10/side'],
    exercises: [
      { name: 'Zone 2 Bike or Easy Trail Run', sets: 1, reps: '40–60 min', type: 'cardio', notes: 'Nose-breathing pace. HR 60–70% max. Should feel almost lazy.' },
    ],
    cooldown: ['5 min walk', 'Calf + hip flexor stretch'],
    estMinutes: 55,
    kind: 'cardio',
  };
}

function makeRestDay(): WorkoutDay {
  return {
    name: 'Rest',
    focus: 'Recovery — walk + mobility',
    warmup: [],
    exercises: [
      { name: 'Easy walk (outdoor)', sets: 1, reps: '20-45 min', type: 'cardio', notes: 'Sunlight + steps. Phone in pocket.' },
      { name: 'Full body mobility flow', sets: 1, reps: '10 min', type: 'mobility' },
    ],
    cooldown: [],
    estMinutes: 30,
    kind: 'rest',
  };
}

// Adjust set count based on priorities — bias volume toward priority muscles
function adjustSets(ex: ExerciseDef, priorities: MuscleGroup[]): number {
  const hitsPriority = ex.primary.some(m => priorities.includes(m));
  if (!hitsPriority) return ex.defaultSets;
  // +1 set if it hits the top priority
  const isTopPriority = priorities.length > 0 && ex.primary.includes(priorities[0]);
  return Math.min(ex.defaultSets + (isTopPriority ? 2 : 1), 5);
}

function makeLiftDay(kind: DayKind, priorities: MuscleGroup[], seedBase: number): WorkoutDay {
  const patterns = DAY_PATTERNS[kind];
  const used = new Set<string>();
  const exercises: Exercise[] = [];
  patterns.forEach((p, i) => {
    const def = pickExercise(p, priorities, used, seedBase + i);
    if (def) {
      used.add(def.name);
      exercises.push({
        name: def.name,
        sets: adjustSets(def, priorities),
        reps: def.defaultReps,
        rir: def.rir,
        type: def.category,
        notes: def.notes,
        muscles: def.primary,
      });
    }
  });
  // Tack on a glute accessory if glutes are a priority and not already covered
  if (priorities.includes('glutes') && !exercises.some(e => e.muscles?.includes('glutes'))) {
    const gluteEx = EXERCISES.find(e => e.pattern === 'glute-iso' && !used.has(e.name));
    if (gluteEx) {
      exercises.push({
        name: gluteEx.name,
        sets: gluteEx.defaultSets,
        reps: gluteEx.defaultReps,
        rir: gluteEx.rir,
        type: gluteEx.category,
        muscles: gluteEx.primary,
      });
    }
  }
  return {
    name: DAY_NAMES[kind],
    focus: DAY_FOCUS[kind],
    warmup: liftWarmup(kind),
    exercises,
    cooldown: liftCooldown(kind),
    estMinutes: 10 + exercises.length * 8,
    kind: 'lift',
  };
}

export function buildProgram(p: Profile): WorkoutDay[] {
  const liftDays = Math.max(0, Math.min(6, p.liftDays || 3));
  const cardioDays = Math.max(0, Math.min(6, p.cardioDays || 2));
  let layout = liftLayout(liftDays);
  // Mix of Z2 and HIIT for cardio (favor Z2 for first half)
  const cardioMix: ('cardio-z2' | 'cardio-hiit')[] = ['cardio-z2', 'cardio-hiit', 'cardio-z2', 'cardio-hiit', 'cardio-z2', 'cardio-hiit'];
  layout = applyCardio(layout, cardioDays, cardioMix);

  const program: WorkoutDay[] = [];
  layout.forEach((kind, i) => {
    if (kind === 'rest') program.push(makeRestDay());
    else if (kind === 'cardio-z2' || kind === 'cardio-hiit') program.push(makeCardioDay(kind));
    else program.push(makeLiftDay(kind, p.priorityMuscles || [], i * 7 + 13));
  });
  return program;
}

// Convenient label list for UI
export const MUSCLE_LABELS: { value: MuscleGroup; label: string; emoji: string }[] = [
  { value: 'glutes', label: 'Glutes', emoji: '🍑' },
  { value: 'quads', label: 'Quads', emoji: '🦵' },
  { value: 'hamstrings', label: 'Hamstrings', emoji: '🦿' },
  { value: 'chest', label: 'Chest', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🦅' },
  { value: 'shoulders', label: 'Shoulders', emoji: '🧗' },
  { value: 'biceps', label: 'Biceps', emoji: '💪' },
  { value: 'triceps', label: 'Triceps', emoji: '🤜' },
  { value: 'calves', label: 'Calves', emoji: '🦶' },
  { value: 'core', label: 'Core / Abs', emoji: '🎯' },
];

// Preset focus goals — phrased like a person would say it.
// Each maps to a list of priority muscles (max 3, ordered by importance).
export interface FocusPreset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  muscles: MuscleGroup[];
}

export const FOCUS_PRESETS: FocusPreset[] = [
  { id: 'glutes',     label: 'Build my glutes',     description: 'Hip thrusts, deadlifts, all the booty work',                emoji: '🍑', muscles: ['glutes', 'hamstrings'] },
  { id: 'chest',      label: 'Build my chest',      description: 'Bench, incline press, dips, flys',                            emoji: '💪', muscles: ['chest', 'triceps'] },
  { id: 'arms',       label: 'Big arms',            description: 'Curls, extensions, more direct arm volume',                   emoji: '🦾', muscles: ['biceps', 'triceps'] },
  { id: 'back',       label: 'V-taper back',        description: 'Pull-ups, rows, lats — that wide upper-body look',            emoji: '🦅', muscles: ['back', 'shoulders'] },
  { id: 'shoulders',  label: 'Boulder shoulders',   description: 'Pressing, lateral raises, shoulder-dominant',                  emoji: '🧗', muscles: ['shoulders', 'triceps'] },
  { id: 'legs',       label: 'Tree-trunk legs',     description: 'Squats, lunges, leg press — full quad/ham focus',             emoji: '🦵', muscles: ['quads', 'hamstrings', 'glutes'] },
  { id: 'core',       label: 'Six-pack focus',      description: 'Direct core work every session',                              emoji: '🎯', muscles: ['core'] },
  { id: 'athletic',   label: 'Athletic / strong',   description: 'Compound lifts, full posterior chain',                        emoji: '🏃', muscles: ['back', 'hamstrings', 'glutes'] },
  { id: 'balanced',   label: 'Just build muscle',   description: 'Balanced full-body, no specific focus',                       emoji: '⚖️', muscles: [] },
];
