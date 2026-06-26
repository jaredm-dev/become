import type { VercelRequest, VercelResponse } from '@vercel/node';
import { recordReferral, getReferralStats } from './_lib/billing.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const referrerUserId = String(body.referrerUserId || '').trim();
    const newUserId = String(body.newUserId || '').trim();
    if (!referrerUserId || !newUserId) {
      return res.status(400).json({ error: 'referrerUserId + newUserId required' });
    }
    await recordReferral(referrerUserId, newUserId);
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const stats = await getReferralStats(userId);
    return res.status(200).json(stats);
  }
  return res.status(405).json({ error: 'method not allowed' });
}
