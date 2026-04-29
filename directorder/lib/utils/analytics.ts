/** Zona horaria por defecto para “hoy” en métricas (Argentina). */
export const DEFAULT_ANALYTICS_TIMEZONE = 'America/Argentina/Buenos_Aires'

type OrderLike = {
  status: string
  type?: string
  total?: number
  created_at?: string
  delivered_at?: string | null
  order_items?: Array<{ product_name?: string; quantity?: number }>
}

function dateKeyInTz(iso: string | undefined, timeZone: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function todayKey(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function hourInTimezone(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(iso))
  const h = parts.find((p) => p.type === 'hour')?.value
  return parseInt(h ?? '0', 10)
}

/**
 * Métricas del día calendario local (entregas que cerraron ese día).
 * Si falta `delivered_at`, usa `created_at` solo si el pedido está `delivered` (datos viejos).
 */
export function summarizeDailySales(
  orders: OrderLike[],
  timeZone: string = DEFAULT_ANALYTICS_TIMEZONE
) {
  const target = todayKey(timeZone)

  const deliveredToday = orders.filter((o) => {
    if (o.status !== 'delivered') return false
    const key =
      dateKeyInTz(o.delivered_at ?? undefined, timeZone) ??
      dateKeyInTz(o.created_at, timeZone)
    return key === target
  })

  const todaySales = deliveredToday.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const todayOrders = deliveredToday.length
  const avgTicket = todayOrders ? todaySales / todayOrders : 0

  const hourCounts: Record<number, number> = {}
  deliveredToday.forEach((o) => {
    const src = o.delivered_at || o.created_at
    if (!src) return
    const h = hourInTimezone(src, timeZone)
    hourCounts[h] = (hourCounts[h] || 0) + 1
  })
  let peakHour = '—'
  const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
  if (peakEntry) peakHour = `${peakEntry[0]}h`

  const orderMix = { delivery: 0, pickup: 0, table: 0 }
  deliveredToday.forEach((o) => {
    const t = o.type as keyof typeof orderMix
    if (t in orderMix) orderMix[t]++
  })

  const productCounts: Record<string, number> = {}
  orders.forEach((o) => {
    const key =
      dateKeyInTz(o.delivered_at ?? undefined, timeZone) ??
      dateKeyInTz(o.created_at, timeZone)
    if (key !== target || o.status !== 'delivered') return
    o.order_items?.forEach((i) => {
      const name = i.product_name || 'Sin nombre'
      productCounts[name] = (productCounts[name] || 0) + (i.quantity || 0)
    })
  })

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return {
    todaySales,
    todayOrders,
    avgTicket,
    peakHour,
    orderMix,
    topProducts,
  }
}
