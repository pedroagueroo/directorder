'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export async function setRestaurantOpenAction(isOpen: boolean) {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const supabase = createServerSupabase()
  const { data: updated, error } = await supabase
    .from('restaurants')
    .update({ is_open: isOpen })
    .eq('id', restaurantId)
    .select('slug, is_open')
    .single()

  if (error || !updated) return { error: 'No se pudo actualizar el estado del local' }

  revalidatePath('/admin/dashboard')
  if (updated.slug) revalidatePath(`/${updated.slug}`)
  return { ok: true, is_open: !!updated.is_open }
}
