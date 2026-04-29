import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import StaffClient from './StaffClient'

export default function StaffPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  return <StaffClient restaurantId={restaurantId} />
}
