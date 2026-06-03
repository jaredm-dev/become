import type { MuscleGroup } from '../types';

export interface ExerciseDef {
  name: string;
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  category: 'compound' | 'isolation';
  pattern: Pattern;
  defaultSets: number;
  defaultReps: string;
  rir: string;
  notes?: string;
}

export type Pattern =
  | 'push-horiz' | 'push-vert'      // chest / shoulders
  | 'pull-horiz' | 'pull-vert'      // back rows / pulldowns
  | 'squat' | 'hinge' | 'lunge'     // quads / hams / glutes
  | 'shoulder-iso' | 'arm-bi' | 'arm-tri'
  | 'glute-iso' | 'ham-iso' | 'quad-iso' | 'calf'
  | 'chest-iso' | 'back-iso' | 'rear-delt'
  | 'core' | 'core-anti';

export const EXERCISES: ExerciseDef[] = [
  // ── Push (chest/shoulders) ─────────────────────────────────────────
  { name: 'Barbell Bench Press', primary: ['chest'], secondary: ['triceps', 'shoulders'], category: 'compound', pattern: 'push-horiz', defaultSets: 4, defaultReps: '6-8', rir: '2', notes: 'Add 5 lb when you hit top of range all sets' },
  { name: 'Incline Dumbbell Press', primary: ['chest'], secondary: ['shoulders', 'triceps'], category: 'compound', pattern: 'push-horiz', defaultSets: 3, defaultReps: '8-10', rir: '2' },
  { name: 'Dumbbell Bench Press', primary: ['chest'], secondary: ['triceps', 'shoulders'], category: 'compound', pattern: 'push-horiz', defaultSets: 3, defaultReps: '8-10', rir: '2' },
  { name: 'Push-ups', primary: ['chest'], secondary: ['triceps', 'core'], category: 'compound', pattern: 'push-horiz', defaultSets: 3, defaultReps: 'AMRAP', rir: '1' },
  { name: 'Cable Chest Fly', primary: ['chest'], category: 'isolation', pattern: 'chest-iso', defaultSets: 3, defaultReps: '12-15', rir: '1' },
  { name: 'Dips (weighted if able)', primary: ['chest', 'triceps'], category: 'compound', pattern: 'push-horiz', defaultSets: 3, defaultReps: '8-10', rir: '1' },

  { name: 'Standing Overhead Press', primary: ['shoulders'], secondary: ['triceps', 'core'], category: 'compound', pattern: 'push-vert', defaultSets: 4, defaultReps: '6-8', rir: '2' },
  { name: 'Dumbbell Shoulder Press', primary: ['shoulders'], secondary: ['triceps'], category: 'compound', pattern: 'push-vert', defaultSets: 3, defaultReps: '8-10', rir: '2' },
  { name: 'Arnold Press', primary: ['shoulders'], category: 'compound', pattern: 'push-vert', defaultSets: 3, defaultReps: '10', rir: '1' },
  { name: 'Lateral Raises', primary: ['shoulders'], category: 'isolation', pattern: 'shoulder-iso', defaultSets: 4, defaultReps: '12-15', rir: '1' },
  { name: 'Cable Lateral Raise', primary: ['shoulders'], category: 'isolation', pattern: 'shoulder-iso', defaultSets: 3, defaultReps: '12-15', rir: '1' },
  { name: 'Face Pulls', primary: ['shoulders', 'back'], category: 'isolation', pattern: 'rear-delt', defaultSets: 3, defaultReps: '15', rir: '1' },
  { name: 'Rear-Delt Flys', primary: ['shoulders'], category: 'isolation', pattern: 'rear-delt', defaultSets: 3, defaultReps: '12-15', rir: '1' },

  // ── Pull (back/biceps) ──────────────────────────────────────────────
  { name: 'Deadlift', primary: ['back', 'hamstrings', 'glutes'], secondary: ['core'], category: 'compound', pattern: 'hinge', defaultSets: 3, defaultReps: '5', rir: '2', notes: 'Reset each rep. Form > weight.' },
  { name: 'Pull-ups', primary: ['back'], secondary: ['biceps'], category: 'compound', pattern: 'pull-vert', defaultSets: 4, defaultReps: '6-10', rir: '1' },
  { name: 'Lat Pulldown', primary: ['back'], secondary: ['biceps'], category: 'compound', pattern: 'pull-vert', defaultSets: 4, defaultReps: '8-10', rir: '2' },
  { name: 'Barbell Row', primary: ['back'], secondary: ['biceps', 'core'], category: 'compound', pattern: 'pull-horiz', defaultSets: 4, defaultReps: '8-10', rir: '2' },
  { name: 'Chest-Supported Row', primary: ['back'], secondary: ['biceps'], category: 'compound', pattern: 'pull-horiz', defaultSets: 3, defaultReps: '10', rir: '1' },
  { name: 'Seated Cable Row', primary: ['back'], secondary: ['biceps'], category: 'compound', pattern: 'pull-horiz', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Dumbbell Row', primary: ['back'], secondary: ['biceps'], category: 'compound', pattern: 'pull-horiz', defaultSets: 3, defaultReps: '10/side', rir: '2' },
  { name: 'Straight-Arm Pulldown', primary: ['back'], category: 'isolation', pattern: 'back-iso', defaultSets: 3, defaultReps: '12-15', rir: '1' },

  { name: 'Barbell Curl', primary: ['biceps'], category: 'isolation', pattern: 'arm-bi', defaultSets: 3, defaultReps: '8-10', rir: '1' },
  { name: 'Dumbbell Curl', primary: ['biceps'], category: 'isolation', pattern: 'arm-bi', defaultSets: 3, defaultReps: '10', rir: '1' },
  { name: 'Hammer Curl', primary: ['biceps'], category: 'isolation', pattern: 'arm-bi', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Preacher Curl', primary: ['biceps'], category: 'isolation', pattern: 'arm-bi', defaultSets: 3, defaultReps: '10', rir: '1' },
  { name: 'Incline Dumbbell Curl', primary: ['biceps'], category: 'isolation', pattern: 'arm-bi', defaultSets: 3, defaultReps: '10-12', rir: '1' },

  { name: 'Cable Tricep Pushdown', primary: ['triceps'], category: 'isolation', pattern: 'arm-tri', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Overhead Tricep Extension', primary: ['triceps'], category: 'isolation', pattern: 'arm-tri', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Skull Crushers', primary: ['triceps'], category: 'isolation', pattern: 'arm-tri', defaultSets: 3, defaultReps: '10', rir: '1' },
  { name: 'Close-Grip Bench Press', primary: ['triceps'], secondary: ['chest'], category: 'compound', pattern: 'push-horiz', defaultSets: 3, defaultReps: '8', rir: '2' },

  // ── Legs (quads / hams / glutes) ────────────────────────────────────
  { name: 'Back Squat', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], category: 'compound', pattern: 'squat', defaultSets: 4, defaultReps: '6-8', rir: '2', notes: 'Depth: hip crease below knee' },
  { name: 'Front Squat', primary: ['quads'], secondary: ['glutes', 'core'], category: 'compound', pattern: 'squat', defaultSets: 3, defaultReps: '6-8', rir: '2' },
  { name: 'Goblet Squat', primary: ['quads', 'glutes'], category: 'compound', pattern: 'squat', defaultSets: 3, defaultReps: '10', rir: '2' },
  { name: 'Leg Press', primary: ['quads', 'glutes'], secondary: ['hamstrings'], category: 'compound', pattern: 'squat', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Bulgarian Split Squat', primary: ['quads', 'glutes'], category: 'compound', pattern: 'lunge', defaultSets: 3, defaultReps: '10/leg', rir: '1' },
  { name: 'Walking Lunges', primary: ['quads', 'glutes'], secondary: ['hamstrings'], category: 'compound', pattern: 'lunge', defaultSets: 3, defaultReps: '10/leg', rir: '1' },
  { name: 'Leg Extension', primary: ['quads'], category: 'isolation', pattern: 'quad-iso', defaultSets: 3, defaultReps: '12-15', rir: '1' },

  { name: 'Romanian Deadlift', primary: ['hamstrings', 'glutes'], secondary: ['back'], category: 'compound', pattern: 'hinge', defaultSets: 3, defaultReps: '8-10', rir: '2' },
  { name: 'Stiff-Leg Deadlift', primary: ['hamstrings', 'glutes'], category: 'compound', pattern: 'hinge', defaultSets: 3, defaultReps: '8', rir: '2' },
  { name: 'Leg Curl', primary: ['hamstrings'], category: 'isolation', pattern: 'ham-iso', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Good Mornings', primary: ['hamstrings', 'back'], secondary: ['glutes'], category: 'compound', pattern: 'hinge', defaultSets: 3, defaultReps: '10', rir: '2' },

  { name: 'Hip Thrust', primary: ['glutes'], secondary: ['hamstrings'], category: 'compound', pattern: 'glute-iso', defaultSets: 4, defaultReps: '8-10', rir: '1', notes: 'Pause + squeeze at the top' },
  { name: 'Glute Bridge', primary: ['glutes'], category: 'isolation', pattern: 'glute-iso', defaultSets: 3, defaultReps: '12', rir: '1' },
  { name: 'Cable Kickback', primary: ['glutes'], category: 'isolation', pattern: 'glute-iso', defaultSets: 3, defaultReps: '12/leg', rir: '1' },
  { name: 'Sumo Deadlift', primary: ['glutes', 'hamstrings'], secondary: ['back'], category: 'compound', pattern: 'hinge', defaultSets: 3, defaultReps: '6', rir: '2' },
  { name: 'Step-ups (weighted)', primary: ['glutes', 'quads'], category: 'compound', pattern: 'lunge', defaultSets: 3, defaultReps: '10/leg', rir: '1' },
  { name: 'Curtsy Lunge', primary: ['glutes', 'quads'], category: 'compound', pattern: 'lunge', defaultSets: 3, defaultReps: '10/leg', rir: '1' },

  { name: 'Standing Calf Raise', primary: ['calves'], category: 'isolation', pattern: 'calf', defaultSets: 4, defaultReps: '12-15', rir: '1' },
  { name: 'Seated Calf Raise', primary: ['calves'], category: 'isolation', pattern: 'calf', defaultSets: 3, defaultReps: '15', rir: '1' },

  // ── Core ────────────────────────────────────────────────────────────
  { name: 'Hanging Leg Raise', primary: ['core'], category: 'isolation', pattern: 'core', defaultSets: 3, defaultReps: '10-12', rir: '1' },
  { name: 'Plank', primary: ['core'], category: 'isolation', pattern: 'core-anti', defaultSets: 3, defaultReps: '45-60s', rir: '0' },
  { name: 'Cable Woodchopper', primary: ['core'], category: 'isolation', pattern: 'core', defaultSets: 3, defaultReps: '10/side', rir: '1' },
  { name: 'Pallof Press', primary: ['core'], category: 'isolation', pattern: 'core-anti', defaultSets: 3, defaultReps: '12/side', rir: '1' },
  { name: 'Ab Wheel Rollout', primary: ['core'], category: 'isolation', pattern: 'core', defaultSets: 3, defaultReps: '8-10', rir: '1' },
];

export function findExercise(pattern: Pattern, primaryFilter?: MuscleGroup): ExerciseDef | undefined {
  let candidates = EXERCISES.filter(e => e.pattern === pattern);
  if (primaryFilter) candidates = candidates.filter(e => e.primary.includes(primaryFilter));
  return candidates[0];
}

// Pick an exercise of a given pattern, biased toward priority muscle groups.
// Uses seed for determinism so each user gets the same picks.
export function pickExercise(
  pattern: Pattern,
  priorities: MuscleGroup[],
  used: Set<string>,
  seed: number
): ExerciseDef | undefined {
  const candidates = EXERCISES.filter(e => e.pattern === pattern && !used.has(e.name));
  if (candidates.length === 0) {
    // Fallback: allow reuse
    return EXERCISES.filter(e => e.pattern === pattern)[seed % Math.max(1, EXERCISES.filter(e => e.pattern === pattern).length)];
  }
  // Score: how many primary muscles overlap priorities
  const scored = candidates.map(e => {
    const overlap = e.primary.filter(m => priorities.includes(m)).length;
    return { e, score: overlap * 10 + (e.secondary?.filter(m => priorities.includes(m)).length ?? 0) };
  });
  scored.sort((a, b) => b.score - a.score);
  // Take the top scorer; if tied, rotate by seed
  const topScore = scored[0].score;
  const topTier = scored.filter(s => s.score === topScore);
  return topTier[seed % topTier.length].e;
}
