import { useEffect, useState } from 'react';

const DISMISS_KEY = 'become.installHint.dismissed';

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia?.('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (!isIOSSafari()) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <div className="install-hint">
      <div className="ih-body">
        <strong>Install BECOME</strong>
        <p>
          Tap <span className="ih-icon">⇧</span> Share, then <strong>"Add to Home Screen"</strong>.
          Full screen. Push notifications. No browser chrome.
        </p>
      </div>
      <button onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
