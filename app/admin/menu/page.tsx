import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import MenuManager from './MenuManager'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'
import { getMenuRestaurantIdForBranch } from '@/lib/server/branches'

export default async function AdminMenuPage() {
  const branchId = getAuthActiveBranchId()
  if (!branchId) redirect('/login')

  const supabase = createServerSupabase()
  const menuRestaurantId = await getMenuRestaurantIdForBranch(supabase, branchId)
  if (!menuRestaurantId) redirect('/login')

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('restaurant_id', menuRestaurantId).order('sort_order'),
    supabase.from('products').select('*').eq('restaurant_id', menuRestaurantId).order('sort_order'),
  ])

  return <MenuManager categories={categories ?? []} products={products ?? []} />
}
