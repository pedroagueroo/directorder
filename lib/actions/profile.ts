'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'

export async function updateProfileCredentialsAction(formData: FormData) {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesion invalida.' }

  const supabase = createServerSupabase()

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!currentUser) return { error: 'Usuario no encontrado.' }

  const emailRaw = String(formData.get('email') ?? '').trim().toLowerCase()
  const newPassword = String(formData.get('new_password') ?? '')
  const confirmNewPassword = String(formData.get('confirm_new_password') ?? '')
  const currentEmail = String(currentUser.email || '').trim().toLowerCase()
  const email = emailRaw || currentEmail

  if (!email) return { error: 'El email es obligatorio.' }

  // Update email in users table
  if (email !== currentEmail) {
    // Check if email is taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .single()

    if (existing) return { error: 'Ese email ya esta en uso.' }

    await supabase
      .from('users')
      .update({ email })
      .eq('id', userId)

    // Update in Supabase Auth
    await supabase.auth.updateUser({ email })
  }

  // Update password via Supabase Auth
  if (newPassword) {
    if (newPassword.length < 6) return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    if (newPassword !== confirmNewPassword) return { error: 'La nueva contraseña y su confirmación no coinciden.' }

    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
    if (pwError) return { error: 'No se pudo cambiar la contraseña: ' + pwError.message }
  }

  revalidatePath('/admin/profile')
  return { ok: true, email }
}

export async function deleteAccountAction(formData: FormData) {
  if (String(formData.get('_delete_hp') ?? '').trim()) {
    return { error: 'No se pudo validar el envío. Probá de nuevo.' }
  }

  const userId = cookies().get('auth-user-id')?.value
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!userId || !restaurantId) return { error: 'Sesión inválida.' }

  const supabase = createServerSupabase()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single()

  if (!restaurant) return { error: 'No se encontró la cuenta.' }

  const confirmName = String(formData.get('confirm_restaurant_name') ?? '').trim().toLowerCase()
  const expected = String(restaurant.name || '').trim().toLowerCase()
  const accept = formData.get('delete_accept') === 'on' || formData.get('delete_accept') === 'true'

  if (!accept) return { error: 'Marcá la casilla confirmando que entendés que el borrado es permanente.' }
  if (!confirmName || confirmName !== expected) {
    return { error: 'El nombre del local no coincide.' }
  }

  // Delete restaurant (cascades to categories, products, orders, etc.)
  await supabase.from('restaurants').delete().eq('id', restaurantId)

  // Clear cookies
  cookies().delete('auth-role')
  cookies().delete('auth-user-id')
  cookies().delete('auth-restaurant-id')

  return { ok: true as const }
}
