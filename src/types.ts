export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'bulk' | 'recomp' | 'cut';
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightIn: number;
  startWeightLb: number;
  currentWeightLb: number;
  goalWeightLb: number;
  goalWeeks: number | null;  // null = use recommended pace
  activity: ActivityLevel;
  experience: Experience;
  goal: Goal;
  liftDays: number;          // 2-6
  cardioDays: number;        // 0-6
  priorityMuscles: MuscleGroup[]; // ordered list of priorities (max 3)
  mealsPerDay: number;       // 3-6
  eatingWindowStart: string; // "07:00"
  eatingWindowEnd: string;   // "21:00"
  createdAt: string;
}

export interface WeightLog {
  date: string;
  weightLb: number;
}

export interface SetLog {
  exercise: string;
  weightLb?: number;
  reps?: number;
  durationMin?: number;
  distanceMi?: number;
  done: boolean;
}

export interface WorkoutLog {
  date: string;
  dayName: string;
  sets: SetLog[];
  notes?: string;
}

export interface NutritionLog {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterOz: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rir?: string;
  notes?: string;
  type: 'compound' | 'isolation' | 'cardio' | 'mobility';
  muscles?: MuscleGroup[];
}

export interface WorkoutDay {
  name: string;
  focus: string;
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
  estMinutes: number;
  kind: 'lift' | 'cardio' | 'rest' | 'lift+cardio';
}

export interface AppState {
  profile: Profile | null;
  weightLogs: WeightLog[];
  workoutLogs: WorkoutLog[];
  nutritionLogs: NutritionLog[];
  programStartDate: string | null;
  program: WorkoutDay[] | null;  // 7-day generated program
}
