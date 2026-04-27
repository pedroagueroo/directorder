'use client'
import { useOrders } from '@/lib/hooks/useOrders'
import KDSBoard from '@/components/staff/KDSBoard'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StaffPage() {
  const [restaurantId, setRestaurantId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()
      if (data) setRestaurantId(data.restaurant_id)
    })
  }, [supabase])

  const { orders, loading, updateStatus } = useOrders(restaurantId)

  if (loading) return <div>Cargando cocina...</div>

  return <KDSBoard orders={orders} onUpdateStatus={updateStatus} />
}
