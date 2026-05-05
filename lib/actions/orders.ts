'use server'
import type { CartItem } from '@/store/cart'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMenuRestaurantIdFromRow } from '@/lib/server/branches'

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
  paymentMethod: 'cash' | 'other'
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = createServerSupabase()

  // Validate restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', input.restaurantId)
    .single()

  if (!restaurant) throw new Error('No se encontró el local.')
  if (!restaurant.is_open) throw new Error('El local está cerrado en este momento.')
  if (!input.items.length) throw new Error('El pedido no puede estar vacío.')

  // Validate order type against restaurant settings
  if (input.orderType === 'delivery' && !restaurant.delivery_enabled) {
    throw new Error('Este local no tiene delivery habilitado.')
  }
  if (input.orderType === 'pickup' && !restaurant.pickup_enabled) {
    throw new Error('Este local no tiene retiro en local habilitado.')
  }
  if (input.orderType === 'table' && !restaurant.table_mode_enabled) {
    throw new Error('Este local no tiene modo mesa habilitado.')
  }

  const menuRestaurantId = getMenuRestaurantIdFromRow(
    restaurant as { id: string; menu_source_restaurant_id?: string | null }
  )

  if (input.orderType === 'table') {
    const tableRef = (input.tableId ?? '').trim()
    if (!tableRef) throw new Error('Indicá el número o nombre de tu mesa.')
    if (tableRef.length > 80) throw new Error('El dato de mesa es demasiado largo.')
  }

  // Validate products against DB prices
  const productIds = input.items.map(i => i.productId)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', menuRestaurantId)
    .in('id', productIds)

  const productMap = new Map((products ?? []).map(p => [p.id, p]))

  const validatedItems = input.items.map((item) => {
    const product = productMap.get(item.productId)
    if (!product || product.is_active === false) {
      throw new Error(`El producto "${item.name}" ya no está activo en el menú.`)
    }
    if (item.quantity <= 0) {
      throw new Error(`Cantidad inválida para "${product.name}".`)
    }
    const unitPrice = Number(product.price)
    return {
      product_id: item.productId,
      product_name: product.name,
      product_price: unitPrice,
      quantity: item.quantity,
      notes: item.notes ?? null,
    }
  })

  const subtotal = validatedItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0)
  const deliveryFee = input.orderType === 'delivery' ? Number(restaurant.delivery_fee) || 0 : 0
  const total = subtotal + deliveryFee

  // Validate minimum order amount
  const minOrder = Number(restaurant.min_order_amount) || 0
  if (minOrder > 0 && total < minOrder) {
    throw new Error(`El pedido mínimo es de $${minOrder.toLocaleString('es-AR')}. Tu pedido es de $${total.toLocaleString('es-AR')}.`)
  }
  const isCash = input.paymentMethod === 'cash'

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: input.restaurantId,
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
      payment_method: input.paymentMethod,
      payment_received: false,
      status: isCash ? 'pending' : 'awaiting_payment',
    })
    .select()
    .single()

  if (orderError || !order) throw new Error('Error creando pedido')

  // Create order items
  await supabase.from('order_items').insert(
    validatedItems.map(i => ({ ...i, order_id: order.id }))
  )

  // Track analytics event
  await supabase.from('analytics_events').insert({
    restaurant_id: input.restaurantId,
    event: 'order_placed',
    properties: { order_id: order.id, total, type: input.orderType },
  })

  return { orderId: order.id, orderNumber: order.order_number }
}
