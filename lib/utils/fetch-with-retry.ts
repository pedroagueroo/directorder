/** Fetch con reintentos breves para fallos transitorios (red / 5xx). */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; retryStatuses?: number[]; baseDelayMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 2
  const retryStatuses = new Set(options?.retryStatuses ?? [408, 429, 500, 502, 503, 504])
  const baseDelayMs = options?.baseDelayMs ?? 350

  let last!: Response
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      last = await fetch(input, init)
      if (last.ok || !retryStatuses.has(last.status)) return last
    } catch {
      if (attempt === retries) throw new Error('Sin conexión. Probá de nuevo.')
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)))
    }
  }
  return last
}
