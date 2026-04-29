'use client'
import { useOrders } from '@/lib/hooks/useOrders'
import KDSBoard from '@/components/staff/KDSBoard'

export default function StaffClient({ restaurantId }: { restaurantId: string }) {
  const { orders, loading, updateStatus } = useOrders(restaurantId)

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        Cargando cocina…
      </div>
    )
  }

  return <KDSBoard orders={orders} onUpdateStatus={updateStatus} />
}
