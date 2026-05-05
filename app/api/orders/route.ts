import { NextResponse } from 'next/server'
import { requireStaffApiAuth } from '@/lib/server/require-staff-api'
import { assertValidStatusTransition } from '@/lib/orders/status'
import type { Order } from '@/lib/types/database'

export async function GET(req: Request) {
  try {
    const auth = await requireStaffApiAuth()
    if (!auth.ok) return auth.response

    const { supabase, restaurantId } = auth.auth
    const url = new URL(req.url)
    const qId = url.searchParams.get('restaurantId')
    if (qId && qId !== restaurantId) {
      return NextResponse.json({ error: 'Sucursal no coincide con la sesión' }, { status: 403 })
    }

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
  const auth = await requireStaffApiAuth()
  if (!auth.ok) return auth.response

  const { supabase, restaurantId } = auth.auth

  let body: { action?: string; orderId?: string; status?: Order['status'] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

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
