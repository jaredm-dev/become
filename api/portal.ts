import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, SITE_URL } from './_lib/stripe';
import { getBilling } from './_lib/billing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const userId = String(body.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const rec = await getBilling(userId);
    if (!rec) return res.status(404).json({ error: 'no billing record for this user' });

    const session = await stripe().billingPortal.sessions.create({
      customer: rec.customerId,
      return_url: SITE_URL(),
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'portal failed' });
  }
}
