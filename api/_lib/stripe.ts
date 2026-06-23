import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY env var not set');
    _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
  }
  return _stripe;
}

export const PRICE_MONTHLY = () => process.env.STRIPE_PRICE_MONTHLY!;
export const PRICE_YEARLY  = () => process.env.STRIPE_PRICE_YEARLY!;
export const SITE_URL      = () => process.env.SITE_URL || 'https://god-mode-lilac.vercel.app';
