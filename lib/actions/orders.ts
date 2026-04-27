'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { CartItem } from '@/store/cart'

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
  const supabase = createServerSupabase()

  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0)

  let customerId: string | null = null
  if (input.customerPhone) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', input.restaurantId)
      .eq('phone', input.customerPhone)
      .single()

    if (existing) {
      customerId = existing.id
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          restaurant_id: input.restaurantId,
          name: input.customerName,
          phone: input.customerPhone,
        })
        .select('id')
        .single()
      customerId = newCustomer?.id ?? null
    }
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      restaurant_id: input.restaurantId,
      customer_id: customerId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      type: input.orderType,
      delivery_address: input.deliveryAddress,
      table_id: input.tableId,
      subtotal,
      total: subtotal,
      notes: input.notes,
      status: 'pending',
      source: 'web',
    })
    .select()
    .single()

  if (error || !order) throw new Error('Error creando pedido')

  await supabase.from('order_items').insert(
    input.items.map(i => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      product_price: i.price,
      quantity: i.quantity,
      notes: i.notes,
    }))
  )

  await supabase.from('analytics_events').insert({
    restaurant_id: input.restaurantId,
    event: 'order_placed',
    properties: { order_id: order.id, total: subtotal, type: input.orderType }
  })

  return { orderId: order.id, orderNumber: order.order_number }
}
