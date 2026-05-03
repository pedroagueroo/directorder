'use server'
import { randomUUID } from 'crypto'
import type { CartItem } from '@/store/cart'
import type { Product } from '@/lib/types/database'
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
  /** Efectivo: entra a cocina de inmediato pero queda pendiente de cobro en el panel. */
  paymentMethod: 'cash' | 'other'
}

export async function createOrder(input: CreateOrderInput) {
  const restaurant = db.getRestaurantById(input.restaurantId)
  if (!restaurant) {
    throw new Error('No se encontró el local.')
  }
  if (!restaurant.is_open) {
    throw new Error('El local está cerrado en este momento. No se pueden tomar pedidos.')
  }
  if (!input.items.length) {
    throw new Error('El pedido no puede estar vacio.')
  }

  const products = db.getAllProducts(input.restaurantId)
  const productMap = new Map<string, Product>(products.map((product: Product) => [product.id, product]))
  const validatedItems = input.items.map((item) => {
    const product = productMap.get(item.productId)
    if (!product || product.is_active === false) {
      throw new Error(`El producto "${item.name}" ya no esta activo en el menu.`)
    }
    if (item.quantity <= 0) {
      throw new Error(`Cantidad invalida para "${product.name}".`)
    }

    const unitPrice = Number(product.price)
    return {
      id: randomUUID(),
      product_id: item.productId,
      product_name: product.name,
      product_price: unitPrice,
      quantity: item.quantity,
      notes: item.notes ?? null,
      subtotal: unitPrice * item.quantity,
    }
  })

  const subtotal = validatedItems.reduce((sum, item) => sum + item.subtotal, 0)
  const deliveryFee =
    input.orderType === 'delivery' && restaurant?.delivery_enabled !== false
      ? Number(restaurant?.delivery_fee) || 0
      : 0
  const total = subtotal + deliveryFee

  const isCash = input.paymentMethod === 'cash'
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
    payment_method: input.paymentMethod,
    payment_received: false,
    payment_confirmed_at: null as string | null,
    /** Efectivo: cocina de inmediato, cobro pendiente en panel. Otro: espera confirmación antes de cocina. */
    status: (isCash ? 'pending' : 'awaiting_payment') as 'pending' | 'awaiting_payment',
    order_items: validatedItems,
  }

  const newOrder = db.createOrder(orderData)
  return { orderId: newOrder.id, orderNumber: newOrder.order_number }
}
