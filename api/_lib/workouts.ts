// Lightweight copy of program data used by the cron function.
// Kept in sync with src/lib/workouts.ts (we only need names + top exercises here).

export interface DayLite {
  name: string;
  focus: string;
  top: string[];
}

const ADVANCED: DayLite[] = [
  { name: 'Day 1 — Push', focus: 'Chest/Shoulders/Triceps', top: ['Barbell Bench 4×6-8', 'OHP 4×6-8', 'Lateral Raises 4×12-15'] },
  { name: 'Day 2 — Pull', focus: 'Back/Biceps', top: ['Deadlift 3×5', 'Pull-ups 4×6-10', 'Barbell Row 4×8-10'] },
  { name: 'Day 3 — Cardio Z2', focus: 'Aerobic base', top: ['40–60 min easy bike or trail run', 'Nose-breathing pace', 'HR 60–70% max'] },
  { name: 'Day 4 — Legs', focus: 'Quad-dominant', top: ['Back Squat 4×6-8', 'RDL 3×8-10', 'Walking Lunges 3×10/leg'] },
  { name: 'Day 5 — Upper Strength', focus: 'Heavy upper', top: ['Weighted Pull-ups 5×5', 'Bench Press 5×5', 'DB Shoulder Press 3×8'] },
  { name: 'Day 6 — HIIT + Core', focus: 'VO2 max + core', top: ['6× 30s all-out / 90s easy', 'Hanging Leg Raise 3×10-12', 'Plank 3×45-60s'] },
  { name: 'Day 7 — Active Recovery', focus: 'Walk + mobility', top: ['30–45 min easy walk', '10 min mobility flow', 'Sunlight + steps'] },
];

const BEGINNER: DayLite[] = [
  { name: 'Day 1 — Full Body A', focus: 'Foundation', top: ['Goblet Squat 3×8-10', 'DB Bench 3×8-10', 'Lat Pulldown 3×10'] },
  { name: 'Day 2 — Cardio Easy', focus: 'Aerobic base', top: ['30 min easy bike or walk/jog', 'Conversational pace'] },
  { name: 'Day 3 — Full Body B', focus: 'Foundation', top: ['Deadlift 3×5-8', 'Incline DB Press 3×10', 'Cable Row 3×10-12'] },
  { name: 'Day 4 — Rest/Walk', focus: 'Recovery', top: ['Easy walk 20–30 min', 'Or full rest'] },
  { name: 'Day 5 — Full Body C', focus: 'Foundation', top: ['Back Squat 3×8', 'OHP 3×8', 'Pull-ups AMRAP'] },
  { name: 'Day 6 — Trail Run/Bike', focus: 'Conditioning', top: ['30–45 min easy', 'Finish with 4×30s pickups'] },
  { name: 'Day 7 — Rest', focus: 'Full rest', top: ['Eat big', 'Sleep 8+ hours', 'No training'] },
];

export function todayFor(experience: string, programStartISO: string): DayLite {
  const prog = experience === 'beginner' ? BEGINNER : ADVANCED;
  const start = new Date(programStartISO).getTime();
  const now = Date.now();
  const days = Math.floor((now - start) / 86_400_000);
  const idx = ((days % prog.length) + prog.length) % prog.length;
  return prog[idx];
}
