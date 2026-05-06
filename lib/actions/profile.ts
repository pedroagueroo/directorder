'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

async function requireSessionUserId(supabase: ReturnType<typeof createServerSupabase>): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return { ok: false, error: 'Sesión inválida o expirada.' }
  }
  const cookieId = cookies().get('auth-user-id')?.value
  if (cookieId && cookieId !== user.id) {
    return { ok: false, error: 'Sesión inconsistente. Cerrá sesión y volvé a entrar.' }
  }
  return { ok: true, userId: user.id }
}

export async function updateProfileCredentialsAction(formData: FormData) {
  const supabase = createServerSupabase()
  const session = await requireSessionUserId(supabase)
  if (!session.ok) return { error: session.error }

  const userId = session.userId

  const { data: currentUser } = await supabase.from('users').select('*').eq('id', userId).single()

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

    await supabase.from('users').update({ email }).eq('id', userId)

    // Update in Supabase Auth (sesión JWT actual — no confiar solo en cookies)
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

  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) return { error: 'Sesión inválida.' }

  const supabase = createServerSupabase()
  const session = await requireSessionUserId(supabase)
  if (!session.ok) return { error: session.error }

  const userId = session.userId

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single()

  if (!restaurant) return { error: 'No se encontró la cuenta.' }

  const confirmName = String(formData.get('confirm_restaurant_name') ?? '').trim().toLowerCase()
  const expected = String(restaurant.name || '').trim().toLowerCase()
  const accept = formData.get('delete_accept') === 'on' || formData.get('delete_accept') === 'true'

  if (!accept) return { error: 'Marcá la casilla confirmando que entendés que el borrado es permanente.' }
  if (!confirmName || confirmName !== expected) {
    return { error: 'El nombre del local no coincide.' }
  }

  const brandId = restaurant.brand_id as string | null | undefined
  if (brandId) {
    const { error } = await supabase.from('restaurants').delete().eq('brand_id', brandId)
    if (error) return { error: error.message || 'No se pudo eliminar la cuenta.' }
  } else {
    const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId)
    if (error) return { error: error.message || 'No se pudo eliminar la cuenta.' }
  }

  await supabase.auth.signOut()

  cookies().delete('auth-role')
  cookies().delete('auth-user-id')
  cookies().delete('auth-restaurant-id')
  cookies().delete('auth-active-branch-id')

  return { ok: true as const }
}
