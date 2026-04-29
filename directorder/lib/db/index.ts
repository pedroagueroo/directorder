import fs from 'fs'
import path from 'path'

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

// Helper to write JSON
const writeDb = (fileName: string, data: any) => {
  const filePath = path.join(process.cwd(), `lib/data/${fileName}`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
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
  return products.filter((p: any) => p.restaurant_id === restaurantId && p.is_available).sort((a: any, b: any) => a.sort_order - b.sort_order)
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
    is_available: input.is_available !== false,
    stock: input.stock ?? null,
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

export const setProductAvailability = (
  restaurantId: string,
  productId: string,
  isAvailable: boolean
) => {
  return updateProduct(restaurantId, productId, { is_available: isAvailable })
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
      accepted_at: status === 'preparing' ? now : o.accepted_at,
      ready_at: status === 'ready' ? now : o.ready_at,
      delivered_at: status === 'delivered' ? now : o.delivered_at,
    }
    writeDb('orders.json', orders)
    return orders[index]
  }
  return null
}

// USERS
export const authenticateUser = (email: string, password: string) => {
  const users = readDb('users.json')
  return users.find((u: any) => u.email === email && u.password === password)
}

export const getUserById = (id: string) => {
  const users = readDb('users.json')
  return users.find((u: any) => u.id === id)
}

export const registerUser = (email: string, password: string) => {
  const users = readDb('users.json')
  
  if (users.find((u: any) => u.email === email)) {
    return { error: 'El email ya está registrado' }
  }

  // Create a new restaurant for this new owner
  const restaurants = readDb('restaurants.json')
  const newRestaurantId = `rest-${Date.now()}`
  const newRestaurant = {
    id: newRestaurantId,
    slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: "Mi Restaurante",
    description: "Configura tu descripción desde el panel.",
    whatsapp: "",
    primary_color: "#e85d04",
    secondary_color: "#f48c06",
    is_open: false,
    currency: "ARS",
    delivery_enabled: true,
    pickup_enabled: true,
    table_mode_enabled: false,
    min_order_amount: 0,
    delivery_fee: 0,
    avg_prep_minutes: 30,
    logo_url: null,
    banner_url: null,
    address: null
  }
  restaurants.push(newRestaurant)
  writeDb('restaurants.json', restaurants)
  ensureDefaultCategories(newRestaurantId)

  // Create the owner user
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    password, // In a real app this would be hashed
    role: 'owner',
    restaurant_id: newRestaurantId,
    name: email.split('@')[0]
  }

  users.push(newUser)
  writeDb('users.json', users)

  return { user: newUser }
}
