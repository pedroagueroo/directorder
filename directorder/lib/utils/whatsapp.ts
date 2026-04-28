import type { CartItem } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'

type CheckoutData = {
  customerName: string
  orderType: 'delivery' | 'pickup' | 'table'
  address?: string
  tableNumber?: string
  notes?: string
}

export function generateWhatsAppMessage(
  restaurant: Restaurant,
  items: CartItem[],
  data: CheckoutData
): string {
  const typeEmoji = {
    delivery: '🛵 Delivery',
    pickup: '🏪 Retiro en local',
    table: '🪑 Mesa'
  }

  const itemLines = items
    .map(i => {
      let line = `  • ${i.quantity}x ${i.name} — ${formatCurrency(i.price * i.quantity, restaurant.currency)}`
      if (i.notes) line += `\n      _📝 ${i.notes}_`
      return line
    })
    .join('\n')

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const msg = [
    `🍽️ *NUEVO PEDIDO — ${restaurant.name}*`,
    '',
    `👤 *Cliente:* ${data.customerName}`,
    `📦 *Tipo:* ${typeEmoji[data.orderType]}`,
    data.address ? `📍 *Dirección:* ${data.address}` : null,
    data.tableNumber ? `🪑 *Mesa:* ${data.tableNumber}` : null,
    '',
    '*Detalle del pedido:*',
    itemLines,
    '',
    `💰 *Total: ${formatCurrency(total, restaurant.currency)}*`,
    data.notes ? `\n📝 *Notas:* ${data.notes}` : null,
    '',
    `_Pedido realizado desde directorder.app/${restaurant.slug}_`
  ].filter(Boolean).join('\n')

  return msg
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
