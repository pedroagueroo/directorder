import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthRestaurantId } from '@/lib/server/auth-restaurant'
import { userCanAccessBranch } from '@/lib/server/branches'

export type StaffApiAuth = {
  supabase: ReturnType<typeof createServerSupabase>
  userId: string
  restaurantId: string
}

/**
 * API routes de panel/cocina: sesión Supabase válida + cookies alineadas + sucursal permitida para el usuario.
 */
export async function requireStaffApiAuth(): Promise<
  { ok: true; auth: StaffApiAuth } | { ok: false; response: NextResponse }
> {
  const restaurantId = getAuthRestaurantId()
  const cookieUserId = cookies().get('auth-user-id')?.value

  if (!restaurantId || !cookieUserId) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const supabase = createServerSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || user.id !== cookieUserId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 }),
    }
  }

  const allowed = await userCanAccessBranch(supabase, user.id, restaurantId)
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  return { ok: true, auth: { supabase, userId: user.id, restaurantId } }
}
