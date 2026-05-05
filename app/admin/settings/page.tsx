import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'
import { getBranchesForUserId } from '@/lib/server/branches'

export default async function AdminSettingsPage() {
  const restaurantId = getAuthActiveBranchId()
  const userId = cookies().get('auth-user-id')?.value
  if (!restaurantId || !userId) redirect('/login')

  const supabase = createServerSupabase()

  const [{ data: restaurant }, { data: user }, branches] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
    supabase.from('users').select('role').eq('id', userId).single(),
    getBranchesForUserId(supabase, userId),
  ])

  if (!restaurant) redirect('/login')

  return (
    <SettingsClient
      restaurant={restaurant as any}
      branches={branches as any}
      isOwner={user?.role === 'owner'}
    />
  )
}
