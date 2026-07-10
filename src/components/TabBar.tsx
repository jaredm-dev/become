interface Props {
  view: string;
  onNav: (v: string) => void;
}

const TABS = [
  { id: 'dash', icon: '⌂', label: 'Home' },
  { id: 'workout', icon: '🏋️', label: 'Train' },
  { id: 'nutrition', icon: '🍳', label: 'Fuel' },
  { id: 'progress', icon: '📈', label: 'Progress' },
  { id: 'program', icon: '📋', label: 'Plan' },
];

export default function TabBar({ view, onNav }: Props) {
  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${view === t.id ? 'on' : ''}`}
            onClick={() => onNav(t.id)}
            aria-label={t.label}
            aria-current={view === t.id ? 'page' : undefined}
          >
            <span className="t-icon">{t.icon}</span>
            <span>{t.label}</span>
            <span className="t-dot" />
          </button>
        ))}
      </div>
    </nav>
  );
}
