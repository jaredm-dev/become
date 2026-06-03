import { useState } from 'react';
import type { Profile, Sex, ActivityLevel, Experience, Goal, MuscleGroup } from '../types';
import { MUSCLE_LABELS, FOCUS_PRESETS } from '../lib/program-builder';

interface Props {
  onComplete: (p: Profile) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [sex, setSex] = useState<Sex>('male');
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [startWeight, setStartWeight] = useState(150);
  const [goalWeight, setGoalWeight] = useState(180);
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [experience, setExperience] = useState<Experience>('beginner');
  const [goal, setGoal] = useState<Goal>('bulk');
  const [goalWeeks, setGoalWeeks] = useState<number | null>(null);
  const [liftDays, setLiftDays] = useState(4);
  const [cardioDays, setCardioDays] = useState(2);
  const [priorityMuscles, setPriorityMuscles] = useState<MuscleGroup[]>([]);
  const [focusMode, setFocusMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [eatStart, setEatStart] = useState('08:00');
  const [eatEnd, setEatEnd] = useState('20:00');

  const togglePriority = (m: MuscleGroup) => {
    setPriorityMuscles(curr => {
      if (curr.includes(m)) return curr.filter(x => x !== m);
      if (curr.length >= 3) return [...curr.slice(1), m]; // FIFO eviction
      return [...curr, m];
    });
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = () => {
    const profile: Profile = {
      name: name || 'Athlete',
      age,
      sex,
      heightIn: heightFt * 12 + heightIn,
      startWeightLb: startWeight,
      currentWeightLb: startWeight,
      goalWeightLb: goalWeight,
      goalWeeks,
      activity,
      experience,
      goal,
      liftDays,
      cardioDays,
      priorityMuscles,
      mealsPerDay,
      eatingWindowStart: eatStart,
      eatingWindowEnd: eatEnd,
      createdAt: new Date().toISOString(),
    };
    onComplete(profile);
  };

  return (
    <div className="onboard">
      <div className="onboard-progress">
        <div className="bar" style={{ width: `${((step + 1) / 9) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="step">
          <h1>BECOME.</h1>
          <p className="sub">Zero to hero. Lifting, cardio, food. Dialed in.</p>
          <label>What should we call you?</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
          <button className="primary" onClick={next} disabled={!name.trim()}>Let's go →</button>
        </div>
      )}

      {step === 1 && (
        <div className="step">
          <h2>The basics</h2>
          <label>Age</label>
          <input type="number" value={age} onChange={e => setAge(+e.target.value)} />
          <label>Sex</label>
          <div className="seg">
            <button className={sex === 'male' ? 'on' : ''} onClick={() => setSex('male')}>Male</button>
            <button className={sex === 'female' ? 'on' : ''} onClick={() => setSex('female')}>Female</button>
          </div>
          <label>Height</label>
          <div className="row">
            <div className="col">
              <input type="number" value={heightFt} onChange={e => setHeightFt(+e.target.value)} /><span>ft</span>
            </div>
            <div className="col">
              <input type="number" value={heightIn} onChange={e => setHeightIn(+e.target.value)} /><span>in</span>
            </div>
          </div>
          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step">
          <h2>Weight</h2>
          <label>Current weight (lb)</label>
          <input type="number" value={startWeight} onChange={e => setStartWeight(+e.target.value)} />
          <label>Goal weight (lb)</label>
          <input type="number" value={goalWeight} onChange={e => setGoalWeight(+e.target.value)} />
          <p className="hint">
            {goalWeight > startWeight
              ? `+${goalWeight - startWeight} lb to gain. Lean bulk pace ~0.5 lb/week.`
              : goalWeight < startWeight
              ? `−${startWeight - goalWeight} lb to lose.`
              : 'Recomp mode — same scale, more muscle.'}
          </p>
          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h2>Goal</h2>
          {([
            { v: 'bulk' as Goal, t: 'Bulk', d: 'Gain weight + muscle. Calorie surplus.' },
            { v: 'recomp' as Goal, t: 'Recomp', d: 'Maintain weight, build muscle, drop fat.' },
            { v: 'cut' as Goal, t: 'Cut', d: 'Lose fat while preserving muscle.' },
          ]).map(o => (
            <button key={o.v} className={`card ${goal === o.v ? 'on' : ''}`} onClick={() => setGoal(o.v)}>
              <strong>{o.t}</strong>
              <span>{o.d}</span>
            </button>
          ))}
          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 4 && (() => {
        const diff = goalWeight - startWeight;
        const absDiff = Math.abs(diff);
        const recommendedWeeks = absDiff === 0 ? 12 : Math.ceil(absDiff / (goal === 'cut' ? 1.0 : 0.5));
        const usedWeeks = goalWeeks ?? recommendedWeeks;
        const rate = absDiff / Math.max(1, usedWeeks);
        let verdict = 'safe';
        let msg = '';
        if (goal === 'bulk') {
          if (rate <= 0.1) { verdict = 'slow'; msg = 'Long timeline — you’ll barely need a surplus. Probably won’t hit the goal.'; }
          else if (rate <= 0.6) { verdict = 'safe'; msg = 'Clean lean bulk pace. Most gain will be muscle.'; }
          else if (rate <= 1.0) { verdict = 'aggressive'; msg = 'Aggressive bulk. Expect some fat alongside muscle.'; }
          else { verdict = 'bad'; msg = 'Faster than 1 lb/week is mostly fat. Extend the timeline.'; }
        } else if (goal === 'cut') {
          if (rate <= 1.0) { verdict = 'safe'; msg = 'Sustainable cut pace. Keep your muscle.'; }
          else if (rate <= 2.0) { verdict = 'aggressive'; msg = 'Aggressive cut. Expect strength dips.'; }
          else { verdict = 'bad'; msg = 'Faster than 2 lb/week risks muscle loss.'; }
        } else {
          msg = 'Recomp — timeline less critical, just stay consistent.';
        }
        const presets = goal === 'cut'
          ? [{ w: 8, t: '2 mo' }, { w: 12, t: '3 mo' }, { w: 24, t: '6 mo' }, { w: 52, t: '1 yr' }]
          : [{ w: 12, t: '3 mo' }, { w: 24, t: '6 mo' }, { w: 52, t: '1 yr' }, { w: 104, t: '2 yr' }];
        return (
          <div className="step">
            <h2>Timeline</h2>
            <p className="sub" style={{ marginBottom: 16 }}>
              {absDiff > 0 ? `${diff > 0 ? '+' : '−'}${absDiff} lb to ${diff > 0 ? 'gain' : 'lose'}. ` : 'Recomp. '}
              How long do you want this to take?
            </p>

            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button
                className={goalWeeks === null ? 'on card' : 'card'}
                style={{ flex: '1 1 100%' }}
                onClick={() => setGoalWeeks(null)}
              >
                <strong>Recommended ({recommendedWeeks} weeks)</strong>
                <span>Sustainable pace, mostly muscle{goal === 'cut' ? ' preserved' : ''}.</span>
              </button>
              {presets.map(p => (
                <button
                  key={p.w}
                  className={goalWeeks === p.w ? 'on' : ''}
                  style={{ flex: '1 1 22%', minWidth: 70 }}
                  onClick={() => setGoalWeeks(p.w)}
                >
                  {p.t}
                </button>
              ))}
            </div>

            <label style={{ marginTop: 16 }}>Or custom (weeks)</label>
            <input
              type="number"
              value={goalWeeks ?? ''}
              placeholder={`${recommendedWeeks}`}
              onChange={e => {
                const v = parseInt(e.target.value);
                setGoalWeeks(isNaN(v) || v <= 0 ? null : v);
              }}
            />

            {absDiff > 0 && (
              <p className={`pace-${verdict}`} style={{ fontSize: 13, marginTop: 12, padding: 10, borderRadius: 8, lineHeight: 1.4 }}>
                <strong>{rate.toFixed(2)} lb/week</strong> — {msg}
              </p>
            )}
            <div className="nav">
              <button onClick={back}>← Back</button>
              <button className="primary" onClick={next}>Next →</button>
            </div>
          </div>
        );
      })()}

      {step === 5 && (
        <div className="step">
          <h2>Lifting experience</h2>
          {([
            { v: 'beginner' as Experience, t: 'Beginner', d: '<1 year. Full-body program, learn the lifts.' },
            { v: 'intermediate' as Experience, t: 'Intermediate', d: '1–3 years. PPL split, hypertrophy focus.' },
            { v: 'advanced' as Experience, t: 'Advanced', d: '3+ years. Heavy volume, periodized.' },
          ]).map(o => (
            <button key={o.v} className={`card ${experience === o.v ? 'on' : ''}`} onClick={() => setExperience(o.v)}>
              <strong>{o.t}</strong>
              <span>{o.d}</span>
            </button>
          ))}
          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="step">
          <h2>Your training schedule</h2>

          <label>How many days per week do you want to lift?</label>
          <div className="seg">
            {[2,3,4,5,6].map(n => (
              <button key={n} className={liftDays === n ? 'on' : ''} onClick={() => setLiftDays(n)}>{n}</button>
            ))}
          </div>

          <label>How many days per week do you want to do cardio?</label>
          <div className="seg">
            {[0,1,2,3,4].map(n => (
              <button key={n} className={cardioDays === n ? 'on' : ''} onClick={() => setCardioDays(n)}>{n}</button>
            ))}
          </div>
          <p className="hint">
            {liftDays + cardioDays > 7
              ? '⚠ Combined days exceed 7 — some days will combine lift + cardio.'
              : `${liftDays} lifting + ${cardioDays} cardio + ${7 - liftDays - cardioDays} rest days.`}
          </p>

          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="step">
          <h2>What do you want to build?</h2>
          <p className="sub">Pick a focus. Your program will bias extra sets and exercises toward it.</p>

          {focusMode === 'preset' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FOCUS_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className={`card ${selectedPreset === preset.id ? 'on' : ''}`}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      setPriorityMuscles(preset.muscles);
                    }}
                  >
                    <strong>{preset.emoji} {preset.label}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFocusMode('custom')}
                style={{ marginTop: 16, background: 'transparent', border: 'none', color: 'var(--accent)', textDecoration: 'underline' }}
              >
                Or pick specific muscle groups →
              </button>
            </>
          ) : (
            <>
              <p className="hint" style={{ marginBottom: 12 }}>
                Tap up to 3 muscle groups. Order = priority (#1 gets the most extra volume).
              </p>
              <div className="muscle-grid">
                {MUSCLE_LABELS.map(m => {
                  const idx = priorityMuscles.indexOf(m.value);
                  return (
                    <button
                      key={m.value}
                      className={`muscle-chip ${idx >= 0 ? 'on' : ''}`}
                      onClick={() => { setSelectedPreset(null); togglePriority(m.value); }}
                    >
                      <span className="emoji">{m.emoji}</span>
                      <span>{m.label}</span>
                      {idx >= 0 && <span className="rank">#{idx + 1}</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setFocusMode('preset')}
                style={{ marginTop: 16, background: 'transparent', border: 'none', color: 'var(--accent)', textDecoration: 'underline' }}
              >
                ← Back to presets
              </button>
            </>
          )}

          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="step">
          <h2>Eating + activity</h2>

          <label>Daily activity (outside the gym)</label>
          <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}>
            <option value="sedentary">Sedentary — desk job</option>
            <option value="light">Light — some walking</option>
            <option value="moderate">Moderate — on feet most of day</option>
            <option value="high">High — physical job + workouts</option>
            <option value="athlete">Athlete — multiple sessions/day</option>
          </select>

          <label>Meals per day</label>
          <div className="seg">
            {[3,4,5,6].map(n => (
              <button key={n} className={mealsPerDay === n ? 'on' : ''} onClick={() => setMealsPerDay(n)}>{n}</button>
            ))}
          </div>

          <label>Eating window</label>
          <div className="row">
            <div className="col">
              <input type="time" value={eatStart} onChange={e => setEatStart(e.target.value)} />
              <span style={{ position: 'static', display: 'block', textAlign: 'center', marginTop: 4 }}>Start</span>
            </div>
            <div className="col">
              <input type="time" value={eatEnd} onChange={e => setEatEnd(e.target.value)} />
              <span style={{ position: 'static', display: 'block', textAlign: 'center', marginTop: 4 }}>End</span>
            </div>
          </div>

          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={finish}>Build my plan →</button>
          </div>
        </div>
      )}
    </div>
  );
}
