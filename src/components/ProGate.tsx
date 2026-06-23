interface Props {
  onStartTrial: () => void;
  onMaybeLater: () => void;
}

export default function ProGate({ onStartTrial, onMaybeLater }: Props) {
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
          <div className="progate-feat">✓ AI meal photo scan</div>
          <div className="progate-feat">✓ Cloud backup</div>
          <div className="progate-feat">✓ Daily push reminders</div>
        </div>

        <div className="progate-price">
          <span className="progate-amount">$7</span>
          <span className="progate-period">/month</span>
        </div>

        <button className="primary big" onClick={onStartTrial}>
          Start 7-day free trial
        </button>
        <button className="progate-skip" onClick={onMaybeLater}>
          Maybe later
        </button>
        <p className="progate-fine">Cancel anytime. No charge for 7 days.</p>
      </div>
    </div>
  );
}
