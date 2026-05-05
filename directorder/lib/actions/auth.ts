'use server'
import { cookies } from 'next/headers'
import * as db from '@/lib/db'
import { hashPassword, isPasswordHashed } from '@/lib/server/password'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email y contraseña requeridos' }

  try {
    cookies().delete('auth-role')
    cookies().delete('auth-user-id')
    cookies().delete('auth-restaurant-id')
    cookies().delete('auth-active-branch-id')

    const user = db.authenticateUser(email, password)

    if (!user) return { error: 'No se pudo iniciar sesión: email o contraseña incorrectos.' }

    if (!isPasswordHashed(String(user.password ?? ''))) {
      try {
        db.updateUser(user.id, { password: hashPassword(password) })
      } catch {
        /* el login sigue válido; en el próximo intento se puede reintentar migrar */
      }
    }

    const role = String(user.role ?? 'owner')
    const userId = String(user.id ?? '')
    const defaultBranchId = String(user.restaurant_id ?? '')
    if (!userId || !defaultBranchId) {
      return { error: 'La cuenta está incompleta (sin local asociado). Contactá soporte.' }
    }

    const branches = db.getBranchesForUser(userId)
    if (branches.length === 0) {
      return { error: 'No hay sucursales asociadas a esta cuenta.' }
    }
    const activeBranchId = branches.some((b: any) => b.id === defaultBranchId)
      ? defaultBranchId
      : String(branches[0].id)

    cookies().set('auth-role', role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    cookies().set('auth-user-id', userId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    cookies().set('auth-restaurant-id', activeBranchId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    cookies().set('auth-active-branch-id', activeBranchId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return { success: true, role, needsBranchSelection: branches.length > 1 }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[login]', msg)
    return { error: `No se pudo iniciar sesión (${msg}). Probá de nuevo.` }
  }
}

export async function logout() {
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

  if (!terms) {
    return { error: 'Tenés que aceptar la declaración para crear la cuenta.' }
  }
  if (!email || !password || password.length < 6) {
    return { error: 'Email y contraseña (mínimo 6 caracteres) requeridos.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }
  if (restaurantName.length < 2 || restaurantName.length > 80) {
    return { error: 'Indicá el nombre del local (entre 2 y 80 caracteres).' }
  }
  if (ownerName.length < 2 || ownerName.length > 80) {
    return { error: 'Indicá tu nombre y apellido (entre 2 y 80 caracteres).' }
  }

  const waDigits = whatsappRaw.replace(/\D/g, '')
  if (whatsappRaw && waDigits.length < 8) {
    return { error: 'El WhatsApp parece incompleto (necesitamos al menos 8 dígitos) o dejalo vacío.' }
  }

  const result = db.registerUser(email, password, {
    restaurantName,
    ownerName,
    whatsapp: waDigits || '',
  })
  
  if (result.error) {
    return { error: result.error }
  }

  if (!result.user?.restaurant_id) {
    return { error: 'No se pudo crear la sesión del nuevo restaurante.' }
  }

  cookies().set('auth-role', result.user.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-user-id', result.user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-restaurant-id', result.user.restaurant_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-active-branch-id', result.user.restaurant_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })

  return { success: true, role: result.user.role }
}

export async function listMyBranches() {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesión inválida.' }
  const branches = db.getBranchesForUser(userId).map((b: any) => ({
    id: String(b.id),
    name: String(b.name || 'Sucursal'),
    slug: String(b.slug || ''),
    address: b.address ? String(b.address) : null,
  }))
  return { branches }
}

export async function setActiveBranch(branchId: string) {
  const userId = cookies().get('auth-user-id')?.value
  if (!userId) return { error: 'Sesión inválida.' }
  const branches = db.getBranchesForUser(userId)
  const target = branches.find((b: any) => b.id === branchId)
  if (!target) return { error: 'Sucursal inválida para esta cuenta.' }

  cookies().set('auth-restaurant-id', branchId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  cookies().set('auth-active-branch-id', branchId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return { ok: true }
}
