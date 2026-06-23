import { useState } from 'react';
import type { AppState, NutritionLog } from '../types';
import { macroTargets, microTargets } from '../lib/calculations';
import { todayISO } from '../lib/storage';
import BarcodeScanner from './BarcodeScanner';
import type { FoodInfo } from '../lib/food';
import { mealSchedule } from '../lib/meals';

interface Props {
  state: AppState;
  onSave: (log: NutritionLog) => void;
  onBack: () => void;
}

export default function NutritionView({ state, onSave, onBack }: Props) {
  const p = state.profile!;
  const m = macroTargets(p);
  const micro = microTargets(p);

  const today = state.nutritionLogs.find(n => n.date === todayISO());
  const [cals, setCals] = useState(today?.calories ?? 0);
  const [protein, setProtein] = useState(today?.proteinG ?? 0);
  const [carbs, setCarbs] = useState(today?.carbsG ?? 0);
  const [fat, setFat] = useState(today?.fatG ?? 0);
  const [water, setWater] = useState(today?.waterOz ?? 0);
  const [scanning, setScanning] = useState(false);

  const addFromScan = (food: FoodInfo, grams: number) => {
    const f = grams / 100;
    const newCals = cals + Math.round(food.calories * f);
    const newProtein = protein + Math.round(food.proteinG * f);
    const newCarbs = carbs + Math.round(food.carbsG * f);
    const newFat = fat + Math.round(food.fatG * f);
    setCals(newCals);
    setProtein(newProtein);
    setCarbs(newCarbs);
    setFat(newFat);
    // Auto-save so a back-navigation doesn't lose the scan
    onSave({ date: todayISO(), calories: newCals, proteinG: newProtein, carbsG: newCarbs, fatG: newFat, waterOz: water });
  };

  if (scanning) {
    return <BarcodeScanner onAdd={addFromScan} onClose={() => setScanning(false)} />;
  }

  const log = () => {
    onSave({ date: todayISO(), calories: cals, proteinG: protein, carbsG: carbs, fatG: fat, waterOz: water });
  };

  return (
    <div className="nutrition">
      <header className="page-head">
        <button onClick={onBack} className="back">← Back</button>
        <h2>Today's Fuel</h2>
      </header>

      <div className="rings">
        <Ring label="Calories" cur={cals} target={m.calories} unit="kcal" />
        <Ring label="Protein" cur={protein} target={m.proteinG} unit="g" />
        <Ring label="Carbs" cur={carbs} target={m.carbsG} unit="g" />
        <Ring label="Fat" cur={fat} target={m.fatG} unit="g" />
      </div>

      <div className="inputs">
        <Field label="Calories" value={cals} set={setCals} target={m.calories} unit="kcal" />
        <Field label="Protein" value={protein} set={setProtein} target={m.proteinG} unit="g" />
        <Field label="Carbs" value={carbs} set={setCarbs} target={m.carbsG} unit="g" />
        <Field label="Fat" value={fat} set={setFat} target={m.fatG} unit="g" />
        <Field label="Water" value={water} set={setWater} target={m.waterOz} unit="oz" />
      </div>

      <button className="primary big" onClick={log}>Save today</button>
      <button className="big" onClick={() => setScanning(true)}>📷 Scan barcode</button>

      <h3 className="section-h">Meal schedule</h3>
      <div className="meal-schedule">
        {mealSchedule(p).map((meal, i) => (
          <div key={i} className="meal-row">
            <div className="meal-time">{meal.time}</div>
            <div className="meal-info">
              <div className="meal-label">{meal.label}</div>
              <div className="meal-macros">{meal.calories} kcal · P {meal.proteinG}g · C {meal.carbsG}g · F {meal.fatG}g</div>
              <div className="meal-tip">{meal.tip}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-h">Daily micronutrient targets</h3>
      <div className="micros">
        <MicroRow name="Vitamin D" value={`${micro.vitaminD_IU} IU`} sources="Sun, salmon, egg yolks, fortified milk" />
        <MicroRow name="Vitamin C" value={`${micro.vitaminC_mg} mg`} sources="Citrus, peppers, broccoli, strawberries" />
        <MicroRow name="Vitamin A" value={`${micro.vitaminA_mcg} mcg`} sources="Sweet potato, carrots, liver, spinach" />
        <MicroRow name="Vitamin E" value={`${micro.vitaminE_mg} mg`} sources="Almonds, sunflower seeds, avocado" />
        <MicroRow name="Vitamin K" value={`${micro.vitaminK_mcg} mcg`} sources="Leafy greens, broccoli, brussels sprouts" />
        <MicroRow name="B12" value={`${micro.b12_mcg} mcg`} sources="Beef, salmon, eggs, dairy" />
        <MicroRow name="Folate" value={`${micro.folate_mcg} mcg`} sources="Beans, lentils, leafy greens, asparagus" />
        <MicroRow name="Calcium" value={`${micro.calcium_mg} mg`} sources="Dairy, sardines, kale, fortified plant milk" />
        <MicroRow name="Iron" value={`${micro.iron_mg} mg`} sources="Red meat, spinach, lentils, oysters" />
        <MicroRow name="Magnesium" value={`${micro.magnesium_mg} mg`} sources="Pumpkin seeds, dark chocolate, almonds, spinach" />
        <MicroRow name="Zinc" value={`${micro.zinc_mg} mg`} sources="Oysters, beef, pumpkin seeds, chickpeas" />
        <MicroRow name="Potassium" value={`${micro.potassium_mg} mg`} sources="Potato, banana, beans, salmon, yogurt" />
        <MicroRow name="Omega-3" value={`${micro.omega3_g} g`} sources="Salmon, sardines, walnuts, flax, fish oil" />
        <MicroRow name="Creatine" value={`${micro.creatine_g} g/day`} sources="Supplement — daily, no loading needed" />
      </div>

      <h3 className="section-h">Your meal schedule</h3>
      <ul className="meals">
        {mealSchedule(p).map((meal, i) => (
          <li key={i}>
            <strong>{meal.time} · {meal.label}</strong> — ~{meal.calories} kcal · P {meal.proteinG}g · C {meal.carbsG}g · F {meal.fatG}g
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{meal.tip}</div>
          </li>
        ))}
      </ul>

      <div className="rule">
        <strong>Rule #2:</strong> If the scale isn't moving up after 2 weeks, add 200 kcal/day. Food is the lever.
      </div>
    </div>
  );
}

function Ring({ label, cur, target, unit }: { label: string; cur: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((cur / target) * 100));
  return (
    <div className="ring">
      <div className="ring-circle">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#222" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22d3ee" strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" transform="rotate(-90 18 18)" strokeLinecap="round" />
        </svg>
        <div className="ring-text">{pct}%</div>
      </div>
      <div className="ring-label">{label}</div>
      <div className="ring-val">{cur}/{target}{unit === 'kcal' ? '' : unit}</div>
    </div>
  );
}

function Field({ label, value, set, target, unit }: { label: string; value: number; set: (n: number) => void; target: number; unit: string }) {
  return (
    <div className="field">
      <label>{label} <span className="tgt">/ {target} {unit}</span></label>
      <input type="number" value={value || ''} onChange={e => set(+e.target.value || 0)} placeholder="0" />
    </div>
  );
}

function MicroRow({ name, value, sources }: { name: string; value: string; sources: string }) {
  return (
    <div className="micro-row">
      <div className="micro-name">{name}</div>
      <div className="micro-val">{value}</div>
      <div className="micro-src">{sources}</div>
    </div>
  );
}
