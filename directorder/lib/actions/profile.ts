'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as db from '@/lib/db'

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
    if (currentPassword !== currentUser.password) {
      return { error: 'La contraseña actual no coincide.' }
    }
    if (newPassword.length < 6) {
      return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    }
    if (newPassword !== confirmNewPassword) {
      return { error: 'La nueva contraseña y su confirmación no coinciden.' }
    }
    updates.password = newPassword
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'No hay cambios para guardar.' }
  }

  const updated = db.updateUser(userId, updates)
  if (!updated) return { error: 'No se pudo guardar el perfil.' }

  revalidatePath('/admin/profile')
  return { ok: true, email: updated.email }
}
