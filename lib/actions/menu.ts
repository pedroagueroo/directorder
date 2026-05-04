'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'

function getRestaurantIdFromSession() {
  return cookies().get('auth-restaurant-id')?.value ?? null
}

export async function createProductAction(formData: FormData) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const name = String(formData.get('name') || '').trim()
  const category_id = String(formData.get('category_id') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const price = Number(String(formData.get('price') || '0').trim())
  const image_url = String(formData.get('image_url') || '').trim()
  const rawIngredients = String(formData.get('ingredients') || '[]')

  if (!name) return { error: 'El nombre es obligatorio' }
  if (!category_id) return { error: 'Seleccioná una categoría' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Precio inválido' }

  let ingredients: string[] = []
  try {
    const parsed = JSON.parse(rawIngredients)
    if (Array.isArray(parsed)) {
      ingredients = parsed.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
    }
  } catch { /* ignore */ }

  const supabase = createServerSupabase()

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from('products')
    .select('sort_order')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('products').insert({
    restaurant_id: restaurantId,
    category_id: category_id || null,
    name,
    description: description || null,
    price,
    image_url: image_url || null,
    ingredients,
    sort_order: (maxSort?.sort_order ?? -1) + 1,
  })

  if (error) return { error: 'No se pudo crear el producto: ' + error.message }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function updateProductAction(
  productId: string,
  input: {
    name: string
    description?: string
    price: number
    image_url?: string
    category_id: string
    ingredients?: string[]
  }
) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('products')
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: Number(input.price) || 0,
      image_url: input.image_url?.trim() || null,
      category_id: input.category_id,
      ingredients: Array.isArray(input.ingredients)
        ? input.ingredients.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
        : [],
    })
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: 'No se pudo editar el producto' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function toggleProductVisibilityAction(productId: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const supabase = createServerSupabase()
  const { data: current } = await supabase
    .from('products')
    .select('is_active')
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!current) return { error: 'Producto no encontrado' }

  await supabase
    .from('products')
    .update({ is_active: !current.is_active })
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function deleteProductAction(productId: string, confirmation: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  if (confirmation.trim().toUpperCase() !== 'ELIMINAR') {
    return { error: 'Confirmación inválida. Escribí ELIMINAR para continuar.' }
  }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: 'No se pudo eliminar el producto' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function renameCategoryAction(categoryId: string, name: string, emoji?: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }
  if (!name.trim()) return { error: 'El nombre no puede estar vacío' }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim(), emoji: emoji?.trim() || null })
    .eq('id', categoryId)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: 'No se pudo actualizar la categoría' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function toggleCategoryVisibilityAction(categoryId: string, isActive: boolean) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: 'No se pudo actualizar la categoría' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function createCategoryAction(name: string, emoji?: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }
  if (!name.trim()) return { error: 'El nombre no puede estar vacío' }

  const supabase = createServerSupabase()

  const { data: maxSort } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('categories').insert({
    restaurant_id: restaurantId,
    name: name.trim(),
    emoji: emoji?.trim() || null,
    sort_order: (maxSort?.sort_order ?? -1) + 1,
    is_active: true,
  })

  if (error) return { error: 'No se pudo crear la categoría' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function createDefaultCategoriesAction() {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const supabase = createServerSupabase()

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .limit(1)

  if (existing && existing.length > 0) return { ok: true }

  const defaults = [
    { name: 'Hamburguesas', emoji: '🍔', sort_order: 0 },
    { name: 'Acompañamientos', emoji: '🍟', sort_order: 1 },
    { name: 'Bebidas', emoji: '🥤', sort_order: 2 },
    { name: 'Postres', emoji: '🍰', sort_order: 3 },
  ]

  await supabase.from('categories').insert(
    defaults.map(c => ({ ...c, restaurant_id: restaurantId, is_active: true }))
  )

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}
