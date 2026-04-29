'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as db from '@/lib/db'

export async function setRestaurantOpenAction(isOpen: boolean) {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) return { error: 'Sesión inválida' }

  const updated = db.updateRestaurant(restaurantId, { is_open: isOpen })
  if (!updated) return { error: 'No se pudo actualizar el estado del local' }

  revalidatePath('/admin/dashboard')
  if (updated.slug) revalidatePath(`/${updated.slug}`)
  return { ok: true, is_open: !!updated.is_open }
}
