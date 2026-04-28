'use server'
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
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0)
  
  const orderData = {
    restaurant_id: input.restaurantId,
    customer_id: null,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    type: input.orderType,
    delivery_address: input.deliveryAddress,
    table_id: input.tableId,
    subtotal,
    total: subtotal,
    notes: input.notes,
    source: 'web',
    order_items: input.items.map(i => ({
      id: `item-${Date.now()}-${Math.random()}`,
      product_id: i.productId,
      product_name: i.name,
      product_price: i.price,
      quantity: i.quantity,
      notes: i.notes,
      subtotal: i.price * i.quantity
    }))
  }

  const newOrder = db.createOrder(orderData)
  return { orderId: newOrder.id, orderNumber: newOrder.order_number }
}
