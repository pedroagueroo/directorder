import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import MenuHeader from '@/components/public/MenuHeader'
import CategoryFilter from '@/components/public/CategoryFilter'
import FeaturedProducts from '@/components/public/FeaturedProducts'
import ProductList from '@/components/public/ProductList'
import CartBar from '@/components/public/Cart'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMenuRestaurantIdFromRow } from '@/lib/server/branches'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) return { title: 'No encontrado' }
  return {
    title: restaurant.name,
    description: restaurant.description ?? `Menú online — ${restaurant.name}`,
  }
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  noStore()
  const supabase = createServerSupabase()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  const menuRestaurantId = getMenuRestaurantIdFromRow(restaurant as { id: string; menu_source_restaurant_id?: string | null })

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', menuRestaurantId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', menuRestaurantId)
      .eq('is_available', true)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <main className="min-h-screen min-h-[100dvh] bg-background bg-dots-pattern pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
      <MenuHeader restaurant={restaurant as any} />
      <CategoryFilter categories={categories ?? []} />
      <FeaturedProducts
        products={(products ?? []).filter((p: any) => p.is_featured)}
        restaurantSlug={restaurant.slug}
      />
      <ProductList products={products ?? []} categories={categories ?? []} restaurantSlug={restaurant.slug} />
      <CartBar restaurant={restaurant as any} />
    </main>
  )
}
