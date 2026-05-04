import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import MenuManager from './MenuManager'

export default async function AdminMenuPage() {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  if (!restaurantId) redirect('/login')

  db.ensureDefaultCategories(restaurantId)
  const categories = db.getAllCategories(restaurantId)
  const products = db.getAllProducts(restaurantId)

  return <MenuManager categories={categories} products={products} />
}
