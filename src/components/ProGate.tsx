import { useState } from 'react';
import { startCheckout } from '../lib/pro';

interface Props {
  onStartTrial?: () => void;     // optional legacy callback (called on click before redirect)
  onMaybeLater: () => void;
}

export default function ProGate({ onStartTrial, onMaybeLater }: Props) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setErr(null);
    onStartTrial?.();
    const res = await startCheckout(plan);
    if (!res.ok) {
      setErr(res.reason || 'Checkout failed');
      setBusy(false);
    }
    // If successful, browser navigates to Stripe — no need to reset state.
  };

  return (
    <div className="progate-overlay">
      <div className="progate-card">
        <div className="progate-badge">BECOME PRO</div>
        <h2 className="progate-title">Keep your streak alive.</h2>
        <p className="progate-sub">
          You've built a habit. Pro keeps you going with unlimited program cycles, progressive overload history, and cloud backup so you never lose your data.
        </p>

        <div className="progate-features">
          <div className="progate-feat">✓ Unlimited program cycles</div>
          <div className="progate-feat">✓ Progressive overload history</div>
          <div className="progate-feat">✓ Body measurement tracking</div>
          <div className="progate-feat">✓ Daily workout push notifications</div>
          <div className="progate-feat">✓ Cloud backup + multi-device sync</div>
          <div className="progate-feat">✓ End-of-week share cards</div>
        </div>

        <div className="progate-plans">
          <button
            className={`progate-plan ${plan === 'yearly' ? 'on' : ''}`}
            onClick={() => setPlan('yearly')}
          >
            <div className="pp-tag">SAVE 35%</div>
            <div className="pp-price">$39<span>/yr</span></div>
            <div className="pp-equiv">$3.25/mo</div>
          </button>
          <button
            className={`progate-plan ${plan === 'monthly' ? 'on' : ''}`}
            onClick={() => setPlan('monthly')}
          >
            <div className="pp-price">$4.99<span>/mo</span></div>
            <div className="pp-equiv">Pay as you go</div>
          </button>
        </div>

        <button className="primary big" onClick={start} disabled={busy}>
          {busy ? 'Redirecting to Stripe…' : 'Start 7-day free trial'}
        </button>
        <button className="progate-skip" onClick={onMaybeLater} disabled={busy}>
          Maybe later
        </button>

        {err && <p className="progate-err">{err}</p>}
        <p className="progate-fine">Cancel anytime in Settings. No charge for 7 days. Card required.</p>
      </div>
    </div>
  );
}
