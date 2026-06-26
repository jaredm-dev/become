import { useState, useMemo } from 'react';
import type { AppState, SetLog, WorkoutLog } from '../types';
import { todayWorkout } from '../lib/workouts';
import { todayISO } from '../lib/storage';
import { youtubeUrlFor, hasCuratedVideo } from '../lib/exerciseVideos';

interface Props {
  state: AppState;
  onSave: (log: WorkoutLog) => void;
  onBack: () => void;
}

// Best set (highest weight × reps) from a previous workout log for a given exercise
function bestPrevSet(state: AppState, exerciseName: string, excludeDate: string): SetLog | null {
  const prevLogs = [...state.workoutLogs]
    .filter(l => l.date !== excludeDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const log of prevLogs) {
    const sets = log.sets.filter(s => s.exercise === exerciseName && s.done && s.weightLb && s.reps);
    if (sets.length > 0) {
      // Best = highest volume set
      return sets.reduce((best, s) => ((s.weightLb ?? 0) * (s.reps ?? 0)) > ((best.weightLb ?? 0) * (best.reps ?? 0)) ? s : best);
    }
  }
  return null;
}

export default function WorkoutView({ state, onSave, onBack }: Props) {
  const p = state.profile!;
  const today = todayISO();
  const day = todayWorkout(state, state.programStartDate || p.createdAt);
  const [sets, setSets] = useState<SetLog[]>(
    day.exercises.flatMap(ex =>
      Array.from({ length: ex.sets }, () => ({ exercise: ex.name, done: false } as SetLog))
    )
  );
  const [notes, setNotes] = useState('');

  // Previous best per exercise — computed once on mount
  const prevBests = useMemo(() => {
    const map: Record<string, SetLog | null> = {};
    for (const ex of day.exercises) {
      map[ex.name] = bestPrevSet(state, ex.name, today);
    }
    return map;
  }, []);

  const toggle = (i: number) => {
    setSets(s => s.map((x, idx) => (idx === i ? { ...x, done: !x.done } : x)));
  };
  const update = (i: number, patch: Partial<SetLog>) => {
    setSets(s => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  };

  const completed = sets.filter(s => s.done).length;
  const total = sets.length;
  const [finished, setFinished] = useState(false);

  const finish = () => {
    onSave({ date: todayISO(), dayName: day.name, sets, notes });
    setFinished(true);
    setTimeout(() => onBack(), 1800);
  };

  if (finished) {
    return (
      <div className="workout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ fontSize: 56 }}>💪</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Session logged.</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>{completed}/{total} sets · {day.name}</div>
      </div>
    );
  }

  let setIdx = 0;

  return (
    <div className="workout">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>{day.name}</h2>
        <div className="focus">{day.focus} · ~{day.estMinutes} min</div>
      </header>

      <div className="progress-pill">{completed}/{total} sets</div>

      {day.warmup.length > 0 && (
        <details className="block" open>
          <summary>Warm-up</summary>
          <ul>{day.warmup.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </details>
      )}

      <div className="exercises">
        {day.exercises.map((ex, exIdx) => {
          const prev = prevBests[ex.name];
          return (
          <div key={exIdx} className="exercise">
            <div className="ex-head">
              <div>
                <div className="ex-name">
                  {ex.name}
                  <a
                    className="ex-video"
                    href={youtubeUrlFor(ex.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={hasCuratedVideo(ex.name) ? 'Watch form tutorial' : 'Browse form videos'}
                    onClick={e => e.stopPropagation()}
                  >📹</a>
                </div>
                <div className="ex-target">{ex.sets}×{ex.reps} {ex.rir && `· RIR ${ex.rir}`}</div>
              </div>
              {prev && prev.weightLb && prev.reps && (
                <div className="prev-best">
                  <span className="prev-label">Last</span>
                  <span className="prev-val">{prev.weightLb}lb × {prev.reps}</span>
                </div>
              )}
            </div>
            {ex.notes && <div className="ex-note">💡 {ex.notes}</div>}
            <div className="sets">
              {Array.from({ length: ex.sets }, (_, sIdx) => {
                const i = setIdx++;
                const s = sets[i];
                const isCardio = ex.type === 'cardio';
                return (
                  <div key={sIdx} className={`set ${s.done ? 'done' : ''}`}>
                    <div className="set-n">Set {sIdx + 1}</div>
                    {isCardio ? (
                      <>
                        <input type="number" placeholder="min" value={s.durationMin ?? ''} onChange={e => update(i, { durationMin: +e.target.value || undefined })} />
                        <input type="number" placeholder="mi" step="0.1" value={s.distanceMi ?? ''} onChange={e => update(i, { distanceMi: +e.target.value || undefined })} />
                      </>
                    ) : (
                      <>
                        <input type="number" placeholder="lb" value={s.weightLb ?? ''} onChange={e => update(i, { weightLb: +e.target.value || undefined })} />
                        <input type="number" placeholder="reps" value={s.reps ?? ''} onChange={e => update(i, { reps: +e.target.value || undefined })} />
                      </>
                    )}
                    <button className={`check ${s.done ? 'on' : ''}`} onClick={() => toggle(i)}>✓</button>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {day.cooldown.length > 0 && (
        <details className="block">
          <summary>Cooldown</summary>
          <ul>{day.cooldown.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </details>
      )}

      <label className="notes-label">Session notes</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Anything to fix next time?" />

      <button
        className="primary big"
        onClick={finish}
        disabled={completed === 0}
        style={{ opacity: completed === 0 ? 0.4 : 1 }}
      >
        Finish session {completed > 0 ? `(${completed}/${total} sets)` : ''}
      </button>
    </div>
  );
}
