import { useEffect, useState } from 'react';
import type { AppState, Profile, WeightLog, WorkoutLog, NutritionLog, BodyMeasurement } from './types';
import { load, save, reset, todayISO } from './lib/storage';
import { buildProgram } from './lib/program-builder';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutView from './components/WorkoutView';
import NutritionView from './components/NutritionView';
import ProgressView from './components/ProgressView';
import ProgramView from './components/ProgramView';
import Settings from './components/Settings';
import ShareCard from './components/ShareCard';
import ProGate from './components/ProGate';
import WeeklyCheckIn from './components/WeeklyCheckIn';
import TitlePreview from './components/TitlePreview';
import InstallHint from './components/InstallHint';
import TabBar from './components/TabBar';

type View = 'dash' | 'workout' | 'nutrition' | 'progress' | 'program' | 'settings' | 'share';

// How many days before Pro gate appears
const PRO_GATE_AFTER_DAYS = 7;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function weekNumber(startIso: string): number {
  return Math.floor(daysSince(startIso) / 7) + 1;
}

function isSunday(): boolean {
  return new Date().getDay() === 0;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const s = load();
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
  const [showLanding, setShowLanding] = useState(!state.profile && !(state as any).landingSeen);
  const [showProGate, setShowProGate] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [proTrialDismissed, setProTrialDismissed] = useState(
    () => !!localStorage.getItem('become.proTrialDismissed')
  );
  const [checkInDismissedWeek, setCheckInDismissedWeek] = useState(
    () => parseInt(localStorage.getItem('become.checkInDismissedWeek') || '0')
  );

  useEffect(() => { save(state); }, [state]);

  // Pro gate: show if they have a profile and haven't dismissed
  useEffect(() => {
    if (!state.profile || proTrialDismissed) return;
    const t = setTimeout(() => setShowProGate(true), 1500);
    return () => clearTimeout(t);
  }, [state.profile, proTrialDismissed]);

  // Weekly check-in: show on Sunday if they haven't dismissed this week
  useEffect(() => {
    if (!state.profile || !state.programStartDate) return;
    const week = weekNumber(state.programStartDate);
    if (isSunday() && week > checkInDismissedWeek && week > 1) {
      setShowCheckIn(true);
    }
  }, [state.profile]);

  if (typeof window !== 'undefined' && window.location.search.includes('stages=1')) {
    return <div className="app"><TitlePreview /></div>;
  }

  // Landing screen for brand-new users
  if (showLanding) {
    return (
      <div className="app">
        <Landing onStart={() => {
          localStorage.setItem('become.landingSeen', '1');
          setShowLanding(false);
        }} />
      </div>
    );
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

  const handleProDismiss = () => {
    localStorage.setItem('become.proTrialDismissed', '1');
    setProTrialDismissed(true);
    setShowProGate(false);
  };

  const handleProStart = () => {
    // Placeholder — wire Stripe here
    alert('Stripe coming soon! For now you have full access.');
    handleProDismiss();
  };

  const handleCheckInComplete = (weight: WeightLog, _workouts: number) => {
    onLogWeight(weight);
    const week = weekNumber(state.programStartDate!);
    localStorage.setItem('become.checkInDismissedWeek', String(week));
    setCheckInDismissedWeek(week);
    setShowCheckIn(false);
  };

  const handleCheckInDismiss = () => {
    const week = weekNumber(state.programStartDate!);
    localStorage.setItem('become.checkInDismissedWeek', String(week));
    setCheckInDismissedWeek(week);
    setShowCheckIn(false);
  };

  const weekNum = weekNumber(state.programStartDate || state.profile.createdAt);

  return (
    <>
      {showProGate && (
        <ProGate onStartTrial={handleProStart} onMaybeLater={handleProDismiss} />
      )}
      {showCheckIn && !showProGate && (
        <WeeklyCheckIn
          state={state}
          weekNum={weekNum}
          onComplete={handleCheckInComplete}
          onDismiss={handleCheckInDismiss}
        />
      )}
      <div className="app">
        {view === 'dash' && <Dashboard state={state} onNav={v => setView(v as View)} />}
        {view === 'workout' && <WorkoutView state={state} onSave={onSaveWorkout} onBack={() => setView('dash')} />}
        {view === 'nutrition' && <NutritionView state={state} onSave={onSaveNutrition} onBack={() => setView('dash')} />}
        {view === 'progress' && <ProgressView state={state} onLogWeight={onLogWeight} onSaveBodyMeasurement={onSaveBodyMeasurement} onBack={() => setView('dash')} />}
        {view === 'program' && <ProgramView state={state} onBack={() => setView('dash')} />}
        {view === 'settings' && <Settings state={state} onUpdate={onUpdateProfile} onReset={onResetAll} onBack={() => setView('dash')} />}
        {view === 'share' && <ShareCard state={state} onBack={() => setView('dash')} />}
      </div>
      <TabBar view={view} onNav={v => setView(v as View)} />
      <InstallHint />
    </>
  );
}
