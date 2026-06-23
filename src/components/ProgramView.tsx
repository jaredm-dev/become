import type { AppState } from '../types';
import { programFor } from '../lib/workouts';

interface Props {
  state: AppState;
  onBack: () => void;
}

export default function ProgramView({ state, onBack }: Props) {
  const p = state.profile!;
  const prog = programFor(state);

  return (
    <div className="program">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>Full Plan</h2>
        <div className="focus">
          {p.liftDays <= 3 ? 'Full-Body Split' : p.liftDays === 4 ? 'Upper/Lower Split' : 'Push/Pull/Legs Split'}
          {' '}· {p.liftDays} lifting + {p.cardioDays} cardio · 7-day cycle
        </div>
      </header>

      {prog.map((day, i) => (
        <div key={i} className="day-card">
          <div className="day-head">
            <h3>Day {i + 1} — {day.name}</h3>
            <span className="muted">~{day.estMinutes} min</span>
          </div>
          <div className="focus-tag">{day.focus}</div>
          {day.warmup.length > 0 && (
            <div className="sub">
              <strong>Warm-up:</strong> {day.warmup.join(' · ')}
            </div>
          )}
          <ul className="ex-list">
            {day.exercises.map((ex, j) => (
              <li key={j}>
                <strong>{ex.name}</strong> — {ex.sets}×{ex.reps}{ex.rir && ` @ RIR ${ex.rir}`}
                {ex.notes && <div className="ex-note">{ex.notes}</div>}
              </li>
            ))}
          </ul>
          {day.cooldown.length > 0 && (
            <div className="sub"><strong>Cooldown:</strong> {day.cooldown.join(' · ')}</div>
          )}
        </div>
      ))}

      <div className="rule">
        <strong>Progressive Overload:</strong> Every week, add weight, reps, or a set on at least one lift per movement. If you can't, eat more and sleep more.
      </div>
      <div className="rule">
        <strong>Deload:</strong> Every 6 weeks, cut volume by 40% for one week. Your nervous system needs it.
      </div>
    </div>
  );
}
