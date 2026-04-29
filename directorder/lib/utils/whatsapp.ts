import type { CartItem } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'

type CheckoutData = {
  customerName: string
  orderType: 'delivery' | 'pickup' | 'table'
  address?: string
  tableNumber?: string
  notes?: string
}

const SEP = '────────────────────'

export function generateWhatsAppMessage(
  restaurant: Restaurant,
  items: CartItem[],
  data: CheckoutData
): string {
  const orderTypeLine = {
    delivery: '🛵 Delivery a domicilio',
    pickup: '🏪 Retiro en el local',
    table: '🪑 Pedido en mesa'
  }

  const when = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date())

  const itemBlocks = items
    .map((i, idx) => {
      const lineTotal = formatCurrency(i.price * i.quantity, restaurant.currency)
      const unitHint =
        i.quantity > 1
          ? `\n   _${i.quantity} × ${formatCurrency(i.price, restaurant.currency)} c/u_`
          : ''
      let block = `${idx + 1}. *${i.quantity}×* ${i.name}${unitHint}\n   *${lineTotal}*`
      if (i.notes?.trim()) {
        block += `\n   _${i.notes.trim()}_`
      }
      return block
    })
    .join('\n\n')

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalStr = formatCurrency(total, restaurant.currency)

  const parts: (string | null)[] = [
    SEP,
    '*Nuevo pedido*',
    `*${restaurant.name}*`,
    SEP,
    '',
    '*Cliente*',
    data.customerName.trim(),
    '',
    '*Tipo de pedido*',
    orderTypeLine[data.orderType],
    data.address?.trim()
      ? ['', '*Dirección*', data.address.trim()].join('\n')
      : null,
    data.tableNumber?.trim()
      ? ['', '*Mesa*', data.tableNumber.trim()].join('\n')
      : null,
    '',
    SEP,
    `*Pedido* _(${items.length} ${items.length === 1 ? 'ítem' : 'ítems'})_`,
    '',
    itemBlocks,
    '',
    SEP,
    '*Total a pagar*',
    `*${totalStr}*`,
    SEP,
    data.notes?.trim() ? ['', '*Indicaciones*', data.notes.trim()].join('\n') : null,
    '',
    `_DirectOrder · ${restaurant.slug} · ${when}_`
  ]

  return parts.filter((x): x is string => x !== null && x !== undefined).join('\n')
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount)
}
