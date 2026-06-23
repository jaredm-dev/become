import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBilling, isProActive } from './_lib/billing.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = String(req.query.userId || '').trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const rec = await getBilling(userId);
  return res.status(200).json({
    pro: isProActive(rec),
    status: rec?.status || null,
    plan: rec?.plan || null,
    currentPeriodEnd: rec?.currentPeriodEnd || null,
    trialEnd: rec?.trialEnd || null,
  });
}
