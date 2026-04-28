'use client'
import { useDroppable } from '@dnd-kit/core'
import type { Order } from '@/lib/types/database'
import OrderCard from './OrderCard'

export default function KDSColumn({ id, title, orders }: { id: string, title: string, orders: Order[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] max-w-[450px] rounded-3xl p-5 flex flex-col shadow-inner border transition-all duration-300 ${
        isOver ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/60 bg-muted/40'
      }`}
    >
      <div className="flex justify-between items-center mb-5 bg-card py-3 px-4 rounded-2xl shadow-sm border border-border">
        <h2 className="font-extrabold text-lg">{title}</h2>
        <span className="bg-muted text-foreground px-3 py-1 rounded-full text-sm font-black border border-border">
          {orders.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 pb-4 hide-scrollbar">
        {orders.map(order => (
           <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="m-auto text-center opacity-40 font-medium pb-10">
            Sin pedidos
          </div>
        )}
      </div>
    </div>
  )
}
