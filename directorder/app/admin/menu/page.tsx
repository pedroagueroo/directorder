import { redirect } from 'next/navigation'
import * as db from '@/lib/db'
import MenuManager from './MenuManager'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

export default async function AdminMenuPage() {
  const restaurantId = getAuthActiveBranchId()
  if (!restaurantId) redirect('/login')

  db.ensureDefaultCategories(restaurantId)
  const categories = db.getAllCategories(restaurantId)
  const products = db.getAllProducts(restaurantId)

  return <MenuManager categories={categories} products={products} />
}
