import fs from 'fs'
import path from 'path'
import { hashPassword, verifyPassword } from '@/lib/server/password'

// Helper to read JSON
const readDb = (fileName: string) => {
  const filePath = path.join(process.cwd(), `lib/data/${fileName}`)
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return []
  }
}

/** Escritura en dos pasos; si rename falla (p. ej. Windows + archivo en uso), escribe directo. */
const writeDb = (fileName: string, data: any) => {
  const filePath = path.join(process.cwd(), `lib/data/${fileName}`)
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  const tmp = path.join(dir, `.${fileName}.${process.pid}.${Date.now()}.tmp`)
  const payload = JSON.stringify(data, null, 2)
  fs.writeFileSync(tmp, payload, 'utf8')
  try {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
      } catch {
        /* archivo bloqueado: seguimos e intentamos rename o fallback */
      }
    }
    fs.renameSync(tmp, filePath)
  } catch {
    try {
      fs.writeFileSync(filePath, payload, 'utf8')
    } finally {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
      } catch {
        /* ignore */
      }
    }
  }
}

// RESTAURANT
export const getRestaurantBySlug = (slug: string) => {
  const restaurants = readDb('restaurants.json')
  return restaurants.find((r: any) => r.slug === slug)
}

export const getRestaurantById = (id: string) => {
  const restaurants = readDb('restaurants.json')
  return restaurants.find((r: any) => r.id === id)
}

export const updateRestaurant = (id: string, updates: any) => {
  const restaurants = readDb('restaurants.json')
  const index = restaurants.findIndex((r: any) => r.id === id)
  if (index !== -1) {
    restaurants[index] = { ...restaurants[index], ...updates }
    writeDb('restaurants.json', restaurants)
    return restaurants[index]
  }
  return null
}

// CATEGORIES
export const getCategories = (restaurantId: string) => {
  const categories = readDb('categories.json')
  return categories.filter((c: any) => c.restaurant_id === restaurantId && c.is_active).sort((a: any, b: any) => a.sort_order - b.sort_order)
}

export const getAllCategories = (restaurantId: string) => {
  const categories = readDb('categories.json')
  return categories
    .filter((c: any) => c.restaurant_id === restaurantId)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
}

export const createCategory = (
  restaurantId: string,
  input: { name: string; emoji?: string | null; is_active?: boolean }
) => {
  const categories = readDb('categories.json')
  const sameRestaurant = categories.filter((c: any) => c.restaurant_id === restaurantId)
  const maxSort = sameRestaurant.reduce(
    (m: number, c: any) => Math.max(m, typeof c.sort_order === 'number' ? c.sort_order : 0),
    -1
  )
  const category = {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    restaurant_id: restaurantId,
    name: input.name,
    emoji: input.emoji ?? null,
    sort_order: maxSort + 1,
    is_active: input.is_active !== false,
  }
  categories.push(category)
  writeDb('categories.json', categories)
  return category
}

export const ensureDefaultCategories = (restaurantId: string) => {
  const existing = getAllCategories(restaurantId)
  if (existing.length > 0) return existing
  const defaults = [
    { name: 'Hamburguesas', emoji: '🍔' },
    { name: 'Acompañamientos', emoji: '🍟' },
    { name: 'Bebidas', emoji: '🥤' },
    { name: 'Postres', emoji: '🍰' },
  ]
  defaults.forEach((d) => createCategory(restaurantId, d))
  return getAllCategories(restaurantId)
}

// PRODUCTS
export const getProducts = (restaurantId: string) => {
  const products = readDb('products.json')
  return products
    .filter((p: any) => p.restaurant_id === restaurantId && p.is_active !== false)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
}

export const getAllProducts = (restaurantId: string) => {
  const products = readDb('products.json')
  return products
    .filter((p: any) => p.restaurant_id === restaurantId)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
}

export const createProduct = (restaurantId: string, input: any) => {
  const products = readDb('products.json')
  const sameRestaurant = products.filter((p: any) => p.restaurant_id === restaurantId)
  const maxSort = sameRestaurant.reduce(
    (m: number, p: any) => Math.max(m, typeof p.sort_order === 'number' ? p.sort_order : 0),
    -1
  )

  const newProduct = {
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    restaurant_id: restaurantId,
    category_id: input.category_id ?? null,
    name: input.name,
    description: input.description ?? null,
    price: Number(input.price) || 0,
    compare_price: input.compare_price ?? null,
    image_url: input.image_url ?? null,
    tags: input.tags ?? [],
    ingredients: input.ingredients,
    is_featured: !!input.is_featured,
    is_active: input.is_active !== false,
    prep_minutes: input.prep_minutes ?? 15,
    sort_order: maxSort + 1,
    sold_count: input.sold_count ?? 0,
  }

  products.push(newProduct)
  writeDb('products.json', products)
  return newProduct
}

export const updateProduct = (restaurantId: string, productId: string, updates: any) => {
  const products = readDb('products.json')
  const index = products.findIndex(
    (p: any) => p.id === productId && p.restaurant_id === restaurantId
  )
  if (index === -1) return null
  products[index] = { ...products[index], ...updates }
  writeDb('products.json', products)
  return products[index]
}

export const setProductVisibility = (
  restaurantId: string,
  productId: string,
  isActive: boolean
) => {
  return updateProduct(restaurantId, productId, { is_active: isActive })
}

export const deleteProduct = (restaurantId: string, productId: string) => {
  const products = readDb('products.json')
  const index = products.findIndex(
    (p: any) => p.id === productId && p.restaurant_id === restaurantId
  )
  if (index === -1) return null
  const [removed] = products.splice(index, 1)
  writeDb('products.json', products)
  return removed
}

export const updateCategory = (restaurantId: string, categoryId: string, updates: any) => {
  const categories = readDb('categories.json')
  const index = categories.findIndex(
    (c: any) => c.id === categoryId && c.restaurant_id === restaurantId
  )
  if (index === -1) return null
  categories[index] = { ...categories[index], ...updates }
  writeDb('categories.json', categories)
  return categories[index]
}

// ORDERS
export const getOrders = (restaurantId: string) => {
  const orders = readDb('orders.json')
  return orders.filter((o: any) => o.restaurant_id === restaurantId)
}

export const getOrderById = (orderId: string) => {
  const orders = readDb('orders.json')
  return orders.find((o: any) => o.id === orderId) ?? null
}

export const createOrder = (orderData: any) => {
  const orders = readDb('orders.json')
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const rid = orderData.restaurant_id as string
  const sameRestaurant = orders.filter((o: any) => o.restaurant_id === rid)
  const maxNum = sameRestaurant.reduce(
    (m: number, o: any) => Math.max(m, typeof o.order_number === 'number' ? o.order_number : 0),
    0
  )
  const orderNumber = maxNum + 1
  const now = new Date().toISOString()

  const rawItems = orderData.order_items
  const order_items = Array.isArray(rawItems)
    ? rawItems.map((i: any) => ({ ...i, order_id: orderId }))
    : rawItems

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    created_at: now,
    updated_at: now,
    status: 'pending',
    ...orderData,
    order_items,
  }

  orders.push(newOrder)
  writeDb('orders.json', orders)
  return newOrder
}

export const updateOrderStatus = (orderId: string, status: string) => {
  const orders = readDb('orders.json')
  const index = orders.findIndex((o: any) => o.id === orderId)
  if (index !== -1) {
    const o = orders[index]
    const now = new Date().toISOString()
    orders[index] = {
      ...o,
      status,
      updated_at: now,
      payment_confirmed_at:
        status === 'pending' && o.status === 'awaiting_payment'
          ? now
          : o.payment_confirmed_at ?? null,
      payment_received:
        status === 'pending' && o.status === 'awaiting_payment' ? true : o.payment_received,
      accepted_at: status === 'preparing' ? now : o.accepted_at,
      ready_at: status === 'ready' ? now : o.ready_at,
      delivered_at: status === 'delivered' ? now : o.delivered_at,
    }
    writeDb('orders.json', orders)
    return orders[index]
  }
  return null
}

export const markOrderCashReceived = (restaurantId: string, orderId: string) => {
  const orders = readDb('orders.json')
  const index = orders.findIndex((o: any) => o.id === orderId && o.restaurant_id === restaurantId)
  if (index === -1) return null
  const o = orders[index]
  if (o.payment_method !== 'cash' || o.payment_received === true) return null
  if (o.status === 'cancelled' || o.status === 'delivered') return null
  const now = new Date().toISOString()
  orders[index] = { ...o, payment_received: true, updated_at: now }
  writeDb('orders.json', orders)
  return orders[index]
}

// USERS
export const authenticateUser = (email: string, password: string) => {
  const users = readDb('users.json')
  const normalizedEmail = String(email || '').trim().toLowerCase()
  return users.find(
    (u: any) =>
      String(u.email || '').trim().toLowerCase() === normalizedEmail &&
      verifyPassword(password, String(u.password ?? ''))
  )
}

export const getUserById = (id: string) => {
  const users = readDb('users.json')
  return users.find((u: any) => u.id === id)
}

export const isEmailTaken = (email: string, exceptUserId?: string) => {
  const users = readDb('users.json')
  const normalizedEmail = String(email || '').trim().toLowerCase()
  return users.some(
    (u: any) =>
      String(u.email || '').trim().toLowerCase() === normalizedEmail &&
      (!exceptUserId || u.id !== exceptUserId)
  )
}

export const updateUser = (id: string, updates: any) => {
  const users = readDb('users.json')
  const index = users.findIndex((u: any) => u.id === id)
  if (index === -1) return null
  users[index] = { ...users[index], ...updates }
  writeDb('users.json', users)
  return users[index]
}

export type RegisterProfileInput = {
  restaurantName: string
  ownerName: string
  whatsapp?: string | null
}

function slugifyRestaurantName(name: string): string {
  const raw = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return raw || 'mi-local'
}

function uniqueRestaurantSlug(base: string, restaurants: any[]): string {
  if (!restaurants.some((r: any) => r.slug === base)) return base
  let n = 2
  while (restaurants.some((r: any) => r.slug === `${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export const registerUser = (email: string, password: string, profile: RegisterProfileInput) => {
  const users = readDb('users.json')
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (
    users.find(
      (u: any) => String(u.email || '').trim().toLowerCase() === normalizedEmail
    )
  ) {
    return { error: 'El email ya está registrado' }
  }

  const restaurants = readDb('restaurants.json')
  const baseSlug = slugifyRestaurantName(profile.restaurantName)
  const slug = uniqueRestaurantSlug(baseSlug, restaurants)
  const displayName = profile.restaurantName.trim()
  const waDigits = String(profile.whatsapp ?? '').replace(/\D/g, '')

  const newRestaurantId = `rest-${Date.now()}`
  const newRestaurant = {
    id: newRestaurantId,
    slug,
    name: displayName,
    description: `Pedidos y menú de ${displayName} — DirectOrder.`,
    whatsapp: waDigits || '',
    primary_color: '#e85d04',
    secondary_color: '#f48c06',
    is_open: false,
    currency: 'ARS',
    delivery_enabled: true,
    pickup_enabled: true,
    table_mode_enabled: false,
    min_order_amount: 0,
    delivery_fee: 0,
    avg_prep_minutes: 30,
    kds_sound_new_order: true,
    kds_sound_status_change: true,
    logo_url: null,
    banner_url: null,
    address: null,
  }
  restaurants.push(newRestaurant)
  writeDb('restaurants.json', restaurants)
  ensureDefaultCategories(newRestaurantId)

  const newUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    password: hashPassword(password),
    role: 'owner',
    restaurant_id: newRestaurantId,
    name: profile.ownerName.trim(),
  }

  users.push(newUser)
  writeDb('users.json', users)

  return { user: newUser }
}

function normalizeComparableName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** Elimina el restaurante y categorías, productos, pedidos y usuarios de ese local. */
export const purgeRestaurantTenant = (restaurantId: string): boolean => {
  const restaurants = readDb('restaurants.json')
  if (!Array.isArray(restaurants) || !restaurants.some((r: any) => r.id === restaurantId)) {
    return false
  }

  writeDb(
    'restaurants.json',
    restaurants.filter((r: any) => r.id !== restaurantId)
  )

  const filterByRestaurant = (fileName: string) => {
    const rows = readDb(fileName)
    if (!Array.isArray(rows)) return
    writeDb(
      fileName,
      rows.filter((row: any) => row.restaurant_id !== restaurantId)
    )
  }

  filterByRestaurant('categories.json')
  filterByRestaurant('products.json')
  filterByRestaurant('orders.json')

  const users = readDb('users.json')
  if (Array.isArray(users)) {
    writeDb(
      'users.json',
      users.filter((u: any) => u.restaurant_id !== restaurantId)
    )
  }

  return true
}

export { normalizeComparableName }
