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

// PRODUCTS
export const getProducts = (restaurantId: string) => {
  const products = readDb('products.json')
  return products.filter((p: any) => p.restaurant_id === restaurantId && p.is_available).sort((a: any, b: any) => a.sort_order - b.sort_order)
}

// ORDERS
export const getOrders = (restaurantId: string) => {
  const orders = readDb('orders.json')
  return orders.filter((o: any) => o.restaurant_id === restaurantId)
}

export const createOrder = (orderData: any) => {
  const orders = readDb('orders.json')
  const orderId = `ord-${Date.now()}`
  const orderNumber = orders.length + 1

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    created_at: new Date().toISOString(),
    status: 'pending',
    ...orderData
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
    orders[index] = {
      ...o,
      status,
      accepted_at: status === 'preparing' ? new Date().toISOString() : o.accepted_at,
      ready_at: status === 'ready' ? new Date().toISOString() : o.ready_at,
      delivered_at: status === 'delivered' ? new Date().toISOString() : o.delivered_at,
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
    table_mode_enabled: false
  }
  restaurants.push(newRestaurant)
  writeDb('restaurants.json', restaurants)

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
