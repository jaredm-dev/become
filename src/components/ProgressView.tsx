import { useState } from 'react';
import type { AppState, WeightLog, BodyMeasurement } from '../types';
import { todayISO } from '../lib/storage';
import { progressPct } from '../lib/calculations';

// Epley formula: 1RM = weight * (1 + reps/30)
function epley1RM(weightLb: number, reps: number): number {
  if (reps === 1) return weightLb;
  return Math.round(weightLb * (1 + reps / 30));
}

// Find best 1RM estimate for a given exercise across all logs
function best1RM(logs: AppState['workoutLogs'], exerciseName: string): { est1rm: number; weight: number; reps: number } | null {
  let best: { est1rm: number; weight: number; reps: number } | null = null;
  for (const log of logs) {
    for (const s of log.sets) {
      if (s.exercise === exerciseName && s.done && s.weightLb && s.reps && s.reps > 0) {
        const est = epley1RM(s.weightLb, s.reps);
        if (!best || est > best.est1rm) {
          best = { est1rm: est, weight: s.weightLb, reps: s.reps };
        }
      }
    }
  }
  return best;
}

const KEY_LIFTS = ['Barbell Bench Press', 'Back Squat', 'Deadlift', 'Standing Overhead Press', 'Barbell Row'];

interface Props {
  state: AppState;
  onLogWeight: (log: WeightLog) => void;
  onSaveBodyMeasurement: (m: BodyMeasurement) => void;
  onBack: () => void;
}

export default function ProgressView({ state, onLogWeight, onSaveBodyMeasurement, onBack }: Props) {
  const p = state.profile!;
  const logs = [...state.weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const latestLoggedWeight = logs[logs.length - 1]?.weightLb ?? p.currentWeightLb;
  const [w, setW] = useState(latestLoggedWeight);
  const [showMeasure, setShowMeasure] = useState(false);
  const latestM = (state.bodyMeasurements || []).sort((a,b) => b.date.localeCompare(a.date))[0];
  const [chest, setChest] = useState<string>(String(latestM?.chestIn ?? ''));
  const [waist, setWaist] = useState<string>(String(latestM?.waistIn ?? ''));
  const [hips, setHips] = useState<string>(String(latestM?.hipsIn ?? ''));
  const [arm, setArm] = useState<string>(String(latestM?.leftArmIn ?? ''));
  const [thigh, setThigh] = useState<string>(String(latestM?.leftThighIn ?? ''));

  const saveMeasurements = () => {
    onSaveBodyMeasurement({
      date: todayISO(),
      chestIn: chest ? +chest : undefined,
      waistIn: waist ? +waist : undefined,
      hipsIn: hips ? +hips : undefined,
      leftArmIn: arm ? +arm : undefined,
      rightArmIn: arm ? +arm : undefined,
      leftThighIn: thigh ? +thigh : undefined,
      rightThighIn: thigh ? +thigh : undefined,
    });
    setShowMeasure(false);
  };
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

      <h3 className="section-h">Body measurements</h3>
      {latestM && (
        <div className="measure-grid">
          {latestM.chestIn && <div className="measure-item"><span>Chest</span><strong>{latestM.chestIn}"</strong></div>}
          {latestM.waistIn && <div className="measure-item"><span>Waist</span><strong>{latestM.waistIn}"</strong></div>}
          {latestM.hipsIn && <div className="measure-item"><span>Hips</span><strong>{latestM.hipsIn}"</strong></div>}
          {latestM.leftArmIn && <div className="measure-item"><span>Arm</span><strong>{latestM.leftArmIn}"</strong></div>}
          {latestM.leftThighIn && <div className="measure-item"><span>Thigh</span><strong>{latestM.leftThighIn}"</strong></div>}
        </div>
      )}
      {!showMeasure ? (
        <button style={{ marginBottom: 8 }} onClick={() => setShowMeasure(true)}>
          {latestM ? '+ Update measurements' : '+ Log measurements'}
        </button>
      ) : (
        <div className="measure-form">
          {[
            { label: 'Chest (in)', val: chest, set: setChest },
            { label: 'Waist (in)', val: waist, set: setWaist },
            { label: 'Hips (in)', val: hips, set: setHips },
            { label: 'Arm (in)', val: arm, set: setArm },
            { label: 'Thigh (in)', val: thigh, set: setThigh },
          ].map(({ label, val, set }) => (
            <div key={label} className="field">
              <label>{label}</label>
              <input type="number" step="0.25" value={val} onChange={e => set(e.target.value)} placeholder="—" />
            </div>
          ))}
          <div className="row">
            <button className="primary" onClick={saveMeasurements}>Save</button>
            <button onClick={() => setShowMeasure(false)}>Cancel</button>
          </div>
        </div>
      )}

      <h3 className="section-h">Strength milestones (estimated 1RM)</h3>
      <div className="history">
        {KEY_LIFTS.map(lift => {
          const result = best1RM(state.workoutLogs, lift);
          if (!result) return null;
          return (
            <div key={lift} className="hist-row">
              <span>{lift}</span>
              <strong>{result.est1rm} lb</strong>
              <span className="muted">({result.weight}×{result.reps})</span>
            </div>
          );
        }).filter(Boolean)}
        {state.workoutLogs.length === 0 && <div className="empty">Log workouts to see your strength estimates.</div>}
        {state.workoutLogs.length > 0 && KEY_LIFTS.every(l => !best1RM(state.workoutLogs, l)) && (
          <div className="empty">No barbell lifts logged yet.</div>
        )}
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
