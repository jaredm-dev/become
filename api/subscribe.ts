import type { VercelRequest, VercelResponse } from '@vercel/node';
import { putSub, delSub, type Sub } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = req.body as Partial<Sub>;
    if (!body?.id || !body.subscription) {
      return res.status(400).json({ error: 'id + subscription required' });
    }
    const sub: Sub = {
      id: String(body.id),
      subscription: body.subscription,
      reminderHour: Math.max(0, Math.min(23, Number(body.reminderHour ?? 8))),
      timezone: String(body.timezone || 'UTC'),
      experience: String(body.experience || 'beginner'),
      programStartDate: String(body.programStartDate || new Date().toISOString()),
      name: String(body.name || 'Athlete'),
      program: Array.isArray((body as any).program) ? (body as any).program : undefined,
    };
    await putSub(sub);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const id = (req.query.id as string) || (req.body && (req.body as any).id);
    if (!id) return res.status(400).json({ error: 'id required' });
    await delSub(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
