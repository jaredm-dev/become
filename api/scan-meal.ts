import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getBilling, isProActive } from './_lib/billing.js';

// Daily quota for free users (Pro = unlimited).
const FREE_DAILY_LIMIT = 1;

import { Redis } from '@upstash/redis';
let _redis: Redis | null = null;
function r(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

function todayKey(userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `mealscan:${userId}:${day}`;
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '8mb' },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const userId = String(body.userId || '').trim();
    const imageData = String(body.imageData || '').trim();    // raw base64, no data: prefix
    const mediaType = String(body.mediaType || 'image/jpeg');
    if (!userId || !imageData) return res.status(400).json({ error: 'userId + imageData required' });

    // Free tier rate limit
    const billing = await getBilling(userId);
    const pro = isProActive(billing);
    if (!pro) {
      const usedToday = Number((await r().get<number>(todayKey(userId))) || 0);
      if (usedToday >= FREE_DAILY_LIMIT) {
        return res.status(402).json({
          error: 'free_limit_reached',
          message: `Free tier is ${FREE_DAILY_LIMIT} meal scan per day. Upgrade to Pro for unlimited scans.`,
          usedToday,
          limit: FREE_DAILY_LIMIT,
        });
      }
    }

    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:
        'You are a precise nutrition analyst. Given a photo of food, estimate the visible portion macros. ' +
        'Always respond with ONLY valid JSON in this exact shape (no prose, no markdown fences):\n' +
        '{"name":"short name","confidence":"high|medium|low","calories":0,"proteinG":0,"carbsG":0,"fatG":0,"notes":"caveats"}',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as any, data: imageData },
            },
            {
              type: 'text',
              text:
                'Analyze this food photo. Estimate macros for what is visibly on the plate ' +
                '(the portion someone would eat). If multiple items, sum them. Respond with the JSON only.',
            },
          ],
        },
      ],
    });

    const text =
      result.content
        .map(c => (c.type === 'text' ? c.text : ''))
        .join('')
        .trim();

    // Strip code fences if Claude wrapped them
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'invalid_ai_response', raw: text.slice(0, 200) });
    }

    // Bump quota counter for free users
    if (!pro) {
      const key = todayKey(userId);
      const next = Number((await r().get<number>(key)) || 0) + 1;
      await r().set(key, next, { ex: 60 * 60 * 36 }); // 36h TTL
    }

    return res.status(200).json({
      name: String(parsed.name || 'Meal'),
      confidence: String(parsed.confidence || 'medium'),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      proteinG: Math.max(0, Math.round(Number(parsed.proteinG) || 0)),
      carbsG: Math.max(0, Math.round(Number(parsed.carbsG) || 0)),
      fatG: Math.max(0, Math.round(Number(parsed.fatG) || 0)),
      notes: String(parsed.notes || ''),
    });
  } catch (e: any) {
    console.error('scan-meal error', e);
    return res.status(500).json({ error: e?.message || 'scan failed' });
  }
}
