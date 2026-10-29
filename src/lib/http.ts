import type { WeatherError } from '@/features/weather/types';

export type HttpResult<T> = { ok: true; data: T } | { ok: false; error: WeatherError };

interface Options {
  timeoutMs?: number;
  retryDelayMs?: number;
}

async function once(url: string, timeoutMs: number): Promise<HttpResult<unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 429) return { ok: false, error: { kind: 'rate-limit' } };
    if (!res.ok) {
      let reason: string | undefined;
      try {
        const body = (await res.json()) as { reason?: unknown };
        if (typeof body.reason === 'string') reason = body.reason;
      } catch {
        /* тело не JSON */
      }
      return { ok: false, error: { kind: 'server', status: res.status, reason } };
    }
    try {
      return { ok: true, data: await res.json() };
    } catch {
      return { ok: false, error: { kind: 'invalid', issues: 'ответ не JSON' } };
    }
  } catch {
    return { ok: false, error: { kind: 'offline' } };
  } finally {
    clearTimeout(timer);
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * GET JSON. Никогда не бросает. Один повтор для offline и 5xx; 429 не повторяется.
 */
export async function getJson(url: string, opts: Options = {}): Promise<HttpResult<unknown>> {
  const { timeoutMs = 10_000, retryDelayMs = 2_000 } = opts;
  const first = await once(url, timeoutMs);
  if (first.ok) return first;
  const retryable = first.error.kind === 'offline' || (first.error.kind === 'server' && first.error.status >= 500);
  if (!retryable) return first;
  await wait(retryDelayMs);
  return once(url, timeoutMs);
}
