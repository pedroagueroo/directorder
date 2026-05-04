'use client'
import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Order } from '@/lib/types/database'
import OrderCard from './OrderCard'

function KDSColumnInner({ id, title, orders }: { id: string; title: string; orders: Order[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[min(100%,280px)] sm:min-w-[300px] max-w-[480px] rounded-3xl p-4 sm:p-5 flex flex-col shadow-inner border-2 transition-all duration-200 ${
        isOver ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/60 bg-muted/40'
      }`}
    >
      <div className="flex justify-between items-center mb-5 bg-card py-3.5 px-4 rounded-2xl shadow-sm border-2 border-border">
        <h2 className="font-black text-xl sm:text-2xl tracking-tight">{title}</h2>
        <span className="bg-foreground text-background px-3 py-1.5 rounded-full text-base font-black tabular-nums min-w-[2.5rem] text-center">
          {orders.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 pb-4 hide-scrollbar">
        {orders.map(order => (
           <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="m-auto text-center text-foreground/45 font-bold text-lg pb-10">Sin pedidos</div>
        )}
      </div>
    </div>
  )
}

export default memo(KDSColumnInner)
