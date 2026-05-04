import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function AdminProfilePage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  const userId = cookies().get('auth-user-id')?.value
  if (!restaurantId || !userId) redirect('/login')

  const supabase = createServerSupabase()

  const [{ data: restaurant }, { data: user }] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
    supabase.from('users').select('*').eq('id', userId).single(),
  ])

  if (!restaurant || !user) redirect('/login')

  const allowDelete = restaurant.slug !== 'demo-burger'

  return (
    <ProfileClient
      restaurantName={String(restaurant.name || 'Mi Restaurante')}
      initialEmail={String(user.email || '')}
      allowDelete={allowDelete}
      isOwner={user.role === 'owner'}
    />
  )
}
