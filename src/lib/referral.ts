import { getUserId } from './pro';

const REF_BY_KEY = 'become.referredBy';
const REF_SENT_KEY = 'become.refSent';

export function getReferralLink(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?ref=${encodeURIComponent(getUserId())}`;
}

// Called on app boot to capture ?ref=... from the URL.
export async function captureReferralFromURL(): Promise<void> {
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (!ref) return;
    // Don't overwrite if we already have a referrer
    if (localStorage.getItem(REF_BY_KEY)) return;
    // Don't allow self-referral
    if (ref === getUserId()) return;
    localStorage.setItem(REF_BY_KEY, ref);
    // Remove the param from the URL (cosmetic)
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

// Send the captured referral to the backend (idempotent — only once per user).
export async function reportReferralOnce(): Promise<void> {
  const referredBy = localStorage.getItem(REF_BY_KEY);
  if (!referredBy) return;
  if (localStorage.getItem(REF_SENT_KEY) === referredBy) return;
  try {
    const r = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ referrerUserId: referredBy, newUserId: getUserId() }),
    });
    if (r.ok) localStorage.setItem(REF_SENT_KEY, referredBy);
  } catch {}
}

export interface ReferralStats {
  totalReferrals: number;
  paidReferrals: number;
  bonusDaysEarned: number;
  bonusDaysApplied: number;
}

export async function fetchReferralStats(): Promise<ReferralStats> {
  try {
    const r = await fetch(`/api/referral?userId=${encodeURIComponent(getUserId())}`);
    if (!r.ok) return { totalReferrals: 0, paidReferrals: 0, bonusDaysEarned: 0, bonusDaysApplied: 0 };
    return await r.json();
  } catch {
    return { totalReferrals: 0, paidReferrals: 0, bonusDaysEarned: 0, bonusDaysApplied: 0 };
  }
}

export async function shareReferralLink(): Promise<{ ok: boolean; reason?: string }> {
  const link = getReferralLink();
  const text = `Try BECOME — the weight-gain tracker that visually transforms as you build muscle. Get 7 days free.`;
  try {
    if ((navigator as any).share) {
      await navigator.share({ title: 'BECOME', text, url: link });
      return { ok: true };
    } else {
      await navigator.clipboard.writeText(link);
      return { ok: true, reason: 'Link copied to clipboard' };
    }
  } catch (e: any) {
    return { ok: false, reason: e?.message };
  }
}
