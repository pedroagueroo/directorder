import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  cartItemId: string // Unique identifier for the cart item, not just the product
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

type CartStore = {
  items: CartItem[]
  /** Sucursal (slug público) a la que pertenece el carrito; evita mezclar pedidos entre locales. */
  restaurantSlug: string | null
  switchRestaurant: (slug: string) => void
  addItem: (
    item: Omit<CartItem, 'quantity' | 'cartItemId'> & { quantity?: number; cartItemId?: string },
    restaurantSlug: string
  ) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, qty: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantSlug: null,

      switchRestaurant: (slug) =>
        set((state) => {
          if (state.restaurantSlug === slug) return state
          return { items: [], restaurantSlug: slug }
        }),

      addItem: (item, restaurantSlug) =>
        set((state) => {
          let items = state.items
          let activeSlug = state.restaurantSlug

          if (activeSlug !== null && activeSlug !== restaurantSlug) {
            items = []
          }
          activeSlug = restaurantSlug

          const existingIndex = items.findIndex(
            (i) => i.productId === item.productId && i.notes === item.notes
          )

          if (existingIndex >= 0) {
            const newItems = [...items]
            newItems[existingIndex].quantity += item.quantity || 1
            return { items: newItems, restaurantSlug: activeSlug }
          }

          const cartItemId = item.cartItemId || `${item.productId}-${Date.now()}`
          return {
            items: [...items, { ...item, quantity: item.quantity || 1, cartItemId }],
            restaurantSlug: activeSlug,
          }
        }),

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      updateQuantity: (cartItemId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.cartItemId !== cartItemId)
              : state.items.map((i) =>
                  i.cartItemId === cartItemId ? { ...i, quantity: qty } : i
                ),
        })),

      clearCart: () => set({ items: [], restaurantSlug: null }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'directorder-cart-v2' }
  )
)
