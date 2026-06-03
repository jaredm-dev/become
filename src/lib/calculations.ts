import type { Profile, ActivityLevel, Goal } from '../types';

const LB_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

export function lbToKg(lb: number) { return lb * LB_TO_KG; }
export function inToCm(inches: number) { return inches * IN_TO_CM; }

// Mifflin-St Jeor BMR
export function bmr(p: Profile): number {
  const kg = lbToKg(p.currentWeightLb);
  const cm = inToCm(p.heightIn);
  const base = 10 * kg + 6.25 * cm - 5 * p.age;
  return Math.round(p.sex === 'male' ? base + 5 : base - 161);
}

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export function tdee(p: Profile): number {
  return Math.round(bmr(p) * ACTIVITY_MULT[p.activity]);
}

// Recommended pace per week (lb)
function recommendedRate(p: Profile): number {
  if (p.goal === 'cut') return 1.0;
  if (p.goal === 'recomp') return 0;
  return p.experience === 'beginner' ? 0.5 : 0.3;
}

// Pace user is actually targeting (lb/week, signed: + for gain, - for loss)
export function weeklyRate(p: Profile): number {
  const diff = p.goalWeightLb - p.currentWeightLb;
  if (p.goalWeeks && p.goalWeeks > 0) {
    return diff / p.goalWeeks;
  }
  // Auto: use recommended pace, signed
  const rec = recommendedRate(p);
  if (diff > 0) return rec;
  if (diff < 0) return -rec;
  return 0;
}

// Heuristic: kcal per lb of body mass gained/lost (~3500 kcal/lb classic estimate)
const KCAL_PER_LB = 3500;

export function calorieTarget(p: Profile): number {
  const t = tdee(p);
  const rate = weeklyRate(p);                    // signed lb/week
  const adjust = Math.round((rate * KCAL_PER_LB) / 7);

  if (p.goal === 'recomp') return t;
  // Clamp so we don't recommend insane targets
  const minBulkSurplus = 200;
  const maxBulkSurplus = 1000;
  const maxDeficit = 1000;
  if (p.goal === 'bulk') {
    const surplus = Math.max(minBulkSurplus, Math.min(maxBulkSurplus, adjust));
    return t + surplus;
  }
  // cut
  const deficit = Math.max(300, Math.min(maxDeficit, Math.abs(adjust)));
  return t - deficit;
}

export interface PaceVerdict {
  rate: number;          // signed lb/week
  verdict: 'safe' | 'aggressive' | 'unrealistic' | 'too-slow';
  message: string;
}

export function paceVerdict(p: Profile): PaceVerdict {
  const rate = weeklyRate(p);
  const abs = Math.abs(rate);
  if (p.goal === 'recomp') return { rate, verdict: 'safe', message: 'Recomp — maintain weight, build muscle.' };

  if (p.goal === 'bulk') {
    if (rate <= 0.1) return { rate, verdict: 'too-slow', message: 'This timeline barely requires a surplus. Pick a tighter deadline or you’ll just maintain.' };
    if (rate <= 0.6) return { rate, verdict: 'safe', message: 'Clean lean bulk pace. Most of the gain will be muscle.' };
    if (rate <= 1.0) return { rate, verdict: 'aggressive', message: 'Aggressive bulk. Expect some fat gain alongside muscle.' };
    return { rate, verdict: 'unrealistic', message: 'Faster than 1 lb/week is mostly fat or water. Consider extending the timeline.' };
  }
  // cut
  if (abs <= 1.0) return { rate, verdict: 'safe', message: 'Sustainable cut pace. You should keep most of your muscle.' };
  if (abs <= 2.0) return { rate, verdict: 'aggressive', message: 'Aggressive cut. Expect strength dips and harder recovery.' };
  return { rate, verdict: 'unrealistic', message: 'Faster than 2 lb/week risks muscle loss. Extend the timeline.' };
}

export interface MacroTarget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterOz: number;
}

export function macroTargets(p: Profile): MacroTarget {
  const cals = calorieTarget(p);
  // Protein: 1g per lb of bodyweight for muscle gain
  const proteinG = Math.round(p.currentWeightLb * 1.0);
  // Fat: 25% of calories
  const fatG = Math.round((cals * 0.25) / 9);
  // Carbs: remainder
  const carbsG = Math.round((cals - proteinG * 4 - fatG * 9) / 4);
  const fiberG = Math.round(cals / 1000 * 14);
  const waterOz = Math.round(p.currentWeightLb * 0.6);
  return { calories: cals, proteinG, carbsG, fatG, fiberG, waterOz };
}

// Daily Reference Intakes (DRI) - tuned for active adults
export interface MicroTargets {
  vitaminD_IU: number;
  vitaminC_mg: number;
  vitaminA_mcg: number;
  vitaminE_mg: number;
  vitaminK_mcg: number;
  thiamin_mg: number;
  riboflavin_mg: number;
  niacin_mg: number;
  b6_mg: number;
  b12_mcg: number;
  folate_mcg: number;
  calcium_mg: number;
  iron_mg: number;
  magnesium_mg: number;
  zinc_mg: number;
  potassium_mg: number;
  sodium_mg_max: number;
  omega3_g: number;
  creatine_g: number;
}

export function microTargets(p: Profile): MicroTargets {
  const male = p.sex === 'male';
  return {
    vitaminD_IU: 2000,
    vitaminC_mg: male ? 90 : 75,
    vitaminA_mcg: male ? 900 : 700,
    vitaminE_mg: 15,
    vitaminK_mcg: male ? 120 : 90,
    thiamin_mg: male ? 1.2 : 1.1,
    riboflavin_mg: male ? 1.3 : 1.1,
    niacin_mg: male ? 16 : 14,
    b6_mg: 1.7,
    b12_mcg: 2.4,
    folate_mcg: 400,
    calcium_mg: 1000,
    iron_mg: male ? 8 : 18,
    magnesium_mg: male ? 420 : 320,
    zinc_mg: male ? 11 : 8,
    potassium_mg: male ? 3400 : 2600,
    sodium_mg_max: 2300,
    omega3_g: 2,
    creatine_g: 5,
  };
}

export function weeksToGoal(p: Profile): number {
  if (p.goalWeeks && p.goalWeeks > 0) {
    // Weeks remaining = total weeks * (lb still to go / total diff)
    const totalDiff = Math.abs(p.goalWeightLb - p.startWeightLb);
    const remaining = Math.abs(p.goalWeightLb - p.currentWeightLb);
    if (totalDiff === 0) return 0;
    return Math.max(0, Math.ceil(p.goalWeeks * (remaining / totalDiff)));
  }
  const diff = p.goalWeightLb - p.currentWeightLb;
  const ratePerWeek = p.experience === 'beginner' ? 0.5 : 0.3;
  if (diff > 0) return Math.ceil(diff / ratePerWeek);
  if (diff < 0) return Math.ceil(Math.abs(diff) / 1.0);
  return 0;
}

export function targetDate(p: Profile): Date {
  const weeks = (p.goalWeeks && p.goalWeeks > 0) ? p.goalWeeks : weeksToGoal(p);
  const start = new Date(p.createdAt);
  return new Date(start.getTime() + weeks * 7 * 86_400_000);
}

export function progressPct(p: Profile): number {
  const total = p.goalWeightLb - p.startWeightLb;
  const done = p.currentWeightLb - p.startWeightLb;
  if (total === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}
