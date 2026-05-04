import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import SettingsClient from './SettingsClient'

export default function AdminSettingsPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  const restaurant = db.getRestaurantById(restaurantId)
  if (!restaurant) redirect('/login')

  return <SettingsClient restaurant={restaurant} />
}
