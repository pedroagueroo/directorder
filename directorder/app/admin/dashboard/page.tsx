import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import DashboardClient from './DashboardClient'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export default function DashboardPage() {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) redirect('/login')

  const restaurant = db.getRestaurantById(restaurantId)
  const menuSlug = restaurant?.slug ?? 'demo-burger'
  const restaurantOpen = restaurant?.is_open !== false
  const enableDemoData = menuSlug === 'demo-burger'

  return (
    <DashboardClient
      restaurantId={restaurantId}
      menuSlug={menuSlug}
      restaurantOpen={restaurantOpen}
      enableDemoData={enableDemoData}
    />
  )
}
