import { useState } from 'react';
import type { AppState, WeightLog } from '../types';
import { todayISO } from '../lib/storage';
import { progressPct } from '../lib/calculations';
import Title from './Title';

interface Props {
  state: AppState;
  weekNum: number;
  onComplete: (weight: WeightLog, workoutsHit: number) => void;
  onDismiss: () => void;
}

export default function WeeklyCheckIn({ state, weekNum, onComplete, onDismiss }: Props) {
  const p = state.profile!;
  const lastWeight = state.weightLogs[state.weightLogs.length - 1]?.weightLb ?? p.currentWeightLb;
  const [weight, setWeight] = useState(lastWeight);
  const [workouts, setWorkouts] = useState(3);

  const weightChange = weight - lastWeight;
  const pct = progressPct({ ...p, currentWeightLb: weight });

  const getMessage = () => {
    if (p.goal === 'bulk') {
      if (weightChange >= 0.3) return "Gaining. Stay consistent with the surplus.";
      if (weightChange >= 0) return "Holding steady — bump calories by 100.";
      return "Lost weight on a bulk — eat more. Seriously.";
    }
    if (p.goal === 'cut') {
      if (weightChange <= -0.5 && weightChange >= -2) return "Perfect cut pace. Keep it up.";
      if (weightChange > 0) return "Gained on a cut — tighten the deficit.";
      return "Dropping fast — make sure you're hitting protein.";
    }
    return "Staying consistent is the whole game. Nice work.";
  };

  const submit = () => {
    onComplete({ date: todayISO(), weightLb: weight }, workouts);
  };

  return (
    <div className="progate-overlay">
      <div className="progate-card checkin-card">
        <div className="checkin-week">Week {weekNum} check-in</div>
        <Title pct={pct} />

        <div className="checkin-weight">
          <label>This week's weight (lb)</label>
          <div className="checkin-weight-row">
            <button onClick={() => setWeight(w => Math.round((w - 0.5) * 10) / 10)}>−</button>
            <input
              type="number"
              value={weight}
              step="0.1"
              onChange={e => setWeight(+e.target.value || lastWeight)}
            />
            <button onClick={() => setWeight(w => Math.round((w + 0.5) * 10) / 10)}>+</button>
          </div>
          {weightChange !== 0 && (
            <div className={`checkin-delta ${weightChange > 0 ? 'up' : 'down'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lb from last week
            </div>
          )}
        </div>

        <label style={{ marginTop: 16 }}>Workouts completed this week</label>
        <div className="seg" style={{ marginBottom: 16 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
            <button
              key={n}
              className={workouts === n ? 'on' : ''}
              onClick={() => setWorkouts(n)}
              style={{ flex: 1, padding: '10px 4px', fontSize: 14 }}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="checkin-msg">{getMessage()}</div>

        <button className="primary big" onClick={submit}>Log week {weekNum}</button>
        <button className="progate-skip" onClick={onDismiss}>Skip for now</button>
      </div>
    </div>
  );
}
