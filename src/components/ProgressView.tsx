import { useState } from 'react';
import type { AppState, WeightLog } from '../types';
import { todayISO } from '../lib/storage';
import { progressPct } from '../lib/calculations';

interface Props {
  state: AppState;
  onLogWeight: (log: WeightLog) => void;
  onBack: () => void;
}

export default function ProgressView({ state, onLogWeight, onBack }: Props) {
  const p = state.profile!;
  const [w, setW] = useState(p.currentWeightLb);
  const logs = [...state.weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(p.startWeightLb, p.goalWeightLb, ...logs.map(l => l.weightLb));
  const min = Math.min(p.startWeightLb, p.goalWeightLb, ...logs.map(l => l.weightLb));
  const span = Math.max(1, max - min);

  const save = () => {
    onLogWeight({ date: todayISO(), weightLb: w });
  };

  return (
    <div className="progress">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>Progress</h2>
      </header>

      <div className="big-stats">
        <div>
          <div className="bs-label">Start</div>
          <div className="bs-val">{p.startWeightLb}</div>
        </div>
        <div>
          <div className="bs-label">Now</div>
          <div className="bs-val accent">{logs[logs.length - 1]?.weightLb ?? p.currentWeightLb}</div>
        </div>
        <div>
          <div className="bs-label">Goal</div>
          <div className="bs-val">{p.goalWeightLb}</div>
        </div>
      </div>

      <div className="track big">
        <div className="track-fill" style={{ width: `${progressPct(p)}%` }} />
      </div>

      {logs.length > 1 && (
        <svg className="chart" viewBox="0 0 300 120" preserveAspectRatio="none">
          <line x1="0" x2="300" y1={120 - ((p.goalWeightLb - min) / span) * 110 - 5} y2={120 - ((p.goalWeightLb - min) / span) * 110 - 5} stroke="#22d3ee" strokeDasharray="4" strokeWidth="1" />
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            points={logs.map((l, i) => {
              const x = (i / (logs.length - 1)) * 300;
              const y = 120 - ((l.weightLb - min) / span) * 110 - 5;
              return `${x},${y}`;
            }).join(' ')}
          />
          {logs.map((l, i) => {
            const x = (i / (logs.length - 1)) * 300;
            const y = 120 - ((l.weightLb - min) / span) * 110 - 5;
            return <circle key={i} cx={x} cy={y} r="3" fill="#22d3ee" />;
          })}
        </svg>
      )}

      <div className="log-form">
        <label>Log today's weight</label>
        <div className="row">
          <input type="number" value={w} onChange={e => setW(+e.target.value)} step="0.1" />
          <button className="primary" onClick={save}>Log</button>
        </div>
      </div>

      <h3 className="section-h">History</h3>
      <div className="history">
        {logs.length === 0 && <div className="empty">No entries yet. Log your first weigh-in.</div>}
        {[...logs].reverse().map((l, i) => (
          <div key={i} className="hist-row">
            <span>{l.date}</span>
            <strong>{l.weightLb} lb</strong>
          </div>
        ))}
      </div>

      <h3 className="section-h">Workouts completed</h3>
      <div className="history">
        {state.workoutLogs.length === 0 && <div className="empty">No sessions yet.</div>}
        {[...state.workoutLogs].reverse().slice(0, 20).map((l, i) => (
          <div key={i} className="hist-row">
            <span>{l.date}</span>
            <strong>{l.dayName.split('—')[0].trim()}</strong>
            <span className="muted">{l.sets.filter(s => s.done).length}/{l.sets.length}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
