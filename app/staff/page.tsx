import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import StaffClient from './StaffClient'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export default async function StaffPage() {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) redirect('/login')

  const supabase = createServerSupabase()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('kds_sound_new_order, kds_sound_status_change')
    .eq('id', restaurantId)
    .single()

  return (
    <StaffClient
      restaurantId={restaurantId}
      newOrderSoundEnabled={restaurant?.kds_sound_new_order ?? true}
      statusSoundEnabled={restaurant?.kds_sound_status_change ?? true}
    />
  )
}
