import { useEffect, useRef, useState } from 'react';
import type { AppState, Profile, MuscleGroup } from '../types';
import { getReminderTime, setReminderTime, clearReminder, requestNotificationPermission } from '../lib/reminders';
import { subscribePush, unsubscribePush } from '../lib/push';
import { MUSCLE_LABELS, FOCUS_PRESETS } from '../lib/program-builder';
import { exportData, importData } from '../lib/storage';
import { refreshProStatus, openCustomerPortal, startCheckout, getCachedProStatus, type ProStatus } from '../lib/pro';

interface Props {
  state: AppState;
  onUpdate: (p: Profile) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function Settings({ state, onUpdate, onReset, onBack }: Props) {
  const p = state.profile!;
  const [draft, setDraft] = useState<Profile>(p);
  const [reminder, setReminder] = useState<string>(getReminderTime() ?? '');
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermState(Notification.permission);
  }, []);

  const [pro, setPro] = useState<ProStatus>(() => getCachedProStatus());
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMsg, setBillingMsg] = useState('');
  useEffect(() => { refreshProStatus().then(setPro); }, []);

  const onManage = async () => {
    setBillingBusy(true);
    setBillingMsg('');
    const r = await openCustomerPortal();
    if (!r.ok) { setBillingMsg(r.reason || 'Could not open billing portal'); setBillingBusy(false); }
  };
  const onSubscribe = async (plan: 'monthly' | 'yearly') => {
    setBillingBusy(true);
    setBillingMsg('');
    const r = await startCheckout(plan);
    if (!r.ok) { setBillingMsg(r.reason || 'Checkout failed'); setBillingBusy(false); }
  };
  const fmtDate = (s: number | null) => s ? new Date(s * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const enableReminder = async (hhmm: string) => {
    setReminder(hhmm);
    if (!hhmm) { clearReminder(); return; }
    const perm = await requestNotificationPermission();
    setPermState(perm);
    if (perm === 'granted') setReminderTime(hhmm);
  };

  const [pushStatus, setPushStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `become-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = importData(text);
      if (ok) {
        setImportStatus('✓ Data restored! Reloading…');
        setTimeout(() => location.reload(), 1000);
      } else {
        setImportStatus('✗ Invalid backup file. Please try again.');
      }
    };
    reader.readAsText(file);
  };
  const enablePush = async () => {
    if (!reminder) { setPushStatus('Set a reminder time first.'); return; }
    setPushStatus('Subscribing…');
    const hour = parseInt(reminder.split(':')[0], 10);
    const prog = (state.program ?? []).map(d => ({
      name: d.name,
      focus: d.focus,
      top: d.exercises.slice(0, 3).map(e => `${e.name} ${e.sets}×${e.reps}`),
    }));
    const res = await subscribePush({
      reminderHour: hour,
      experience: p.experience,
      programStartDate: state.programStartDate || p.createdAt,
      name: p.name,
      program: prog,
    });
    setPushStatus(res.ok ? '✓ Daily workout push enabled.' : `✗ ${res.reason}`);
  };
  const disablePush = async () => {
    setPushStatus('Unsubscribing…');
    await unsubscribePush();
    setPushStatus('Push disabled.');
  };

  return (
    <div className="settings">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>Settings</h2>
      </header>

      <div className="field">
        <label>Name</label>
        <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Current weight (lb)</label>
        <input type="number" value={draft.currentWeightLb} onChange={e => setDraft({ ...draft, currentWeightLb: +e.target.value })} />
      </div>
      <div className="field">
        <label>Goal weight (lb)</label>
        <input type="number" value={draft.goalWeightLb} onChange={e => setDraft({ ...draft, goalWeightLb: +e.target.value })} />
      </div>
      <div className="field">
        <label>Timeline (weeks) — blank = recommended pace</label>
        <input
          type="number"
          value={draft.goalWeeks ?? ''}
          placeholder="auto"
          onChange={e => {
            const v = parseInt(e.target.value);
            setDraft({ ...draft, goalWeeks: isNaN(v) || v <= 0 ? null : v });
          }}
        />
      </div>
      <div className="field">
        <label>Goal</label>
        <select value={draft.goal} onChange={e => setDraft({ ...draft, goal: e.target.value as Profile['goal'] })}>
          <option value="bulk">Bulk</option>
          <option value="recomp">Recomp</option>
          <option value="cut">Cut</option>
        </select>
      </div>
      <div className="field">
        <label>Experience</label>
        <select value={draft.experience} onChange={e => setDraft({ ...draft, experience: e.target.value as Profile['experience'] })}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="field">
        <label>Activity level</label>
        <select value={draft.activity} onChange={e => setDraft({ ...draft, activity: e.target.value as Profile['activity'] })}>
          <option value="sedentary">Sedentary</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="athlete">Athlete</option>
        </select>
      </div>

      <h3 className="section-h">Training schedule</h3>
      <div className="field">
        <label>Lifting days / week</label>
        <div className="seg">
          {[2,3,4,5,6].map(n => (
            <button key={n} className={draft.liftDays === n ? 'on' : ''} onClick={() => setDraft({ ...draft, liftDays: n })}>{n}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Cardio days / week</label>
        <div className="seg">
          {[0,1,2,3,4].map(n => (
            <button key={n} className={draft.cardioDays === n ? 'on' : ''} onClick={() => setDraft({ ...draft, cardioDays: n })}>{n}</button>
          ))}
        </div>
      </div>

      <h3 className="section-h">What you're building</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {FOCUS_PRESETS.map(preset => {
          const isActive = JSON.stringify([...preset.muscles].sort()) === JSON.stringify([...(draft.priorityMuscles ?? [])].sort());
          return (
            <button
              key={preset.id}
              className={`card ${isActive ? 'on' : ''}`}
              onClick={() => setDraft({ ...draft, priorityMuscles: preset.muscles })}
            >
              <strong>{preset.emoji} {preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          );
        })}
      </div>
      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--accent)', marginBottom: 8 }}>Or pick specific muscles</summary>
      <div className="muscle-grid">
        {MUSCLE_LABELS.map(m => {
          const idx = (draft.priorityMuscles ?? []).indexOf(m.value);
          const toggle = () => {
            const curr = draft.priorityMuscles ?? [];
            const next: MuscleGroup[] = curr.includes(m.value)
              ? curr.filter(x => x !== m.value)
              : (curr.length >= 3 ? [...curr.slice(1), m.value] : [...curr, m.value]);
            setDraft({ ...draft, priorityMuscles: next });
          };
          return (
            <button key={m.value} className={`muscle-chip ${idx >= 0 ? 'on' : ''}`} onClick={toggle}>
              <span className="emoji">{m.emoji}</span>
              <span>{m.label}</span>
              {idx >= 0 && <span className="rank">#{idx + 1}</span>}
            </button>
          );
        })}
      </div>

      </details>

      <h3 className="section-h">Eating window</h3>
      <div className="field">
        <label>Meals per day</label>
        <div className="seg">
          {[3,4,5,6].map(n => (
            <button key={n} className={draft.mealsPerDay === n ? 'on' : ''} onClick={() => setDraft({ ...draft, mealsPerDay: n })}>{n}</button>
          ))}
        </div>
      </div>
      <div className="row">
        <div className="col" style={{ flex: 1 }}>
          <label>Start</label>
          <input type="time" value={draft.eatingWindowStart} onChange={e => setDraft({ ...draft, eatingWindowStart: e.target.value })} />
        </div>
        <div className="col" style={{ flex: 1 }}>
          <label>End</label>
          <input type="time" value={draft.eatingWindowEnd} onChange={e => setDraft({ ...draft, eatingWindowEnd: e.target.value })} />
        </div>
      </div>

      <button className="primary big" onClick={() => onUpdate(draft)}>Save changes</button>

      <h3 className="section-h">Subscription</h3>
      {pro.pro ? (
        <div className="sub-block">
          <div className="sub-status-row">
            <span className="sub-badge">BECOME PRO</span>
            <span className="muted">
              {pro.status === 'trialing' ? `Trial ends ${fmtDate(pro.trialEnd)}` : `Renews ${fmtDate(pro.currentPeriodEnd)}`}
            </span>
          </div>
          <div className="hint">Plan: {pro.plan === 'yearly' ? '$39 / year' : '$4.99 / month'}</div>
          <button className="primary big" onClick={onManage} disabled={billingBusy}>
            {billingBusy ? 'Opening…' : 'Manage subscription'}
          </button>
        </div>
      ) : (
        <div className="sub-block">
          <div className="hint" style={{ marginBottom: 10 }}>
            Free tier active. Unlock cloud sync, daily workout push, body measurements + more.
          </div>
          <div className="row">
            <button className="primary" onClick={() => onSubscribe('yearly')} disabled={billingBusy}>
              {billingBusy ? '…' : '$39/yr — start trial'}
            </button>
            <button onClick={() => onSubscribe('monthly')} disabled={billingBusy}>
              $4.99/mo
            </button>
          </div>
        </div>
      )}
      {billingMsg && <div className="hint" style={{ marginTop: 6, color: 'var(--danger)' }}>{billingMsg}</div>}

      <h3 className="section-h">Daily weigh-in reminder</h3>
      <div className="field">
        <label>Time (24h) — leave blank to disable</label>
        <input type="time" value={reminder} onChange={e => enableReminder(e.target.value)} />
      </div>
      <div className="hint">
        {permState === 'unsupported' && 'Notifications not supported in this browser.'}
        {permState === 'denied' && '⚠ Notifications denied. Enable them in Safari settings, then set a time.'}
        {permState === 'granted' && reminder && `✓ You'll be reminded daily at ${reminder}.`}
        {permState === 'default' && reminder && 'Permission required — set a time to be prompted.'}
        {!reminder && permState !== 'denied' && permState !== 'unsupported' && 'For best results on iOS, "Add to Home Screen" first, then enable.'}
      </div>

      <h3 className="section-h">Daily workout push (server-sent)</h3>
      <div className="hint" style={{ marginBottom: 12 }}>
        Sends a real notification at your reminder time with today's workout — works even when the app is closed. Requires iOS 16.4+ and "Add to Home Screen".
      </div>
      <div className="row">
        <button className="primary" onClick={enablePush}>Enable workout push</button>
        <button onClick={disablePush}>Disable</button>
      </div>
      {pushStatus && <div className="hint" style={{ marginTop: 8 }}>{pushStatus}</div>}

      <h3 className="section-h">Data backup</h3>
      <div className="hint" style={{ marginBottom: 12 }}>
        Your data lives in your browser. Export a backup to keep it safe — especially before clearing your browser or switching devices.
      </div>
      <div className="row">
        <button className="primary" onClick={handleExport}>⬇ Export backup</button>
        <button onClick={() => fileInputRef.current?.click()}>⬆ Restore backup</button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      {importStatus && <div className="hint" style={{ marginTop: 8 }}>{importStatus}</div>}

      <button className="danger" style={{ marginTop: 32 }} onClick={() => {
        if (confirm('Reset everything? This deletes all data.')) onReset();
      }}>Reset all data</button>
    </div>
  );
}
