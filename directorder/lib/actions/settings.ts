'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as db from '@/lib/db'

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

export async function updateRestaurantSettingsAction(formData: FormData) {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) return { error: 'Sesion invalida.' }

  const section = String(formData.get('section') ?? '').trim()
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
