const USER_ID_KEY = 'become.userId';
const PRO_CACHE_KEY = 'become.proCache';

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export interface ProStatus {
  pro: boolean;
  status: string | null;
  plan: 'monthly' | 'yearly' | null;
  currentPeriodEnd: number | null;
  trialEnd: number | null;
  fetchedAt: number;
}

const EMPTY: ProStatus = {
  pro: false, status: null, plan: null,
  currentPeriodEnd: null, trialEnd: null, fetchedAt: 0,
};

export function getCachedProStatus(): ProStatus {
  try {
    const raw = localStorage.getItem(PRO_CACHE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw);
  } catch { return EMPTY; }
}

export async function refreshProStatus(): Promise<ProStatus> {
  try {
    const r = await fetch(`/api/me?userId=${encodeURIComponent(getUserId())}`);
    if (!r.ok) return getCachedProStatus();
    const data = await r.json();
    const status: ProStatus = {
      pro: !!data.pro,
      status: data.status,
      plan: data.plan,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEnd: data.trialEnd,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(PRO_CACHE_KEY, JSON.stringify(status));
    return status;
  } catch {
    return getCachedProStatus();
  }
}

export async function startCheckout(plan: 'monthly' | 'yearly'): Promise<{ ok: boolean; reason?: string }> {
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: getUserId(), plan }),
    });
    const data = await r.json();
    if (!r.ok || !data.url) return { ok: false, reason: data.error || 'Could not start checkout' };
    window.location.href = data.url;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message };
  }
}

export async function openCustomerPortal(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const r = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: getUserId() }),
    });
    const data = await r.json();
    if (!r.ok || !data.url) return { ok: false, reason: data.error || 'Could not open portal' };
    window.location.href = data.url;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message };
  }
}
