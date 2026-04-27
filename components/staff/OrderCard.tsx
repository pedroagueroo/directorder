'use client'
import { useDraggable } from '@dnd-kit/core'
import type { Order } from '@/lib/types/database'

export default function OrderCard({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // Simulating time (since it's a test data typically)
  const time = new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card p-5 rounded-2xl border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition-shadow ${
        isDragging ? 'opacity-70 scale-105 shadow-2xl z-50 ring-2 ring-primary rotate-2' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4 border-b border-border pb-3">
        <div>
          <span className="font-black text-2xl text-foreground">#{order.order_number}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              order.type === 'delivery' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
              order.type === 'pickup' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
              'bg-purple-500/10 text-purple-600 dark:text-purple-400'
            }`}>
              {order.type === 'delivery' ? '🛵 Delivery' : order.type === 'pickup' ? '🏪 Retiro' : `🪑 Mesa ${order.table_id || ''}`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg bg-muted px-2 py-1 rounded-lg">{time}</span>
          <p className="text-sm opacity-60 mt-2 truncate w-[90px] font-medium">{order.customer_name || 'Invitado'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[50px]">
        {order.order_items?.map((item, idx) => (
          <div key={idx} className="flex items-start text-[15px]">
            <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded mr-3 h-fit w-8 text-center">{item.quantity}</span>
            <span className="flex-1 font-semibold text-foreground/90 pt-0.5 leading-tight">{item.product_name}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 rounded-xl text-sm font-bold flex gap-2">
          <span>⚠️</span> <span>{order.notes}</span>
        </div>
      )}
    </div>
  )
}
