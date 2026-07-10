import { useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import { macroTargets, tdee, weeksToGoal, progressPct, paceVerdict, targetDate } from '../lib/calculations';
import { todayWorkout, workoutForDate } from '../lib/workouts';
import { shouldShowInAppReminder } from '../lib/reminders';
import { todayISO } from '../lib/storage';
import { computeStreaks, streakPhrase } from '../lib/streaks';
import Title from './Title';

function weekNumber(startIso: string): number {
  return Math.floor((Date.now() - new Date(startIso).getTime()) / (7 * 86_400_000)) + 1;
}

/** Animated count-up for the hero number. Eases out over ~0.9s. */
function useCountUp(target: number, decimals = 1): string {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const dur = 900;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val.toFixed(decimals).replace(/\.0$/, '');
}

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface Props {
  state: AppState;
  onNav: (v: string) => void;
}

export default function Dashboard({ state, onNav }: Props) {
  const p = state.profile!;
  const m = macroTargets(p);
  const t = tdee(p);
  const weeks = weeksToGoal(p);
  const pct = progressPct(p);
  const pace = paceVerdict(p);
  const tDate = targetDate(p);
  const tDateStr = tDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const wk = todayWorkout(state, state.programStartDate || p.createdAt);

  const latestWeight = state.weightLogs[state.weightLogs.length - 1]?.weightLb ?? p.currentWeightLb;
  const animatedWeight = useCountUp(latestWeight);
  const lastLogDate = state.weightLogs[state.weightLogs.length - 1]?.date ?? null;
  const needsWeighIn = shouldShowInAppReminder(lastLogDate) && lastLogDate !== todayISO();
  const streaks = computeStreaks(state);
  const todayNutrition = state.nutritionLogs.find(n => n.date === todayISO());
  const weekNum = weekNumber(state.programStartDate || p.createdAt);
  const todayWorkoutDone = state.workoutLogs.some(l => l.date === todayISO());

  // 7-day strip: today ± 3 days
  const startDate = state.programStartDate || p.createdAt;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i - 3));
    const iso = d.toISOString().slice(0, 10);
    const w = workoutForDate(state, startDate, d);
    const logged = state.workoutLogs.some(l => l.date === iso);
    return {
      iso,
      dow: DOW[d.getDay()],
      dayNum: d.getDate(),
      name: w ? w.name.split(' ')[0] : '—',
      isToday: iso === todayISO(),
      logged,
      isRest: w?.kind === 'rest',
    };
  });

  return (
    <div className="dash">
      {needsWeighIn && (
        <button className="reminder-banner" onClick={() => onNav('progress')}>
          <span>⚖️</span>
          <div>
            <strong>Log today's weigh-in</strong>
            <div className="rb-sub">Consistency wins. Tap to log.</div>
          </div>
        </button>
      )}
      <div className="title-wrap">
        <Title pct={pct} />
      </div>

      <header className="hero">
        <div className="hero-top">
          <div className="hello">Hey, {p.name}</div>
          <div className="week-badge">Week {weekNum}</div>
        </div>
        <div className="big">{animatedWeight} <span>lb</span></div>
        <div className="goal-line">
          → {p.goalWeightLb} lb · {weeks} wk · {tDateStr}
        </div>
        <div className={`pace-line pace-${pace.verdict}`}>
          {pace.rate > 0 ? '+' : pace.rate < 0 ? '−' : ''}{Math.abs(pace.rate).toFixed(2)} lb/wk · {pace.verdict}
        </div>
        <div className="track">
          <div className="track-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="pct">{pct}% there</div>
      </header>

      <section className="card-row">
        <div className="stat">
          <div className="stat-label">Eat today</div>
          <div className="stat-value">{m.calories}</div>
          <div className="stat-unit">kcal</div>
        </div>
        <div className="stat">
          <div className="stat-label">Protein</div>
          <div className="stat-value">{m.proteinG}</div>
          <div className="stat-unit">g</div>
        </div>
        <div className="stat">
          <div className="stat-label">TDEE</div>
          <div className="stat-value">{t}</div>
          <div className="stat-unit">kcal</div>
        </div>
      </section>

      {todayNutrition && (
        <div className="nutrition-summary" onClick={() => onNav('nutrition')}>
          <div className="ns-row">
            <span className="ns-label">Today's intake</span>
            <span className="ns-cals">{todayNutrition.calories} / {m.calories} kcal</span>
          </div>
          <div className="ns-bars">
            <div className="ns-bar-wrap">
              <div className="ns-bar-fill" style={{ width: `${Math.min(100, Math.round((todayNutrition.calories / m.calories) * 100))}%`, background: 'var(--accent)' }} />
            </div>
            <div className="ns-bar-wrap">
              <div className="ns-bar-fill" style={{ width: `${Math.min(100, Math.round((todayNutrition.proteinG / m.proteinG) * 100))}%`, background: '#a78bfa' }} />
            </div>
          </div>
          <div className="ns-macros">
            <span>P {todayNutrition.proteinG}g</span>
            <span>C {todayNutrition.carbsG}g</span>
            <span>F {todayNutrition.fatG}g</span>
          </div>
        </div>
      )}

      <button className={`big-action ${todayWorkoutDone ? 'done' : ''}`} onClick={() => onNav('workout')}>
        <div className="ba-label">{todayWorkoutDone ? '✓ Completed' : "Today's session"}</div>
        <div className="ba-title">{wk.name}</div>
        <div className="ba-sub">{wk.focus} · ~{wk.estMinutes} min · {wk.exercises.length} exercises</div>
      </button>

      <div className="week-strip">
        {weekDays.map(d => (
          <div key={d.iso} className={`day-cell ${d.isToday ? 'today' : ''} ${d.logged ? 'done' : ''}`}>
            <div className="dc-dow">{d.dow}</div>
            <div className="dc-name">{d.isRest ? 'Rest' : d.name}</div>
            <div className="dc-state">{d.logged ? '✓' : d.isToday ? '●' : d.dayNum}</div>
          </div>
        ))}
      </div>

      <div className="streak-chips">
        <div className={`streak-chip ${streaks.workout > 0 ? 'hot' : ''}`}>
          <div className="streak-chip-l">WORKOUT</div>
          <div className="streak-chip-v">{streaks.workout}</div>
          <div className="streak-chip-u">{streaks.workout === 1 ? 'day' : 'days'}</div>
        </div>
        <div className={`streak-chip ${streaks.protein > 0 ? 'hot' : ''}`}>
          <div className="streak-chip-l">PROTEIN</div>
          <div className="streak-chip-v">{streaks.protein}</div>
          <div className="streak-chip-u">{streaks.protein === 1 ? 'day' : 'days'}</div>
        </div>
        <div className={`streak-chip ${streaks.weighIn > 0 ? 'hot' : ''}`}>
          <div className="streak-chip-l">WEIGH-IN</div>
          <div className="streak-chip-v">{streaks.weighIn}</div>
          <div className="streak-chip-u">{streaks.weighIn === 1 ? 'day' : 'days'}</div>
        </div>
      </div>

      <div className="quick-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button onClick={() => onNav('share')}>
          <span className="icon">📤</span>
          <span>Share Week</span>
        </button>
        <button onClick={() => onNav('settings')}>
          <span className="icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      <div className="tip">
        {streakPhrase(streaks)}
      </div>
    </div>
  );
}
