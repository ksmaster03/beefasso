/**
 * Minimal fetch wrapper that sends cookies (for session) and parses JSON.
 * Throws `ApiError` on non-2xx so TanStack Query treats it as a failed query.
 */

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? (typeof body === 'object' && body && 'error' in body ? String((body as any).error) : `HTTP ${status}`));
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(path: string, init?: { method?: Method; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    credentials: 'include',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  });
  const text = await res.text();
  const json = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new ApiError(res.status, json);
  return json as T;
}
