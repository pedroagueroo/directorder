import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function AdminSettingsPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  const supabase = createServerSupabase()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single()

  if (!restaurant) redirect('/login')

  return <SettingsClient restaurant={restaurant as any} />
}
