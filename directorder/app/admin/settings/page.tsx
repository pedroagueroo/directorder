import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import SettingsClient from './SettingsClient'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export default function AdminSettingsPage() {
  const restaurantId = getAuthActiveBranchId()
  const userId = cookies().get('auth-user-id')?.value
  if (!restaurantId) redirect('/login')

  const restaurant = db.getRestaurantById(restaurantId)
  const user = userId ? db.getUserById(userId) : null
  if (!restaurant || !user?.brand_id) redirect('/login')
  const branches = db.getRestaurantsByBrandId(String(user.brand_id))

  return <SettingsClient restaurant={restaurant} branches={branches} isOwner={user.role === 'owner'} />
}
