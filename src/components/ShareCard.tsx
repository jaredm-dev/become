import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { AppState } from '../types';
import Title from './Title';
import { progressPct } from '../lib/calculations';
import { weekSummary, computeStreaks, streakPhrase } from '../lib/streaks';

interface Props {
  state: AppState;
  onBack: () => void;
}

export default function ShareCard({ state, onBack }: Props) {
  const p = state.profile!;
  const wk = weekSummary(state);
  const streaks = computeStreaks(state);
  const pct = progressPct(p);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const onShare = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setShareStatus('');
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0a0a0a',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `become-week-${wk.weekNum}.png`, { type: 'image/png' });
      if ((navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'BECOME', text: `Week ${wk.weekNum}` });
        setShareStatus('Shared.');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setShareStatus('Saved to downloads.');
      }
    } catch (e: any) {
      setShareStatus(`Error: ${e?.message || e}`);
    } finally {
      setExporting(false);
    }
  };

  const deltaPrefix = wk.weightDelta > 0 ? '+' : wk.weightDelta < 0 ? '' : '±';

  return (
    <div className="share-page">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>Week {wk.weekNum} share card</h2>
        <div className="focus">Save it. Post it. Send it.</div>
      </header>

      <div className="share-wrap">
        <div ref={cardRef} className="share-card">
          <div className="sc-title">
            <Title pct={pct} />
          </div>
          <div className="sc-week">WEEK {wk.weekNum}</div>

          <div className="sc-big">
            {deltaPrefix}{Math.abs(wk.weightDelta).toFixed(1)}
          </div>
          <div className="sc-big-sub">
            lb {wk.weightDelta > 0 ? 'gained' : wk.weightDelta < 0 ? 'lost' : 'change'} this week
          </div>

          <div className="sc-row">
            <div className="sc-stat">
              <div className="sc-stat-l">WORKOUTS</div>
              <div className="sc-stat-v" style={{ color: '#facc15' }}>{wk.workoutsHit}</div>
            </div>
            <div className="sc-stat">
              <div className="sc-stat-l">PROTEIN HIT</div>
              <div className="sc-stat-v" style={{ color: '#22d3ee' }}>{wk.proteinDaysHit}/7</div>
            </div>
          </div>

          <div className="sc-streak">
            <div className="sc-stat-l">STREAK</div>
            <div className="sc-streak-v">
              {streaks.overall} {streaks.overall === 1 ? 'day' : 'days'} locked in
            </div>
          </div>

          <div className="sc-bar-label">
            {pct}% TO GOAL ({p.currentWeightLb} → {p.goalWeightLb} lb)
          </div>
          <div className="sc-bar"><div className="sc-bar-fill" style={{ width: `${pct}%` }} /></div>

          <div className="sc-foot">BECOME · Zero to Hero</div>
        </div>
      </div>

      <p className="streak-phrase">{streakPhrase(streaks)}</p>

      <button className="primary big" onClick={onShare} disabled={exporting}>
        {exporting ? 'Generating…' : '📤 Save / Share image'}
      </button>
      {shareStatus && <div className="hint" style={{ marginTop: 8 }}>{shareStatus}</div>}

      <div className="hint" style={{ marginTop: 16 }}>
        On iPhone the Share sheet pops up — pick "Save to Photos" or send straight to Instagram / Messages.
      </div>
    </div>
  );
}
