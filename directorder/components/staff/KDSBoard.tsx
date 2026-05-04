'use client'
import { DndContext, closestCorners, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import type { Order } from '@/lib/types/database'
import KDSColumn from './KDSColumn'

const COLUMNS = [
  { id: 'pending', title: 'Nuevos 🚨' },
  { id: 'preparing', title: 'Preparando 🍳' },
  { id: 'ready', title: 'Listos 🛍️' }
] as const

export default function KDSBoard({
  orders,
  onUpdateStatus,
  syncStatus,
  syncError,
  retryInMs,
  lastUpdatedAt,
  onRetry,
}: {
  orders: Order[]
  onUpdateStatus: (id: string, st: Order['status']) => void
  syncStatus: 'connected' | 'reconnecting' | 'error'
  syncError: string | null
  retryInMs: number
  lastUpdatedAt: Date | null
  onRetry: () => Promise<boolean>
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as Order['status']

    const order = orders.find(o => o.id === orderId)
    if (order && order.status !== newStatus) {
       onUpdateStatus(orderId, newStatus)
    }
  }

  const activeOrders = orders.filter(o => ['pending','preparing','ready'].includes(o.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const statusBadge =
    syncStatus === 'connected'
      ? 'Conectado'
      : syncStatus === 'reconnecting'
      ? 'Reconectando...'
      : 'Error de sincronización'

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background">
      <div className="px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:p-6 bg-card border-b-2 border-border shadow-sm z-10 flex flex-wrap gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <a href="/admin/dashboard" className="w-10 h-10 rounded-xl bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors text-xl font-bold">
            ←
          </a>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">Cocina · KDS</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border px-3 py-1 text-xs font-bold bg-background">
            {statusBadge}
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full font-bold shadow-sm text-base">
            Activos: {activeOrders.length}
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 pb-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-foreground/75">
        <span>
          Última actualización:{' '}
          <strong className="text-foreground tabular-nums">
            {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString('es-AR') : '—'}
          </strong>
        </span>
        {syncStatus !== 'connected' && retryInMs > 0 && (
          <span>Reintento en {Math.ceil(retryInMs / 1000)}s</span>
        )}
        {syncError && (
          <button
            type="button"
            onClick={() => {
              void onRetry()
            }}
            className="px-2 py-1 rounded border border-border bg-card hover:bg-muted"
          >
            Reintentar ahora
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:p-6 gap-4 sm:gap-6 hide-scrollbar bg-dots-pattern touch-pan-x">
          {COLUMNS.map(col => (
            <KDSColumn 
              key={col.id}
              id={col.id}
              title={col.title}
              orders={activeOrders.filter(o => o.status === col.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
