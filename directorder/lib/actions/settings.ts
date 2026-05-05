'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as db from '@/lib/db'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

export async function updateRestaurantSettingsAction(formData: FormData) {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) return { error: 'Sesion invalida.' }

  const sectionRaw = String(formData.get('section') ?? '').trim()
  const section = sectionRaw.split(':')[0]
  const sectionPayload = sectionRaw.includes(':') ? sectionRaw.slice(sectionRaw.indexOf(':') + 1) : ''
  if (!section) return { error: 'Seccion de configuracion invalida.' }

  let updates: Record<string, unknown> = {}

  if (section === 'local') {
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const whatsapp = String(formData.get('whatsapp') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    if (!name) return { error: 'El nombre del local es obligatorio.' }

    updates = {
      name,
      description: description || null,
      whatsapp: whatsapp || null,
      address: address || null,
    }
  } else if (section === 'channels') {
    updates = {
      delivery_fee: Math.max(0, toNumber(formData.get('delivery_fee'), 0)),
      avg_prep_minutes: Math.max(1, Math.round(toNumber(formData.get('avg_prep_minutes'), 30))),
      delivery_enabled: formData.has('delivery_enabled'),
      pickup_enabled: formData.has('pickup_enabled'),
      table_mode_enabled: formData.has('table_mode_enabled'),
      kds_sound_new_order: formData.has('kds_sound_new_order'),
      kds_sound_status_change: formData.has('kds_sound_status_change'),
    }
  } else if (section === 'visual') {
    updates = {
      primary_color: String(formData.get('primary_color') ?? '').trim() || '#e85d04',
      secondary_color: String(formData.get('secondary_color') ?? '').trim() || '#f48c06',
    }
  } else if (section === 'branch_create') {
    const userId = cookies().get('auth-user-id')?.value
    if (!userId) return { error: 'Sesion invalida.' }
    const user = db.getUserById(userId)
    if (!user?.brand_id) return { error: 'No se encontró la marca de esta cuenta.' }
    if (user.role !== 'owner') return { error: 'Solo el dueño puede crear sucursales.' }
    const branchName = String(formData.get('branch_name') ?? '').trim()
    const branchAddress = String(formData.get('branch_address') ?? '').trim()
    const branchWhatsapp = String(formData.get('branch_whatsapp') ?? '').trim()
    const shareMenu = formData.get('branch_share_menu') === 'on'
    if (branchName.length < 2) return { error: 'El nombre de la sucursal es obligatorio.' }
    const source = shareMenu ? restaurantId : null
    db.createBranchForBrand(String(user.brand_id), {
      name: branchName,
      address: branchAddress || null,
      whatsapp: branchWhatsapp || null,
      shareMenuFromRestaurantId: source,
    })
    revalidatePath('/admin/settings')
    return { ok: true }
  } else if (section === 'branch_delete') {
    const userId = cookies().get('auth-user-id')?.value
    if (!userId) return { error: 'Sesion invalida.' }
    const user = db.getUserById(userId)
    if (!user?.brand_id) return { error: 'No se encontró la marca de esta cuenta.' }
    if (user.role !== 'owner') return { error: 'Solo el dueño puede eliminar sucursales.' }
    const branchId = sectionPayload || String(formData.get('branch_id') ?? '')
    const out = db.deleteBranchForBrand(String(user.brand_id), branchId)
    if (!out.ok) return { error: out.error || 'No se pudo eliminar la sucursal.' }
    if (branchId === restaurantId) {
      const remaining = db.getRestaurantsByBrandId(String(user.brand_id))
      if (remaining[0]?.id) {
        cookies().set('auth-active-branch-id', String(remaining[0].id), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        })
        cookies().set('auth-restaurant-id', String(remaining[0].id), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        })
      }
    }
    revalidatePath('/admin/settings')
    return { ok: true }
  } else {
    return { error: 'Seccion no reconocida.' }
  }

  const updated = db.updateRestaurant(restaurantId, updates)

  if (!updated) return { error: 'No se pudo guardar la configuracion.' }

  revalidatePath('/admin/settings')
  revalidatePath('/admin/dashboard')
  if (updated.slug) revalidatePath(`/${updated.slug}`)

  return { ok: true }
}
