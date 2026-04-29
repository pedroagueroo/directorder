import type { Order } from '@/lib/types/database'

/** Transiciones permitidas (KDS permite saltar columnas: nuevo → listo, etc.). */
const FLOW: Record<Order['status'], Order['status'][]> = {
  pending: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'pending', 'cancelled'],
  ready: ['delivered', 'preparing', 'pending', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export function assertValidStatusTransition(
  from: Order['status'],
  to: Order['status']
): { ok: true } | { ok: false; message: string } {
  if (from === to) return { ok: true }
  const allowed = FLOW[from]
  if (!allowed.includes(to)) {
    return {
      ok: false,
      message: `Transición inválida: ${from} → ${to}`,
    }
  }
  return { ok: true }
}
