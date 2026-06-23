import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, PRICE_MONTHLY, PRICE_YEARLY, SITE_URL } from './_lib/stripe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const userId = String(body.userId || '').trim();
    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const price = plan === 'yearly' ? PRICE_YEARLY() : PRICE_MONTHLY();

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId, plan },
      },
      success_url: `${SITE_URL()}/?paid=1`,
      cancel_url: `${SITE_URL()}/?canceled=1`,
      client_reference_id: userId,
      metadata: { userId, plan },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'checkout failed' });
  }
}
