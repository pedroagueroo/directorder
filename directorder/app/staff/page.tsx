import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import StaffClient from './StaffClient'
import * as db from '@/lib/db'

export default function StaffPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')
  const restaurant = db.getRestaurantById(restaurantId)

  return (
    <StaffClient
      restaurantId={restaurantId}
      newOrderSoundEnabled={restaurant?.kds_sound_new_order ?? true}
      statusSoundEnabled={restaurant?.kds_sound_status_change ?? true}
    />
  )
}
