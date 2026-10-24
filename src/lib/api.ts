export class ApiError extends Error {
  constructor(
    public kind: 'network' | 'http',
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/** fetch wrapper that separates "no network" from "server said no". */
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12000);
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: { 'content-type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : opts.method && opts.method !== 'GET' ? '{}' : undefined,
      credentials: 'same-origin',
      signal: ctrl.signal
    });
  } catch {
    throw new ApiError('network', 0, 'network', 'No connection to the server.');
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError('http', res.status, data.error ?? 'error', data.message ?? `Request failed (${res.status})`);
  return data as T;
}
