// Public VAPID key — also exposed via VITE_VAPID_PUBLIC_KEY env at build time.
const VAPID_PUBLIC =
  (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
  'BILwztrrqu-jC1_o5NJ5MEUkPVVBrVfIOQzTBKhe50KCDu8guFSgVAYV6RqIUaVxPIknUHUaGT25zRGJC6pgymk';

const ID_KEY = 'godmode.pushId';

function getId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function subscribePush(opts: {
  reminderHour: number;
  experience: string;
  programStartDate: string;
  name: string;
  program?: Array<{ name: string; focus: string; top: string[] }>;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPushSupported())) {
    return { ok: false, reason: 'Push not supported in this browser. On iPhone, "Add to Home Screen" first.' };
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'Notification permission denied' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = urlBase64ToUint8Array(VAPID_PUBLIC);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    });
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: getId(),
      subscription: sub.toJSON(),
      reminderHour: opts.reminderHour,
      timezone,
      experience: opts.experience,
      programStartDate: opts.programStartDate,
      name: opts.name,
      program: opts.program,
    }),
  });
  if (!res.ok) return { ok: false, reason: `Server returned ${res.status}` };
  return { ok: true };
}

export async function unsubscribePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch(`/api/subscribe?id=${encodeURIComponent(getId())}`, { method: 'DELETE' });
  } catch {}
}
