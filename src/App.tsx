import { useEffect, useState } from 'react';
import type { AppState, Profile, WeightLog, WorkoutLog, NutritionLog, BodyMeasurement } from './types';
import { load, save, reset, todayISO } from './lib/storage';
import { buildProgram } from './lib/program-builder';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutView from './components/WorkoutView';
import NutritionView from './components/NutritionView';
import ProgressView from './components/ProgressView';
import ProgramView from './components/ProgramView';
import Settings from './components/Settings';
import TitlePreview from './components/TitlePreview';
import ShareCard from './components/ShareCard';

type View = 'dash' | 'workout' | 'nutrition' | 'progress' | 'program' | 'settings' | 'share';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const s = load();
    // Migration: older profiles missing new fields get sane defaults
    if (s.profile) {
      const p = s.profile as Partial<Profile>;
      const filled: Profile = {
        ...(p as Profile),
        liftDays: p.liftDays ?? 4,
        cardioDays: p.cardioDays ?? 2,
        priorityMuscles: p.priorityMuscles ?? [],
        mealsPerDay: p.mealsPerDay ?? 4,
        eatingWindowStart: p.eatingWindowStart ?? '08:00',
        eatingWindowEnd: p.eatingWindowEnd ?? '20:00',
      };
      s.profile = filled;
      if (!s.program || s.program.length !== 7) {
        s.program = buildProgram(filled);
      }
    }
    return s;
  });
  const [view, setView] = useState<View>('dash');

  useEffect(() => { save(state); }, [state]);

  if (typeof window !== 'undefined' && window.location.search.includes('stages=1')) {
    return <div className="app"><TitlePreview /></div>;
  }

  if (!state.profile) {
    return (
      <Onboarding
        onComplete={(p: Profile) => {
          setState(s => ({
            ...s,
            profile: p,
            programStartDate: todayISO(),
            weightLogs: [{ date: todayISO(), weightLb: p.startWeightLb }],
            program: buildProgram(p),
          }));
        }}
      />
    );
  }

  const onLogWeight = (log: WeightLog) => {
    setState(s => ({
      ...s,
      weightLogs: [...s.weightLogs.filter(w => w.date !== log.date), log],
      profile: s.profile ? { ...s.profile, currentWeightLb: log.weightLb } : s.profile,
    }));
  };
  const onSaveWorkout = (log: WorkoutLog) => {
    setState(s => ({ ...s, workoutLogs: [...s.workoutLogs, log] }));
  };
  const onSaveNutrition = (log: NutritionLog) => {
    setState(s => ({
      ...s,
      nutritionLogs: [...s.nutritionLogs.filter(n => n.date !== log.date), log],
    }));
  };
  const onSaveBodyMeasurement = (m: BodyMeasurement) => {
    setState(s => ({
      ...s,
      bodyMeasurements: [...(s.bodyMeasurements || []).filter(b => b.date !== m.date), m],
    }));
  };
  const onUpdateProfile = (p: Profile) => {
    setState(s => ({ ...s, profile: p, program: buildProgram(p) }));
    setView('dash');
  };
  const onResetAll = () => { reset(); location.reload(); };

  return (
    <div className="app">
      {view === 'dash' && <Dashboard state={state} onNav={v => setView(v as View)} />}
      {view === 'workout' && <WorkoutView state={state} onSave={onSaveWorkout} onBack={() => setView('dash')} />}
      {view === 'nutrition' && <NutritionView state={state} onSave={onSaveNutrition} onBack={() => setView('dash')} />}
      {view === 'progress' && <ProgressView state={state} onLogWeight={onLogWeight} onSaveBodyMeasurement={onSaveBodyMeasurement} onBack={() => setView('dash')} />}
      {view === 'program' && <ProgramView state={state} onBack={() => setView('dash')} />}
      {view === 'settings' && <Settings state={state} onUpdate={onUpdateProfile} onReset={onResetAll} onBack={() => setView('dash')} />}
      {view === 'share' && <ShareCard state={state} onBack={() => setView('dash')} />}
    </div>
  );
}
