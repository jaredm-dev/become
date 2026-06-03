import type { Profile } from '../types';
import { macroTargets } from './calculations';

export interface MealPlan {
  label: string;
  time: string;        // HH:MM
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tip: string;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmt(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Distribute macros across meals. Heaviest meals around the workout window.
export function mealSchedule(p: Profile): MealPlan[] {
  const m = macroTargets(p);
  const meals = Math.max(3, Math.min(6, p.mealsPerDay || 4));
  const start = parseTime(p.eatingWindowStart || '08:00');
  const end = parseTime(p.eatingWindowEnd || '20:00');
  const span = Math.max(120, end - start); // at least 2 hours
  const step = span / (meals - 1);

  // Even-by-default split; bias slight extra to lunch/dinner
  const weights = ((): number[] => {
    if (meals === 3) return [0.30, 0.40, 0.30];
    if (meals === 4) return [0.25, 0.30, 0.20, 0.25];
    if (meals === 5) return [0.20, 0.25, 0.15, 0.20, 0.20];
    return [0.17, 0.22, 0.13, 0.18, 0.15, 0.15]; // 6 meals
  })();

  const labels = ((): string[] => {
    if (meals === 3) return ['Breakfast', 'Lunch', 'Dinner'];
    if (meals === 4) return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    if (meals === 5) return ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Pre-bed'];
    return ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Pre-bed'];
  })();

  const tips: string[] = labels.map((l) => {
    if (l === 'Breakfast') return '4 eggs + oats + banana, or Greek yogurt + granola';
    if (l === 'Lunch') return 'Chicken/beef + rice + veg + olive oil';
    if (l === 'Dinner') return 'Salmon or steak + potato + greens';
    if (l === 'Snack') return 'Cottage cheese + fruit, or shake + nuts';
    if (l === 'Pre-bed') return 'Casein or Greek yogurt — slow protein for overnight recovery';
    return '';
  });

  return labels.map((label, i) => {
    const t = start + step * i;
    const w = weights[i];
    return {
      label,
      time: fmt(t),
      calories: Math.round(m.calories * w),
      proteinG: Math.round(m.proteinG * w),
      carbsG: Math.round(m.carbsG * w),
      fatG: Math.round(m.fatG * w),
      tip: tips[i],
    };
  });
}
