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

// ── Referrals ────────────────────────────────────────────────────────

export interface ReferralStats {
  totalReferrals: number;        // people who signed up via my link
  paidReferrals: number;         // of those, how many converted to paid
  bonusDaysEarned: number;       // 30 days per paid referral
  bonusDaysApplied: number;      // how many we've already credited via Stripe
}

const EMPTY_STATS: ReferralStats = {
  totalReferrals: 0,
  paidReferrals: 0,
  bonusDaysEarned: 0,
  bonusDaysApplied: 0,
};

export async function recordReferral(referrerUserId: string, newUserId: string): Promise<void> {
  // Prevent self-referral and dupes
  if (referrerUserId === newUserId) return;
  const key = `ref:${referrerUserId}`;
  const set = `refset:${referrerUserId}`;
  await r().sadd(set, newUserId);
  // Increment total count (computed from set cardinality on read)
  // Also store the back-pointer so webhook can find the referrer
  await r().set(`refby:${newUserId}`, referrerUserId);
  // Initialize stats record if missing
  const existing = await r().get<ReferralStats>(key);
  if (!existing) await r().set(key, EMPTY_STATS);
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const key = `ref:${userId}`;
  const stats = (await r().get<ReferralStats>(key)) || { ...EMPTY_STATS };
  // Refresh totalReferrals from set cardinality (authoritative)
  const total = (await r().scard(`refset:${userId}`)) || 0;
  stats.totalReferrals = total;
  return stats;
}

export async function getReferrerOf(userId: string): Promise<string | null> {
  return (await r().get<string>(`refby:${userId}`)) || null;
}

export async function markReferralPaid(referrerUserId: string, bonusDays: number): Promise<ReferralStats> {
  const key = `ref:${referrerUserId}`;
  const stats = (await r().get<ReferralStats>(key)) || { ...EMPTY_STATS };
  stats.paidReferrals += 1;
  stats.bonusDaysEarned += bonusDays;
  await r().set(key, stats);
  return stats;
}

export async function applyBonusDays(referrerUserId: string, days: number): Promise<void> {
  const key = `ref:${referrerUserId}`;
  const stats = (await r().get<ReferralStats>(key)) || { ...EMPTY_STATS };
  stats.bonusDaysApplied += days;
  await r().set(key, stats);
}
