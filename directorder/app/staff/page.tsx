'use client'
import { useOrders } from '@/lib/hooks/useOrders'
import KDSBoard from '@/components/staff/KDSBoard'

export default function StaffPage() {
  const restaurantId = 'demo-id'
  const { orders, loading, updateStatus } = useOrders(restaurantId)

  if (loading) return <div>Cargando cocina...</div>

  return <KDSBoard orders={orders} onUpdateStatus={updateStatus} />
}
