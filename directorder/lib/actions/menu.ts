'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import * as db from '@/lib/db'
import { getAuthActiveBranchId } from '@/lib/server/auth-restaurant'

function getRestaurantIdFromSession() {
  return getAuthActiveBranchId()
}

async function saveUploadedImage(file: File) {
  if (!file || file.size === 0) return null
  if (!file.type.startsWith('image/')) return null

  const extFromName = path.extname(file.name || '').toLowerCase()
  const ext = extFromName || '.jpg'
  const fileName = `${Date.now()}-${randomUUID()}${ext}`
  const relativeDir = '/uploads/menu'
  const absoluteDir = path.join(process.cwd(), 'public', 'uploads', 'menu')
  fs.mkdirSync(absoluteDir, { recursive: true })

  const absolutePath = path.join(absoluteDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(absolutePath, buffer)

  return `${relativeDir}/${fileName}`
}

export async function createProductAction(formData: FormData) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const name = String(formData.get('name') || '').trim()
  const category_id = String(formData.get('category_id') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const rawPrice = String(formData.get('price') || '0').trim()
  const price = Number(rawPrice || '0')
  const image = formData.get('image')
  const rawIngredients = String(formData.get('ingredients') || '[]')

  if (!name) return { error: 'El nombre es obligatorio' }
  if (!category_id) return { error: 'Seleccioná una categoría' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Precio inválido' }

  let ingredients: string[] | undefined
  try {
    const parsed = JSON.parse(rawIngredients)
    if (Array.isArray(parsed)) {
      ingredients = parsed
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, 30)
    }
  } catch {
    ingredients = undefined
  }

  let image_url: string | null = null
  if (image instanceof File && image.size > 0) {
    image_url = await saveUploadedImage(image)
  }

  db.createProduct(restaurantId, {
    category_id,
    name,
    description: description || null,
    price,
    image_url,
    ingredients,
  })
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

  const updated = db.updateProduct(restaurantId, productId, {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price: Number(input.price) || 0,
    image_url: input.image_url?.trim() || null,
    category_id: input.category_id,
    ingredients: Array.isArray(input.ingredients)
      ? input.ingredients.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
      : [],
  })
  if (!updated) return { error: 'No se pudo editar el producto' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function toggleProductVisibilityAction(productId: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const products = db.getAllProducts(restaurantId)
  const current = products.find((p: any) => p.id === productId)
  if (!current) return { error: 'Producto no encontrado' }

  const currentlyVisible = current.is_active !== false
  db.setProductVisibility(restaurantId, productId, !currentlyVisible)
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

  const deleted = db.deleteProduct(restaurantId, productId)
  if (!deleted) return { error: 'No se pudo eliminar el producto' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function renameCategoryAction(categoryId: string, name: string, emoji?: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }
  if (!name.trim()) return { error: 'El nombre no puede estar vacío' }

  const updated = db.updateCategory(restaurantId, categoryId, {
    name: name.trim(),
    emoji: emoji?.trim() || null,
  })
  if (!updated) return { error: 'No se pudo actualizar la categoría' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function toggleCategoryVisibilityAction(categoryId: string, isActive: boolean) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }

  const updated = db.updateCategory(restaurantId, categoryId, {
    is_active: isActive,
  })
  if (!updated) return { error: 'No se pudo actualizar la categoría' }

  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function createCategoryAction(name: string, emoji?: string) {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }
  if (!name.trim()) return { error: 'El nombre no puede estar vacío' }

  db.createCategory(restaurantId, {
    name: name.trim(),
    emoji: emoji?.trim() || null,
  })
  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}

export async function createDefaultCategoriesAction() {
  const restaurantId = getRestaurantIdFromSession()
  if (!restaurantId) return { error: 'Sesión inválida' }
  db.ensureDefaultCategories(restaurantId)
  revalidatePath('/admin/menu')
  revalidatePath('/[slug]', 'page')
  return { ok: true }
}
