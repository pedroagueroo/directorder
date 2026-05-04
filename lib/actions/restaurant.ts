'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'

export async function setRestaurantOpenAction(isOpen: boolean) {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
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
