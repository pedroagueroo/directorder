'use client'
import { useOrders } from '@/lib/hooks/useOrders'
import KDSBoard from '@/components/staff/KDSBoard'

export default function StaffClient({
  restaurantId,
  newOrderSoundEnabled,
  statusSoundEnabled,
  backHref,
}: {
  restaurantId: string
  newOrderSoundEnabled: boolean
  statusSoundEnabled: boolean
  backHref: string | null
}) {
  const { orders, loading, error, syncStatus, lastUpdatedAt, retryInMs, updateStatus, refetch } =
    useOrders(restaurantId, { newOrderSoundEnabled, statusSoundEnabled })

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        Cargando cocina…
      </div>
    )
  }

  return (
    <KDSBoard
      orders={orders}
      onUpdateStatus={updateStatus}
      syncStatus={syncStatus}
      syncError={error}
      retryInMs={retryInMs}
      lastUpdatedAt={lastUpdatedAt}
      onRetry={refetch}
      backHref={backHref}
    />
  )
}
