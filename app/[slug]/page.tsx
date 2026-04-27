import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MenuHeader from '@/components/public/MenuHeader'
import CategoryFilter from '@/components/public/CategoryFilter'
import FeaturedProducts from '@/components/public/FeaturedProducts'
import ProductList from '@/components/public/ProductList'
import CartBar from '@/components/public/Cart'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  return {
    title: restaurant?.name ?? 'Menú',
    description: restaurant?.description ?? '',
  }
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    supabase.from('products').select('*').eq('restaurant_id', restaurant.id).eq('is_available', true).order('sort_order')
  ])

  return (
    <main>
      <MenuHeader restaurant={restaurant} />
      <CategoryFilter categories={categories ?? []} />
      <FeaturedProducts products={(products ?? []).filter((p: any) => p.is_featured)} />
      <ProductList products={products ?? []} categories={categories ?? []} restaurantId={restaurant.id} />
      <CartBar restaurant={restaurant} />
    </main>
  )
}
