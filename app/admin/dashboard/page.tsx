import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  const supabase = createServerSupabase()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug, is_open')
    .eq('id', restaurantId)
    .single()

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
