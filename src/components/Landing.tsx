import Title from './Title';

interface Props {
  onStart: () => void;
}

export default function Landing({ onStart }: Props) {
  return (
    <div className="landing">
      <div className="landing-logo">
        <Title pct={35} />
      </div>

      <div className="landing-body">
        <p className="landing-tagline">Your body is capable of more than you think.</p>
        <p className="landing-sub">
          BECOME builds your lifting program, tracks your macros, and shows you exactly how far you've come — every single day.
        </p>

        <div className="landing-pills">
          <div className="pill">💪 Custom lift program</div>
          <div className="pill">🍳 Macro targets + meal timing</div>
          <div className="pill">📈 Weight + strength tracking</div>
          <div className="pill">🔥 Streak system</div>
        </div>

        <button className="primary big landing-cta" onClick={onStart}>
          Build my program →
        </button>
        <p className="landing-fine">Free to start. No account required.</p>
      </div>
    </div>
  );
}
