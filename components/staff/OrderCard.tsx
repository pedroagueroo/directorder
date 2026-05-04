'use client'
import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Order } from '@/lib/types/database'

function minutesSince(iso: string): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 60_000))
}

function OrderCardInner({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const cashUnpaid = order.payment_method === 'cash' && order.payment_received !== true

  const waitMin = minutesSince(order.created_at)
  const urgency =
    order.status === 'pending'
      ? waitMin >= 20
        ? 'critical'
        : waitMin >= 12
          ? 'warn'
          : 'ok'
      : 'ok'

  const ringClass =
    urgency === 'critical'
      ? 'ring-2 ring-rose-500 border-rose-500/40'
      : urgency === 'warn'
        ? 'ring-2 ring-amber-500 border-amber-500/40'
        : 'border-border'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card p-5 sm:p-6 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-shadow min-h-[44px] touch-manipulation ${ringClass} ${
        isDragging ? 'opacity-80 scale-[1.02] shadow-2xl z-50 ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4 border-b border-border pb-3 gap-2">
        <div className="min-w-0">
          <span className="font-black text-3xl sm:text-4xl tabular-nums text-foreground tracking-tight">
            #{order.order_number}
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                order.type === 'delivery'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  : order.type === 'pickup'
                    ? 'bg-orange-500/15 text-orange-800 dark:text-orange-300'
                    : 'bg-purple-500/15 text-purple-800 dark:text-purple-300'
              }`}
            >
              {order.type === 'delivery' ? 'Delivery' : order.type === 'pickup' ? 'Retiro' : `Mesa ${order.table_id || ''}`}
            </span>
            {order.status === 'pending' && waitMin > 0 && (
              <span className="text-sm font-black tabular-nums px-2.5 py-1 rounded-lg bg-foreground/10 text-foreground">
                {waitMin} min
              </span>
            )}
            {cashUnpaid && (
              <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/35">
                Efectivo pendiente
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="font-black text-xl sm:text-2xl bg-muted px-3 py-1.5 rounded-xl tabular-nums">{time}</span>
          <p className="text-base sm:text-lg font-bold text-foreground/80 mt-2 max-w-[140px] sm:max-w-[180px] truncate ml-auto">
            {order.customer_name || 'Invitado'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 min-h-[50px]">
        {order.order_items?.map((item, idx) => (
          <div key={idx} className="flex items-start text-base sm:text-lg leading-snug">
            <span className="font-black text-primary bg-primary/12 px-2.5 py-1 rounded-lg mr-3 min-w-[2.25rem] text-center tabular-nums">
              {item.quantity}
            </span>
            <span className="flex-1 font-bold text-foreground pt-0.5">{item.product_name}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-4 p-3 sm:p-4 bg-amber-500/12 text-amber-950 dark:text-amber-100 border-2 border-amber-500/35 rounded-xl text-base font-bold flex gap-2">
          <span aria-hidden>⚠</span> <span>{order.notes}</span>
        </div>
      )}
    </div>
  )
}

export default memo(OrderCardInner)
