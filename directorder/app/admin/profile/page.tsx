import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import ProfileClient from './ProfileClient'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export default function AdminProfilePage() {
  const restaurantId = getAuthActiveBranchId()
  const userId = cookies().get('auth-user-id')?.value

  if (!restaurantId || !userId) redirect('/login')

  const restaurant = db.getRestaurantById(restaurantId)
  const user = db.getUserById(userId)
  if (!restaurant || !user) redirect('/login')

  const allowDelete =
    restaurant.id !== 'demo-id' && String(restaurant.slug || '') !== 'demo-burger'

  return (
    <ProfileClient
      restaurantName={String(restaurant.name || 'Mi Restaurante')}
      initialEmail={String(user.email || '')}
      allowDelete={allowDelete}
      isOwner={user.role === 'owner'}
    />
  )
}
