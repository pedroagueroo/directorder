import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthRestaurantId } from '@/lib/server/auth-restaurant'
import { assertValidStatusTransition } from '@/lib/orders/status'
import type { Order } from '@/lib/types/database'

export async function GET() {
  try {
    const restaurantId = getAuthRestaurantId()
    if (!restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createServerSupabase()
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    return NextResponse.json(orders ?? [])
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

  const supabase = createServerSupabase()

  try {
    if (body.action === 'updateStatus' && body.orderId && body.status) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', body.orderId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      const transition = assertValidStatusTransition(
        order.status as Order['status'],
        body.status
      )
      if (!transition.ok) {
        return NextResponse.json({ error: transition.message }, { status: 400 })
      }

      const now = new Date().toISOString()
      const statusUpdates: Partial<Order> = { status: body.status }
      if (body.status === 'preparing') statusUpdates.accepted_at = now
      if (body.status === 'ready') statusUpdates.ready_at = now
      if (body.status === 'delivered') statusUpdates.delivered_at = now
      if (body.status === 'pending' && order.status === 'awaiting_payment') {
        statusUpdates.payment_confirmed_at = now
        statusUpdates.payment_received = true
      }

      const { error } = await supabase
        .from('orders')
        .update(statusUpdates as any)
        .eq('id', body.orderId)

      if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (body.action === 'markCashReceived' && body.orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', body.orderId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      if (order.payment_method !== 'cash' || order.payment_received) {
        return NextResponse.json({ error: 'No se pudo marcar el cobro' }, { status: 400 })
      }

      await supabase
        .from('orders')
        .update({ payment_received: true })
        .eq('id', body.orderId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Error procesando' }, { status: 500 })
  }
}
