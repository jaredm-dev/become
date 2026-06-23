import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { listSubs, delSub, userLocalHour } from './_lib/store.js';
import { todayFor } from './_lib/workouts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional cron auth — Vercel sets this header on scheduled runs
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] !== undefined;
  if (expected && !isVercelCron && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const vapidPub = process.env.VAPID_PUBLIC_KEY;
  const vapidPriv = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:reminders@godmode.app';
  if (!vapidPub || !vapidPriv) {
    return res.status(500).json({ error: 'VAPID env vars missing' });
  }
  webpush.setVapidDetails(vapidSubject, vapidPub, vapidPriv);

  const subs = await listSubs();
  const force = req.query.force === '1';
  const results: Array<{ id: string; sent: boolean; reason?: string }> = [];

  for (const s of subs) {
    const localHour = userLocalHour(s.timezone);
    if (!force && localHour !== s.reminderHour) {
      results.push({ id: s.id, sent: false, reason: `localHour=${localHour} want=${s.reminderHour}` });
      continue;
    }
    let day;
    if (s.program && s.program.length === 7) {
      const start = new Date(s.programStartDate).getTime();
      const idx = Math.floor((Date.now() - start) / 86_400_000) % 7;
      const i = ((idx % 7) + 7) % 7;
      day = s.program[i];
    } else {
      day = todayFor(s.experience, s.programStartDate);
    }
    const payload = JSON.stringify({
      title: day.name,
      body: `${day.focus}\n• ${day.top.slice(0, 3).join('\n• ')}`,
      url: '/',
    });
    try {
      await webpush.sendNotification(s.subscription, payload, { TTL: 60 * 60 * 12 });
      results.push({ id: s.id, sent: true });
    } catch (err: any) {
      const code = err?.statusCode;
      if (code === 404 || code === 410) {
        // Subscription is gone, clean up
        await delSub(s.id);
        results.push({ id: s.id, sent: false, reason: `expired (${code}), removed` });
      } else {
        results.push({ id: s.id, sent: false, reason: `error ${code || ''} ${err?.message || ''}` });
      }
    }
  }

  return res.status(200).json({ ran: new Date().toISOString(), results });
}
