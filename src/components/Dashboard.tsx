import type { AppState } from '../types';
import { macroTargets, tdee, weeksToGoal, progressPct, paceVerdict, targetDate } from '../lib/calculations';
import { todayWorkout } from '../lib/workouts';
import { shouldShowInAppReminder } from '../lib/reminders';
import { todayISO } from '../lib/storage';
import { computeStreaks, streakPhrase } from '../lib/streaks';
import Title from './Title';

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
  const lastLogDate = state.weightLogs[state.weightLogs.length - 1]?.date ?? null;
  const needsWeighIn = shouldShowInAppReminder(lastLogDate) && lastLogDate !== todayISO();
  const streaks = computeStreaks(state);
  const todayNutrition = state.nutritionLogs.find(n => n.date === todayISO());

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
        <div className="hello">Hey, {p.name}</div>
        <div className="big">{latestWeight} <span>lb</span></div>
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

      <button className="big-action" onClick={() => onNav('workout')}>
        <div className="ba-label">Today's session</div>
        <div className="ba-title">{wk.name}</div>
        <div className="ba-sub">{wk.focus} · ~{wk.estMinutes} min · {wk.exercises.length} exercises</div>
      </button>

      <div className="streak-chips">
        <div className="streak-chip">
          <div className="streak-chip-l">WORKOUT</div>
          <div className="streak-chip-v">{streaks.workout}</div>
          <div className="streak-chip-u">{streaks.workout === 1 ? 'day' : 'days'}</div>
        </div>
        <div className="streak-chip">
          <div className="streak-chip-l">PROTEIN</div>
          <div className="streak-chip-v">{streaks.protein}</div>
          <div className="streak-chip-u">{streaks.protein === 1 ? 'day' : 'days'}</div>
        </div>
        <div className="streak-chip">
          <div className="streak-chip-l">WEIGH-IN</div>
          <div className="streak-chip-v">{streaks.weighIn}</div>
          <div className="streak-chip-u">{streaks.weighIn === 1 ? 'day' : 'days'}</div>
        </div>
      </div>

      <div className="quick-grid">
        <button onClick={() => onNav('nutrition')}>
          <span className="icon">🍳</span>
          <span>Nutrition</span>
        </button>
        <button onClick={() => onNav('progress')}>
          <span className="icon">📈</span>
          <span>Progress</span>
        </button>
        <button onClick={() => onNav('program')}>
          <span className="icon">📋</span>
          <span>Full Plan</span>
        </button>
        <button onClick={() => onNav('share')}>
          <span className="icon">📤</span>
          <span>Share Week</span>
        </button>
        <button onClick={() => onNav('settings')} style={{ gridColumn: '1 / -1' }}>
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
