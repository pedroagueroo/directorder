'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

function normalizeSlugPart(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'sucursal'
  )
}

export async function updateRestaurantSettingsAction(formData: FormData) {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) return { error: 'Sesion invalida.' }

  const sectionRaw = String(formData.get('section') ?? '').trim()
  const section = sectionRaw.split(':')[0]
  const sectionPayload = sectionRaw.includes(':') ? sectionRaw.slice(sectionRaw.indexOf(':') + 1) : ''
  if (!section) return { error: 'Seccion de configuracion invalida.' }

  const supabase = createServerSupabase()
  let updates: Record<string, unknown> = {}

  if (section === 'local') {
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const whatsapp = String(formData.get('whatsapp') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    if (!name) return { error: 'El nombre del local es obligatorio.' }
    updates = { name, description: description || null, whatsapp: whatsapp || null, address: address || null }
  } else if (section === 'channels') {
    const geocodeSuffix = String(formData.get('delivery_geocode_suffix') ?? '').trim()
    updates = {
      delivery_fee: Math.max(0, toNumber(formData.get('delivery_fee'), 0)),
      avg_prep_minutes: Math.max(1, Math.round(toNumber(formData.get('avg_prep_minutes'), 30))),
      delivery_enabled: formData.has('delivery_enabled'),
      pickup_enabled: formData.has('pickup_enabled'),
      table_mode_enabled: formData.has('table_mode_enabled'),
      kds_sound_new_order: formData.has('kds_sound_new_order'),
      kds_sound_status_change: formData.has('kds_sound_status_change'),
      delivery_geocode_suffix: geocodeSuffix ? geocodeSuffix.slice(0, 200) : null,
    }
  } else if (section === 'visual') {
    updates = {
      primary_color: String(formData.get('primary_color') ?? '').trim() || '#e85d04',
      secondary_color: String(formData.get('secondary_color') ?? '').trim() || '#f48c06',
    }
  } else if (section === 'branch_create') {
    const userId = cookies().get('auth-user-id')?.value
    if (!userId) return { error: 'Sesion invalida.' }
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!user?.brand_id) return { error: 'No se encontró la marca de esta cuenta.' }
    if (user.role !== 'owner') return { error: 'Solo el dueño puede crear sucursales.' }

    const branchName = String(formData.get('branch_name') ?? '').trim()
    const branchAddress = String(formData.get('branch_address') ?? '').trim()
    const branchWhatsapp = String(formData.get('branch_whatsapp') ?? '').trim()
    const shareMenu = formData.get('branch_share_menu') === 'on'
    if (branchName.length < 2) return { error: 'El nombre de la sucursal es obligatorio.' }

    const waDigits = branchWhatsapp.replace(/\D/g, '')

    let baseSlug = normalizeSlugPart(branchName)
    let slug = baseSlug
    let n = 2
    while (true) {
      const { data: taken } = await supabase.from('restaurants').select('id').eq('slug', slug).maybeSingle()
      if (!taken) break
      slug = `${baseSlug}-${n}`
      n += 1
    }

    const { data: current } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single()
    const menuSrc = shareMenu ? restaurantId : null

    const { data: newBranch, error: insErr } = await supabase
      .from('restaurants')
      .insert({
        slug,
        name: branchName,
        description: current?.description ?? null,
        whatsapp: waDigits || null,
        address: branchAddress || null,
        primary_color: current?.primary_color ?? '#e85d04',
        secondary_color: current?.secondary_color ?? '#f48c06',
        currency: current?.currency ?? 'ARS',
        delivery_enabled: current?.delivery_enabled ?? true,
        pickup_enabled: current?.pickup_enabled ?? true,
        table_mode_enabled: current?.table_mode_enabled ?? false,
        delivery_fee: current?.delivery_fee ?? 0,
        avg_prep_minutes: current?.avg_prep_minutes ?? 20,
        delivery_geocode_suffix: (current as { delivery_geocode_suffix?: string | null })?.delivery_geocode_suffix ?? null,
        brand_id: user.brand_id,
        is_branch: true,
        menu_source_restaurant_id: null,
      })
      .select()
      .single()

    if (insErr || !newBranch) return { error: 'No se pudo crear la sucursal.' }

    const resolvedMenu = shareMenu ? restaurantId : newBranch.id
    await supabase.from('restaurants').update({ menu_source_restaurant_id: resolvedMenu }).eq('id', newBranch.id)

    revalidatePath('/admin/settings')
    return { ok: true }
  } else if (section === 'branch_delete') {
    const userId = cookies().get('auth-user-id')?.value
    if (!userId) return { error: 'Sesion invalida.' }
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!user?.brand_id) return { error: 'No se encontró la marca de esta cuenta.' }
    if (user.role !== 'owner') return { error: 'Solo el dueño puede eliminar sucursales.' }

    const branchId = sectionPayload || String(formData.get('branch_id') ?? '')
    if (!branchId) return { error: 'Sucursal inválida.' }

    const { data: siblings } = await supabase.from('restaurants').select('id').eq('brand_id', user.brand_id)
    if (!siblings || siblings.length < 2) {
      return { error: 'No podés eliminar la última sucursal de la marca.' }
    }

    const fallback = siblings.map((s) => s.id).find((id) => id !== branchId)
    if (!fallback) return { error: 'No se pudo resolver otra sucursal.' }

    await supabase.from('users').update({ restaurant_id: fallback }).eq('restaurant_id', branchId)

    const { error: delErr } = await supabase.from('restaurants').delete().eq('id', branchId).eq('brand_id', user.brand_id)

    if (delErr) {
      return { error: delErr.message || 'No se pudo eliminar la sucursal (¿hay pedidos u otros datos vinculados?).' }
    }

    if (branchId === restaurantId) {
      const cOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      }
      cookies().set('auth-active-branch-id', fallback, cOpts)
      cookies().set('auth-restaurant-id', fallback, cOpts)
    }

    revalidatePath('/admin/settings')
    return { ok: true }
  } else {
    return { error: 'Seccion no reconocida.' }
  }

  const { data: updated, error } = await supabase
    .from('restaurants')
    .update(updates as any)
    .eq('id', restaurantId)
    .select('slug')
    .single()

  if (error || !updated) return { error: 'No se pudo guardar la configuracion.' }

  revalidatePath('/admin/settings')
  revalidatePath('/admin/dashboard')
  if (updated.slug) revalidatePath(`/${updated.slug}`)

  return { ok: true }
}
