import { createServerSupabase } from '@/lib/supabase/server'
import type { Restaurant } from '@/lib/types/database'

type Supabase = ReturnType<typeof createServerSupabase>

/** Sucursales de la marca del usuario (o una sola fila legacy sin brand_id). */
export async function getBranchesForUserId(supabase: Supabase, userId: string): Promise<Restaurant[]> {
  const { data: user } = await supabase
    .from('users')
    .select('brand_id, restaurant_id')
    .eq('id', userId)
    .single()

  if (!user) return []

  const brandId = user.brand_id as string | null
  if (brandId) {
    const { data } = await supabase.from('restaurants').select('*').eq('brand_id', brandId).order('name')
    return (data as Restaurant[]) ?? []
  }

  const { data: row } = await supabase.from('restaurants').select('*').eq('id', user.restaurant_id).maybeSingle()
  return row ? ([row] as Restaurant[]) : []
}

/** Misma regla que en admin: menú compartido vía `menu_source_restaurant_id`. */
export function getMenuRestaurantIdFromRow(r: {
  id: string
  menu_source_restaurant_id?: string | null
}): string {
  const src = r.menu_source_restaurant_id ?? null
  if (src && src !== r.id) return src
  return r.id
}

/** restaurant_id del menú (fuente) para la sucursal activa. */
export async function getMenuRestaurantIdForBranch(supabase: Supabase, branchId: string): Promise<string | null> {
  const { data: r } = await supabase
    .from('restaurants')
    .select('id, menu_source_restaurant_id')
    .eq('id', branchId)
    .single()

  if (!r) return null
  return getMenuRestaurantIdFromRow(r as { id: string; menu_source_restaurant_id?: string | null })
}
