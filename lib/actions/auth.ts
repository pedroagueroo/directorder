'use server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'

/** Helper: get restaurant_id from auth cookie */
function getRestaurantId() {
  return cookies().get('auth-restaurant-id')?.value ?? null
}

/** Helper: get user_id from auth cookie */
function getUserId() {
  return cookies().get('auth-user-id')?.value ?? null
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email y contraseña requeridos' }

  try {
    cookies().delete('auth-role')
    cookies().delete('auth-user-id')
    cookies().delete('auth-restaurant-id')

    const supabase = createServerSupabase()

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { error: 'Email o contraseña incorrectos.' }
    }

    // Get user profile from our users table
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (!user || !user.restaurant_id) {
      return { error: 'La cuenta está incompleta (sin local asociado). Contactá soporte.' }
    }

    const role = user.role || 'owner'

    cookies().set('auth-role', role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    cookies().set('auth-user-id', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    cookies().set('auth-restaurant-id', user.restaurant_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return { success: true, role }
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
}

export async function register(formData: FormData) {
  // Honeypot
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
  if (restaurantName.length < 2 || restaurantName.length > 80) return { error: 'Indicá el nombre del local (entre 2 y 80 caracteres).' }
  if (ownerName.length < 2 || ownerName.length > 80) return { error: 'Indicá tu nombre y apellido (entre 2 y 80 caracteres).' }

  const waDigits = whatsappRaw.replace(/\D/g, '')
  if (whatsappRaw && waDigits.length < 8) return { error: 'El WhatsApp parece incompleto.' }

  const supabase = createServerSupabase()

  // 1. Create auth user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: ownerName }
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'No se pudo crear la cuenta.' }

  // 2. Generate slug
  const slug = restaurantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'mi-local'

  // Check if slug exists
  const { data: existingSlug } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

  // 3. Create restaurant
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .insert({
      slug: finalSlug,
      name: restaurantName,
      description: `Pedidos y menú de ${restaurantName} — DirectOrder.`,
      whatsapp: waDigits || null,
    })
    .select()
    .single()

  if (restError || !restaurant) return { error: 'No se pudo crear el restaurante.' }

  // 4. Create user profile
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      restaurant_id: restaurant.id,
      email,
      role: 'owner',
      full_name: ownerName,
    })

  if (userError) return { error: 'No se pudo crear el perfil de usuario.' }

  // 5. Create default categories
  const defaultCats = [
    { name: 'Hamburguesas', emoji: '🍔', sort_order: 0 },
    { name: 'Acompañamientos', emoji: '🍟', sort_order: 1 },
    { name: 'Bebidas', emoji: '🥤', sort_order: 2 },
    { name: 'Postres', emoji: '🍰', sort_order: 3 },
  ]
  await supabase.from('categories').insert(
    defaultCats.map(c => ({ ...c, restaurant_id: restaurant.id, is_active: true }))
  )

  // 6. Set auth cookies
  cookies().set('auth-role', 'owner', { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-user-id', authData.user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-restaurant-id', restaurant.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })

  return { success: true, role: 'owner' }
}
