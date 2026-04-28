import { NextResponse } from 'next/server'
import * as db from '@/lib/db'

export async function GET() {
  try {
    const orders = db.getOrders('demo-id')
    return NextResponse.json(orders)
  } catch (e) {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  
  try {
    if (body.action === 'updateStatus') {
      const updated = db.updateOrderStatus(body.orderId, body.status)
      if (updated) return NextResponse.json({ success: true })
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Error procesando' }, { status: 500 })
  }
}
