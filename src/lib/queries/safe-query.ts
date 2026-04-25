// Per-query timeout + error containment + structured logging.
// Used by dashboard SSR so a single slow/failed query never blocks the whole render.

const SLOW_QUERY_THRESHOLD_MS = 1500;
const DEFAULT_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Query timeout: ${label} (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const start = Date.now();
  try {
    const result = await withTimeout(fn(), timeoutMs, label);
    const elapsed = Date.now() - start;
    if (elapsed > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[dashboard] slow query "${label}": ${elapsed}ms`);
    }
    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[dashboard] query failed "${label}" after ${elapsed}ms:`, message);
    return fallback;
  }
}
