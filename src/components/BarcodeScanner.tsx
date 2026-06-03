import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { lookupBarcode, type FoodInfo } from '../lib/food';

interface Props {
  onAdd: (food: FoodInfo, grams: number) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onAdd, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [status, setStatus] = useState<string>('Starting camera…');
  const [food, setFood] = useState<FoodInfo | null>(null);
  const [grams, setGrams] = useState(100);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let cancelled = false;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        if (!videoRef.current) return;
        setStatus('Point camera at a barcode…');
        const controls = await reader.decodeFromVideoDevice(
          undefined, // null = let zxing pick the rear camera
          videoRef.current,
          async (result, _err, ctrl) => {
            if (cancelled) { ctrl.stop(); return; }
            if (result) {
              const code = result.getText();
              ctrl.stop();
              setStatus(`Found ${code}, looking up…`);
              const info = await lookupBarcode(code);
              if (info) {
                setFood(info);
              } else {
                setStatus(`Code ${code} not in OpenFoodFacts. Try typing it manually below.`);
              }
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: any) {
        setStatus(`Camera unavailable: ${e?.message || e}. Type the code manually below.`);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  const submitManual = async () => {
    if (!manualCode.trim()) return;
    setStatus(`Looking up ${manualCode}…`);
    const info = await lookupBarcode(manualCode.trim());
    if (info) setFood(info);
    else setStatus(`Code ${manualCode} not found.`);
  };

  if (food) {
    const factor = grams / 100;
    return (
      <div className="scanner-result">
        <header className="page-head">
          <button onClick={onClose} className="back">← Close</button>
          <h2>Found it</h2>
        </header>
        <div className="food-card">
          <div className="food-name">{food.name}</div>
          {food.brand && <div className="food-brand">{food.brand}</div>}
          <div className="per100">Per 100g: {food.calories} kcal · P {food.proteinG} · C {food.carbsG} · F {food.fatG}</div>
        </div>

        <label>Amount eaten (grams)</label>
        <input type="number" value={grams} onChange={e => setGrams(+e.target.value || 0)} />

        <div className="totals">
          <div><span>Calories</span><strong>{Math.round(food.calories * factor)}</strong></div>
          <div><span>Protein</span><strong>{Math.round(food.proteinG * factor)}g</strong></div>
          <div><span>Carbs</span><strong>{Math.round(food.carbsG * factor)}g</strong></div>
          <div><span>Fat</span><strong>{Math.round(food.fatG * factor)}g</strong></div>
        </div>

        <button className="primary big" onClick={() => { onAdd(food, grams); onClose(); }}>Add to today</button>
        <button onClick={() => { setFood(null); setStatus('Point camera at a barcode…'); window.location.reload(); }}>Scan another</button>
      </div>
    );
  }

  return (
    <div className="scanner">
      <header className="page-head">
        <button onClick={onClose} className="back">← Close</button>
        <h2>Scan food</h2>
        <div className="focus">{status}</div>
      </header>

      <div className="cam-frame">
        <video ref={videoRef} playsInline muted autoPlay />
        <div className="cam-overlay" />
      </div>

      <label>Or type barcode manually</label>
      <div className="row">
        <input value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. 5449000000996" inputMode="numeric" />
        <button className="primary" onClick={submitManual}>Look up</button>
      </div>

      <div className="hint" style={{ marginTop: 16 }}>
        Powered by OpenFoodFacts. Coverage is best for packaged supermarket food. Holds the camera steady ~6 inches from the barcode.
      </div>
    </div>
  );
}
