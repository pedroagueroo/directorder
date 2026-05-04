import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import MenuManager from './MenuManager'

export default async function AdminMenuPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  const supabase = createServerSupabase()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order'),
  ])

  return <MenuManager categories={categories ?? []} products={products ?? []} />
}
