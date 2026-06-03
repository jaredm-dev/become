import Title from './Title';

const STAGES = [
  { pct: 5, label: '5% — Pristine (just started)' },
  { pct: 25, label: '25% — First drops' },
  { pct: 50, label: '50% — Real splatter' },
  { pct: 70, label: '70% — Heavy + drips' },
  { pct: 90, label: '90% — Distressed' },
  { pct: 100, label: '100% — Final form (red)' },
];

export default function TitlePreview() {
  return (
    <div style={{ padding: '16px 8px' }}>
      <h2 style={{ textAlign: 'center', margin: '8px 0 16px', color: '#facc15' }}>Title progression</h2>
      {STAGES.map(s => (
        <div key={s.pct} style={{ marginBottom: 20, background: 'linear-gradient(135deg, #0a0a0a, #1a1f2e)', borderRadius: 12, padding: 8 }}>
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 4 }}>{s.label}</div>
          <Title pct={s.pct} />
        </div>
      ))}
    </div>
  );
}
