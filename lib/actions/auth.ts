'use server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { getBranchesForUserId } from '@/lib/server/branches'

/** 7 días — sesión de panel; se renueva al iniciar sesión o cambiar sucursal. */
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function setSessionCookies(role: string, userId: string, branchId: string) {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  }
  cookies().set('auth-role', role, opts)
  cookies().set('auth-user-id', userId, opts)
  cookies().set('auth-restaurant-id', branchId, opts)
  cookies().set('auth-active-branch-id', branchId, opts)
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email y contraseña requeridos' }

  try {
    cookies().delete('auth-role')
    cookies().delete('auth-user-id')
    cookies().delete('auth-restaurant-id')
    cookies().delete('auth-active-branch-id')

    const supabase = createServerSupabase()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { error: 'Email o contraseña incorrectos.' }
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', authData.user.id).single()

    if (!user || !user.restaurant_id) {
      return { error: 'La cuenta está incompleta (sin local asociado). Contactá soporte.' }
    }

    const role = user.role || 'owner'
    const branches = await getBranchesForUserId(supabase, user.id)
    if (!branches.length) {
      return { error: 'No se encontraron sucursales para esta cuenta.' }
    }

    let activeBranchId = String(user.restaurant_id || '')
    if (!branches.some((b) => b.id === activeBranchId)) {
      activeBranchId = branches[0].id
    }

    setSessionCookies(role, user.id, activeBranchId)

    return { success: true, role, needsBranchSelection: branches.length > 1 }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[login]', msg)
    return { error: `No se pudo iniciar sesión (${msg}). Probá de nuevo.` }
  }
}

export async function logout() {
  const supabase = createServerSupabase()
  await supabase.auth.signOut()
  cookies().delete('auth-role')
  cookies().delete('auth-user-id')
  cookies().delete('auth-restaurant-id')
  cookies().delete('auth-active-branch-id')
}

export async function register(formData: FormData) {
  if (String(formData.get('_company_website') ?? '').trim()) {
    return { error: 'No se pudo validar el envío. Probá de nuevo.' }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')
  const restaurantName = String(formData.get('restaurant_name') ?? '').trim()
  const ownerName = String(formData.get('owner_name') ?? '').trim()
  const whatsappRaw = String(formData.get('whatsapp') ?? '').trim()
  const terms = formData.get('terms') === 'on' || formData.get('terms') === 'true'

  if (!terms) return { error: 'Tenés que aceptar la declaración para crear la cuenta.' }
  if (!email || !password || password.length < 6) return { error: 'Email y contraseña (mínimo 6 caracteres) requeridos.' }
  if (password !== confirmPassword) return { error: 'Las contraseñas no coinciden.' }
  if (restaurantName.length < 2 || restaurantName.length > 80)
    return { error: 'Indicá el nombre del local (entre 2 y 80 caracteres).' }
  if (ownerName.length < 2 || ownerName.length > 80)
    return { error: 'Indicá tu nombre y apellido (entre 2 y 80 caracteres).' }

  const waDigits = whatsappRaw.replace(/\D/g, '')
  if (whatsappRaw && waDigits.length < 8) return { error: 'El WhatsApp parece incompleto.' }

  const supabase = createServerSupabase()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: ownerName },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'No se pudo crear la cuenta.' }

  const slugBase =
    restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'mi-local'

  const { data: existingSlug } = await supabase.from('restaurants').select('id').eq('slug', slugBase).maybeSingle()

  const finalSlug = existingSlug ? `${slugBase}-${Date.now().toString(36)}` : slugBase
  const brandId = randomUUID()

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .insert({
      slug: finalSlug,
      name: restaurantName,
      description: `Pedidos y menú de ${restaurantName} — DirectOrder.`,
      whatsapp: waDigits || null,
      brand_id: brandId,
      is_branch: true,
      menu_source_restaurant_id: null,
    })
    .select()
    .single()

  if (restError || !restaurant) return { error: 'No se pudo crear el restaurante.' }

  await supabase
    .from('restaurants')
    .update({ menu_source_restaurant_id: restaurant.id })
    .eq('id', restaurant.id)

  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    restaurant_id: restaurant.id,
    brand_id: brandId,
    email,
    role: 'owner',
    full_name: ownerName,
  })

  if (userError) return { error: 'No se pudo crear el perfil de usuario.' }

  const defaultCats = [
    { name: 'Hamburguesas', emoji: '🍔', sort_order: 0 },
    { name: 'Acompañamientos', emoji: '🍟', sort_order: 1 },
    { name: 'Bebidas', emoji: '🥤', sort_order: 2 },
    { name: 'Postres', emoji: '🍰', sort_order: 3 },
  ]
  await supabase.from('categories').insert(
    defaultCats.map((c) => ({ ...c, restaurant_id: restaurant.id, is_active: true }))
  )

  setSessionCookies('owner', authData.user.id, restaurant.id)

  return { success: true, role: 'owner' as const, needsBranchSelection: false }
}

export async function listMyBranches() {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesión inválida.' }

  const supabase = createServerSupabase()
  const branches = await getBranchesForUserId(supabase, userId)

  return {
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      address: b.address ?? null,
    })),
  }
}

export async function setActiveBranch(branchId: string) {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesión inválida.' }

  const supabase = createServerSupabase()
  const branches = await getBranchesForUserId(supabase, userId)
  if (!branches.some((b) => b.id === branchId)) return { error: 'Sucursal inválida.' }

  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
  const role = user?.role || 'owner'

  setSessionCookies(role, userId, branchId)
  return { ok: true as const }
}
