import { Redis } from '@upstash/redis';

export interface BillingRecord {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid' | string;
  currentPeriodEnd: number;     // unix seconds
  trialEnd: number | null;      // unix seconds
  plan: 'monthly' | 'yearly';
  updatedAt: number;
}

let _redis: Redis | null = null;
function r(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export async function getBilling(userId: string): Promise<BillingRecord | null> {
  return (await r().get<BillingRecord>(`billing:${userId}`)) || null;
}

export async function putBilling(rec: BillingRecord): Promise<void> {
  await r().set(`billing:${rec.userId}`, rec);
  await r().set(`customer:${rec.customerId}`, rec.userId);
}

export async function userIdForCustomer(customerId: string): Promise<string | null> {
  return (await r().get<string>(`customer:${customerId}`)) || null;
}

export function isProActive(rec: BillingRecord | null): boolean {
  if (!rec) return false;
  if (rec.status === 'trialing' || rec.status === 'active') return true;
  // Still pro until the end of the paid period even if canceled
  if (rec.status === 'canceled' && rec.currentPeriodEnd * 1000 > Date.now()) return true;
  return false;
}
