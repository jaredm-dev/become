import { useRef, useState } from 'react';
import { getUserId } from '../lib/pro';

interface ScanResult {
  name: string;
  confidence: 'high' | 'medium' | 'low' | string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes: string;
}

interface Props {
  onAdd: (macros: { calories: number; proteinG: number; carbsG: number; fatG: number }) => void;
  onClose: () => void;
  onUpgrade: () => void;
}

// Compress an image File/Blob client-side before sending — keeps the API payload small.
async function fileToCompressedBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const jpeg = canvas.toDataURL('image/jpeg', 0.82);
  const base64 = jpeg.split(',')[1] || '';
  return { data: base64, mediaType: 'image/jpeg' };
}

export default function MealScanner({ onAdd, onClose, onUpgrade }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hitFreeLimit, setHitFreeLimit] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [hint, setHint] = useState('');
  const [lastImageData, setLastImageData] = useState<{ data: string; mediaType: string } | null>(null);

  const onPick = () => fileRef.current?.click();

  async function runScan(imgData: { data: string; mediaType: string }, hintText?: string) {
    setBusy(true);
    setHitFreeLimit(false);
    setStatus(hintText ? `Re-analyzing with hint: "${hintText}"…` : 'Analyzing photo…');
    try {
      const r = await fetch('/api/scan-meal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), imageData: imgData.data, mediaType: imgData.mediaType, hint: hintText }),
      });
      if (r.status === 402) {
        const j = await r.json();
        setHitFreeLimit(true);
        setStatus(j.message || 'Free limit reached.');
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatus(`Error: ${j.error || r.statusText}`);
        return;
      }
      const scan: ScanResult = await r.json();
      setResult(scan);
      setStatus('');
    } catch (err: any) {
      setStatus(`Error: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setHint('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const compressed = await fileToCompressedBase64(file);
    setLastImageData(compressed);
    await runScan(compressed);
  };

  const onRetryWithHint = async () => {
    if (!hint.trim() || !lastImageData) return;
    setResult(null);
    await runScan(lastImageData, hint.trim());
  };

  const addToToday = () => {
    if (!result) return;
    const m = portionMultiplier;
    onAdd({
      calories: Math.round(result.calories * m),
      proteinG: Math.round(result.proteinG * m),
      carbsG: Math.round(result.carbsG * m),
      fatG: Math.round(result.fatG * m),
    });
    onClose();
  };

  return (
    <div className="meal-scanner">
      <header className="page-head">
        <button onClick={onClose} className="back">← Close</button>
        <h2>Scan a meal</h2>
        <div className="focus">AI estimates the macros from a photo.</div>
      </header>

      {!previewUrl && (
        <div className="scan-empty">
          <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 12 }}>🍽️</div>
          <p style={{ textAlign: 'center', color: '#d4d4d4', lineHeight: 1.5, marginBottom: 16 }}>
            Take a clear, well-lit photo of your plate. Get the whole portion in frame for the best estimate.
          </p>
          <button className="primary big" onClick={onPick}>📷 Take / choose photo</button>
        </div>
      )}

      {previewUrl && (
        <div className="scan-preview">
          <img src={previewUrl} alt="Meal preview" />
        </div>
      )}

      {status && <div className="hint" style={{ marginTop: 12 }}>{status}</div>}
      {busy && <div className="hint" style={{ marginTop: 8 }}>⚡ Claude is analyzing…</div>}

      {hitFreeLimit && (
        <div className="upgrade-card">
          <strong>You've used today's free scan.</strong>
          <p>Upgrade to BECOME Pro for unlimited AI meal scans, plus daily push notifications and more.</p>
          <button className="primary" onClick={onUpgrade}>See Pro plans</button>
        </div>
      )}

      {result && (
        <div className="scan-result">
          <div className="sr-name">{result.name}</div>
          <div className={`sr-conf sr-${result.confidence}`}>Confidence: {result.confidence}</div>

          <label>Portion size</label>
          <div className="seg">
            {[
              { v: 0.5, l: 'Half' },
              { v: 1, l: 'Full' },
              { v: 1.5, l: '1.5×' },
              { v: 2, l: '2×' },
            ].map(o => (
              <button key={o.v} className={portionMultiplier === o.v ? 'on' : ''} onClick={() => setPortionMultiplier(o.v)}>{o.l}</button>
            ))}
          </div>

          <div className="totals">
            <div><span>Calories</span><strong>{Math.round(result.calories * portionMultiplier)}</strong></div>
            <div><span>Protein</span><strong>{Math.round(result.proteinG * portionMultiplier)}g</strong></div>
            <div><span>Carbs</span><strong>{Math.round(result.carbsG * portionMultiplier)}g</strong></div>
            <div><span>Fat</span><strong>{Math.round(result.fatG * portionMultiplier)}g</strong></div>
          </div>

          {result.notes && <div className="sr-notes">💡 {result.notes}</div>}

          <div className="hint-correct">
            <label style={{ marginTop: 0 }}>Wrong? Tell me what it is</label>
            <div className="row">
              <input
                type="text"
                placeholder="e.g. sourdough bread, chicken pad thai…"
                value={hint}
                onChange={e => setHint(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onRetryWithHint(); }}
              />
              <button onClick={onRetryWithHint} disabled={!hint.trim() || busy}>Re-scan</button>
            </div>
          </div>

          <button className="primary big" onClick={addToToday}>Add to today</button>
          <button onClick={() => { setResult(null); setPreviewUrl(null); setLastImageData(null); setHint(''); }}>Scan another</button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </div>
  );
}
