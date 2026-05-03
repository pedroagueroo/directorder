'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as db from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/server/password'

const DEMO_RESTAURANT_IDS = new Set(['demo-id'])
const DEMO_SLUGS = new Set(['demo-burger'])

export async function updateProfileCredentialsAction(formData: FormData) {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesion invalida.' }

  const currentUser = db.getUserById(userId)
  if (!currentUser) return { error: 'Usuario no encontrado.' }

  const emailRaw = String(formData.get('email') ?? '').trim().toLowerCase()
  const currentPassword = String(formData.get('current_password') ?? '')
  const newPassword = String(formData.get('new_password') ?? '')
  const confirmNewPassword = String(formData.get('confirm_new_password') ?? '')
  const currentEmail = String(currentUser.email || '').trim().toLowerCase()
  const email = emailRaw || currentEmail

  if (!email) return { error: 'El email es obligatorio.' }
  if (db.isEmailTaken(email, userId)) return { error: 'Ese email ya esta en uso.' }

  const updates: Record<string, string> = {}
  if (email !== currentEmail) {
    updates.email = email
  }

  if (newPassword) {
    if (!currentPassword) {
      return { error: 'Para cambiar la contraseña, ingresá la contraseña actual.' }
    }
    if (!verifyPassword(currentPassword, String(currentUser.password ?? ''))) {
      return { error: 'La contraseña actual no coincide.' }
    }
    if (newPassword.length < 6) {
      return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    }
    if (newPassword !== confirmNewPassword) {
      return { error: 'La nueva contraseña y su confirmación no coinciden.' }
    }
    updates.password = hashPassword(newPassword)
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'No hay cambios para guardar.' }
  }

  const updated = db.updateUser(userId, updates)
  if (!updated) return { error: 'No se pudo guardar el perfil.' }

  revalidatePath('/admin/profile')
  return { ok: true, email: updated.email }
}

/**
 * Borra el local completo (menú, pedidos, usuarios del restaurante) y la sesión.
 * Verificación: contraseña actual + nombre del local (como en el perfil) + casilla de aceptación.
 */
export async function deleteAccountAction(formData: FormData) {
  if (String(formData.get('_delete_hp') ?? '').trim()) {
    return { error: 'No se pudo validar el envío. Probá de nuevo.' }
  }

  const userId = cookies().get('auth-user-id')?.value
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!userId || !restaurantId) return { error: 'Sesión inválida.' }

  const user = db.getUserById(userId)
  const restaurant = db.getRestaurantById(restaurantId)
  if (!user || !restaurant) return { error: 'No se encontró la cuenta.' }

  if (user.role !== 'owner') {
    return { error: 'Solo el dueño puede eliminar el local y todas las cuentas asociadas.' }
  }
  if (DEMO_RESTAURANT_IDS.has(restaurantId) || DEMO_SLUGS.has(String(restaurant.slug || ''))) {
    return { error: 'El restaurante de demostración no se puede eliminar.' }
  }

  const password = String(formData.get('delete_password') ?? '')
  const confirmName = String(formData.get('confirm_restaurant_name') ?? '')
  const accept = formData.get('delete_accept') === 'on' || formData.get('delete_accept') === 'true'

  if (!accept) {
    return { error: 'Marcá la casilla confirmando que entendés que el borrado es permanente.' }
  }
  if (!password) {
    return { error: 'Ingresá tu contraseña actual.' }
  }
  if (!verifyPassword(password, String(user.password ?? ''))) {
    return { error: 'La contraseña no coincide con la de tu cuenta.' }
  }

  const expected = db.normalizeComparableName(String(restaurant.name || ''))
  const got = db.normalizeComparableName(confirmName)
  if (!got || got !== expected) {
    return {
      error:
        'El nombre del local no coincide. Escribilo tal como aparece en el título de esta página (podés ignorar mayúsculas y espacios de más).',
    }
  }

  const ok = db.purgeRestaurantTenant(restaurantId)
  if (!ok) return { error: 'No se pudo completar la eliminación. Probá más tarde.' }

  cookies().delete('auth-role')
  cookies().delete('auth-user-id')
  cookies().delete('auth-restaurant-id')

  return { ok: true as const }
}
