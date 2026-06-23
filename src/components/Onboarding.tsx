import { useState } from 'react';
import type { Profile, Sex, Goal, Experience } from '../types';
import Title from './Title';

interface Props {
  onComplete: (p: Profile) => void;
}

const STEPS = 4;

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('bulk');
  const [sex, setSex] = useState<Sex>('male');
  const [startWeight, setStartWeight] = useState(160);
  const [goalWeight, setGoalWeight] = useState(185);
  const [experience, setExperience] = useState<Experience>('beginner');
  const [liftDays, setLiftDays] = useState(4);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const pct = Math.round(((step + 1) / STEPS) * 100);
  const diff = goalWeight - startWeight;

  const finish = () => {
    const now = new Date();
    const profile: Profile = {
      name: name.trim() || 'Athlete',
      age: 25,
      sex,
      heightIn: sex === 'male' ? 70 : 65,
      startWeightLb: startWeight,
      currentWeightLb: startWeight,
      goalWeightLb: goalWeight,
      goalWeeks: null,
      activity: 'moderate',
      experience,
      goal,
      liftDays,
      cardioDays: 1,
      priorityMuscles: [],
      mealsPerDay: 4,
      eatingWindowStart: '08:00',
      eatingWindowEnd: '20:00',
      createdAt: now.toISOString(),
    };
    onComplete(profile);
  };

  return (
    <div className="onboard">
      <div className="onboard-progress">
        <div className="bar" style={{ width: `${pct}%` }} />
      </div>

      {step === 0 && (
        <div className="step">
          <div className="step-title-wrap">
            <Title pct={0} />
          </div>
          <h2>What's your name?</h2>
          <p className="sub">We'll personalize your program around you.</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
          />
          <button className="primary big" onClick={next} disabled={!name.trim()}>
            Let's go →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="step">
          <h2>What's your goal, {name}?</h2>
          <p className="sub">This sets your calories, macros, and program intensity.</p>
          <div className="goal-cards">
            {([
              { v: 'bulk' as Goal, emoji: '📈', t: 'Build muscle', d: 'Calorie surplus, strength focus. Add mass.' },
              { v: 'recomp' as Goal, emoji: '⚖️', t: 'Body recomp', d: 'Maintain weight, build muscle, drop fat.' },
              { v: 'cut' as Goal, emoji: '🔥', t: 'Lose fat', d: 'Calorie deficit, preserve muscle. Get lean.' },
            ]).map(o => (
              <button
                key={o.v}
                className={`goal-card ${goal === o.v ? 'on' : ''}`}
                onClick={() => setGoal(o.v)}
              >
                <span className="goal-emoji">{o.emoji}</span>
                <div>
                  <strong>{o.t}</strong>
                  <span>{o.d}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step">
          <h2>Your body</h2>
          <p className="sub">Used to calculate your exact calorie and macro targets.</p>

          <label>Sex</label>
          <div className="seg" style={{ marginBottom: 8 }}>
            <button className={sex === 'male' ? 'on' : ''} onClick={() => setSex('male')}>Male</button>
            <button className={sex === 'female' ? 'on' : ''} onClick={() => setSex('female')}>Female</button>
          </div>

          <label>Current weight (lb)</label>
          <input
            type="number"
            value={startWeight}
            onChange={e => setStartWeight(+e.target.value || 0)}
          />

          <label>Goal weight (lb)</label>
          <input
            type="number"
            value={goalWeight}
            onChange={e => setGoalWeight(+e.target.value || 0)}
          />

          {diff !== 0 && (
            <div className="onboard-hint-box">
              {goal === 'bulk' && diff > 0 && `+${diff} lb to gain · ~${Math.ceil(diff / 0.5)} weeks at a lean bulk pace`}
              {goal === 'cut' && diff < 0 && `${diff} lb to lose · ~${Math.ceil(Math.abs(diff) / 1.0)} weeks at a sustainable pace`}
              {goal === 'recomp' && 'Scale stays the same — the goal is composition, not weight.'}
              {goal === 'bulk' && diff < 0 && '⚠ Goal weight is lower than current — switch to Cut?'}
              {goal === 'cut' && diff > 0 && '⚠ Goal weight is higher than current — switch to Bulk?'}
            </div>
          )}

          <div className="nav">
            <button onClick={back}>← Back</button>
            <button className="primary" onClick={next}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h2>Training experience</h2>
          <p className="sub">Determines your program split and volume.</p>

          {([
            { v: 'beginner' as Experience, t: 'Beginner', d: 'Under 1 year. Full-body program, learn the big lifts.' },
            { v: 'intermediate' as Experience, t: 'Intermediate', d: '1–3 years. Push/Pull/Legs split, higher volume.' },
            { v: 'advanced' as Experience, t: 'Advanced', d: '3+ years. High volume, periodized, progressive.' },
          ]).map(o => (
            <button
              key={o.v}
              className={`goal-card ${experience === o.v ? 'on' : ''}`}
              onClick={() => setExperience(o.v)}
            >
              <div>
                <strong>{o.t}</strong>
                <span>{o.d}</span>
              </div>
            </button>
          ))}

          <label style={{ marginTop: 20 }}>Lifting days per week</label>
          <div className="seg">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                className={liftDays === n ? 'on' : ''}
                onClick={() => setLiftDays(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 6 }}>
            {liftDays <= 3 ? 'Full-body sessions' : liftDays <= 4 ? 'Upper/Lower split' : 'Push/Pull/Legs split'}
          </p>

          <button className="primary big" style={{ marginTop: 24 }} onClick={finish}>
            Build my program →
          </button>
          <button style={{ marginTop: 8, width: '100%' }} onClick={back}>← Back</button>
        </div>
      )}
    </div>
  );
}
