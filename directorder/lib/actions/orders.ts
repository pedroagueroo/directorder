'use server'
import { randomUUID } from 'crypto'
import type { CartItem } from '@/store/cart'
import * as db from '@/lib/db'

type CreateOrderInput = {
  restaurantId: string
  restaurantSlug: string
  customerName: string
  customerPhone?: string
  orderType: 'delivery' | 'pickup' | 'table'
  deliveryAddress?: string
  tableId?: string
  items: CartItem[]
  notes?: string
}

export async function createOrder(input: CreateOrderInput) {
  const restaurant = db.getRestaurantById(input.restaurantId)
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee =
    input.orderType === 'delivery' && restaurant?.delivery_enabled !== false
      ? Number(restaurant?.delivery_fee) || 0
      : 0
  const total = subtotal + deliveryFee

  const orderData = {
    restaurant_id: input.restaurantId,
    customer_id: null,
    customer_name: input.customerName,
    customer_phone: input.customerPhone ?? null,
    type: input.orderType,
    delivery_address: input.deliveryAddress ?? null,
    table_id: input.tableId ?? null,
    subtotal,
    delivery_fee: deliveryFee,
    discount: 0,
    total,
    notes: input.notes ?? null,
    source: 'web',
    estimated_ready_at: null,
    order_items: input.items.map((i) => ({
      id: randomUUID(),
      product_id: i.productId,
      product_name: i.name,
      product_price: i.price,
      quantity: i.quantity,
      notes: i.notes ?? null,
      subtotal: i.price * i.quantity,
    })),
  }

  const newOrder = db.createOrder(orderData)
  return { orderId: newOrder.id, orderNumber: newOrder.order_number }
}
