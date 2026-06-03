export interface FoodInfo {
  name: string;
  brand?: string;
  servingG?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export async function lookupBarcode(code: string): Promise<FoodInfo | null> {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    const p = j.product;
    const n = p.nutriments || {};
    // OFF returns per 100g typically; we surface per-100g.
    return {
      name: p.product_name || p.generic_name || 'Unknown',
      brand: p.brands,
      servingG: parseFloat(p.serving_quantity) || 100,
      calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
      proteinG: Math.round((n['proteins_100g'] ?? n['proteins'] ?? 0) * 10) / 10,
      carbsG: Math.round((n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0) * 10) / 10,
      fatG: Math.round((n['fat_100g'] ?? n['fat'] ?? 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}
