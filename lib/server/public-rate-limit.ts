/**
 * Rate limit muy simple en memoria para acciones públicas (ej. crear pedido).
 * En serverless cada instancia tiene su propio contador; igual frena abuso básico.
 */
const buckets = new Map<string, number[]>()

export function assertPublicOrderRateLimit(ipKey: string, maxPerWindow = 5, windowMs = 60_000): void {
  const now = Date.now()
  const prev = buckets.get(ipKey) ?? []
  const fresh = prev.filter((t) => now - t < windowMs)
  if (fresh.length >= maxPerWindow) {
    throw new Error('Demasiados pedidos desde esta conexión. Esperá un minuto e intentá de nuevo.')
  }
  fresh.push(now)
  buckets.set(ipKey, fresh)
}
