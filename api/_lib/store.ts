import { Redis } from '@upstash/redis';

export interface ProgramDay {
  name: string;
  focus: string;
  top: string[]; // top 3 exercises summarised
}

export interface Sub {
  id: string;
  subscription: any;
  reminderHour: number;     // 0-23, user local
  timezone: string;          // IANA
  experience: string;
  programStartDate: string;  // ISO date
  name: string;
  program?: ProgramDay[];    // 7-day, optional for backwards compat
}

let _redis: Redis | null = null;
function r(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

export async function putSub(s: Sub) {
  await r().set(`sub:${s.id}`, s);
  await r().sadd('subs', s.id);
}

export async function delSub(id: string) {
  await r().del(`sub:${id}`);
  await r().srem('subs', id);
}

export async function listSubs(): Promise<Sub[]> {
  const ids = (await r().smembers('subs')) as string[];
  if (ids.length === 0) return [];
  const pipe = r().pipeline();
  ids.forEach(id => pipe.get(`sub:${id}`));
  const results = await pipe.exec<Sub[]>();
  return results.filter(Boolean);
}

export function userLocalHour(tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const h = parts.find(p => p.type === 'hour')?.value ?? '0';
    return parseInt(h, 10) % 24;
  } catch {
    return new Date().getUTCHours();
  }
}
