import { NextResponse } from 'next/server'
import * as db from '@/lib/db'
import { getAuthRestaurantId } from '@/lib/server/auth-restaurant'
import { assertValidStatusTransition } from '@/lib/orders/status'
import type { Order } from '@/lib/types/database'

export async function GET() {
  try {
    const restaurantId = getAuthRestaurantId()
    if (!restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const orders = db.getOrders(restaurantId)
    return NextResponse.json(orders)
  } catch (e) {
    return NextResponse.json({ error: 'Error al cargar pedidos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const restaurantId = getAuthRestaurantId()
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { action?: string; orderId?: string; status?: Order['status'] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  try {
    if (body.action === 'updateStatus' && body.orderId && body.status) {
      const order = db.getOrderById(body.orderId)
      if (!order || order.restaurant_id !== restaurantId) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      const transition = assertValidStatusTransition(
        order.status as Order['status'],
        body.status
      )
      if (!transition.ok) {
        return NextResponse.json({ error: transition.message }, { status: 400 })
      }

      const updated = db.updateOrderStatus(body.orderId, body.status)
      if (updated) return NextResponse.json({ success: true })
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (body.action === 'markCashReceived' && body.orderId) {
      const order = db.getOrderById(body.orderId)
      if (!order || order.restaurant_id !== restaurantId) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }
      const updated = db.markOrderCashReceived(restaurantId, body.orderId)
      if (updated) return NextResponse.json({ success: true })
      return NextResponse.json({ error: 'No se pudo marcar el cobro' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Error procesando' }, { status: 500 })
  }
}
