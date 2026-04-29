import { notFound } from 'next/navigation'
import MenuHeader from '@/components/public/MenuHeader'
import CategoryFilter from '@/components/public/CategoryFilter'
import FeaturedProducts from '@/components/public/FeaturedProducts'
import ProductList from '@/components/public/ProductList'
import CartBar from '@/components/public/Cart'
import * as db from '@/lib/db'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const restaurant = db.getRestaurantBySlug(params.slug)
  if (!restaurant) return { title: 'No encontrado' }
  return {
    title: restaurant.name,
    description: restaurant.description ?? `Menú online — ${restaurant.name}`,
  }
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const restaurant = db.getRestaurantBySlug(params.slug)
  if (!restaurant) notFound()

  const categories = db.getCategories(restaurant.id)
  const products = db.getProducts(restaurant.id)

  return (
    <main className="min-h-screen bg-background bg-dots-pattern pb-28 sm:pb-32">
      <MenuHeader restaurant={restaurant} />
      <CategoryFilter categories={categories} />
      <FeaturedProducts products={products.filter((p: any) => p.is_featured)} />
      <ProductList products={products} categories={categories} restaurantId={restaurant.id} />
      <CartBar restaurant={restaurant} />
    </main>
  )
}
