import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { stripe } from './_lib/stripe.js';
import { putBilling, userIdForCustomer, type BillingRecord } from './_lib/billing.js';

// Vercel: disable body parsing so we can read raw body for signature verification.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function planFromPriceId(priceId: string | undefined): 'monthly' | 'yearly' {
  if (priceId && priceId === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  return 'monthly';
}

async function recordFromSubscription(sub: Stripe.Subscription, userIdHint?: string): Promise<BillingRecord | null> {
  const userId = userIdHint
    || (sub.metadata?.userId as string | undefined)
    || (typeof sub.customer === 'string' ? await userIdForCustomer(sub.customer) : null);
  if (!userId) return null;

  const item = sub.items?.data?.[0];
  // In Stripe API 2025+, current_period_end moved from subscription to line items.
  // Read both locations to stay compatible with older + newer API versions.
  const currentPeriodEnd =
    (sub as any).current_period_end
    ?? (item as any)?.current_period_end
    ?? 0;
  return {
    userId,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd,
    trialEnd: sub.trial_end || null,
    plan: planFromPriceId(item?.price?.id),
    updatedAt: Math.floor(Date.now() / 1000),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).json({ error: 'missing signature or secret' });

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    return res.status(400).json({ error: `webhook signature failed: ${e?.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.client_reference_id || (session.metadata?.userId as string | undefined)) ?? undefined;
        if (session.subscription && userId) {
          const sub = await stripe().subscriptions.retrieve(session.subscription as string);
          const rec = await recordFromSubscription(sub, userId);
          if (rec) await putBilling(rec);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        const rec = await recordFromSubscription(sub);
        if (rec) await putBilling(rec);
        break;
      }
      default:
        // ignore other events
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error('webhook handler error', e);
    return res.status(500).json({ error: e?.message });
  }
}
