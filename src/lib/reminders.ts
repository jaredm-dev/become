const KEY = 'godmode.reminderTime';

export function getReminderTime(): string | null {
  return localStorage.getItem(KEY);
}

export function setReminderTime(hhmm: string) {
  localStorage.setItem(KEY, hhmm);
  scheduleNext();
}

export function clearReminder() {
  localStorage.removeItem(KEY);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

let timeoutId: number | null = null;

export function scheduleNext() {
  if (timeoutId) clearTimeout(timeoutId);
  const time = getReminderTime();
  if (!time) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const ms = next.getTime() - now.getTime();
  // setTimeout max is ~24.8 days; daily is well under that.
  timeoutId = window.setTimeout(() => {
    fireNotification();
    scheduleNext();
  }, ms);
}

async function fireNotification() {
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'showReminder' });
    } else {
      new Notification('Daily Weigh-in', {
        body: 'Step on the scale and log your weight.',
        icon: '/icon.svg',
        tag: 'weigh-in',
      });
    }
  } catch {}
}

export function shouldShowInAppReminder(lastLogDate: string | null): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return lastLogDate !== today;
}
