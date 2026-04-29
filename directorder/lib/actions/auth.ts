'use server'
import { cookies } from 'next/headers'
import * as db from '@/lib/db'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email y contraseña requeridos' }

  const user = db.authenticateUser(email, password)
  
  if (!user) return { error: 'No se pudo iniciar sesión: email o contraseña incorrectos.' }

  // Set mock auth cookies
  cookies().set('auth-role', user.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-user-id', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookies().set('auth-restaurant-id', user.restaurant_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })

  return { success: true, role: user.role }
}

export async function logout() {
  cookies().delete('auth-role')
  cookies().delete('auth-user-id')
  cookies().delete('auth-restaurant-id')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || password.length < 6) return { error: 'Email y contraseña (min 6 caracteres) requeridos' }

  const result = db.registerUser(email, password)
  
  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}
