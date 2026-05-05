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
  restaurantSlug: string | null
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'> & { quantity?: number, cartItemId?: string }) => void
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

      addItem: (item) => set((state) => {
        // If they pass a cartItemId, it means they are adding an identical configured item
        // or we check if there's an item with EXACTLY the same productId and notes
        const existingIndex = state.items.findIndex(i => 
          i.productId === item.productId && i.notes === item.notes
        )

        if (existingIndex >= 0) {
          const newItems = [...state.items]
          newItems[existingIndex].quantity += (item.quantity || 1)
          return { items: newItems }
        }

        const cartItemId = item.cartItemId || `${item.productId}-${Date.now()}`
        return { items: [...state.items, { ...item, quantity: item.quantity || 1, cartItemId }] }
      }),

      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter(i => i.cartItemId !== cartItemId)
      })),

      updateQuantity: (cartItemId, qty) => set((state) => ({
        items: qty <= 0
          ? state.items.filter(i => i.cartItemId !== cartItemId)
          : state.items.map(i => i.cartItemId === cartItemId ? { ...i, quantity: qty } : i)
      })),

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'directorder-cart' }
  )
)
