export type Restaurant = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  secondary_color: string
  whatsapp: string | null
  address: string | null
  currency: string
  delivery_enabled: boolean
  pickup_enabled: boolean
  table_mode_enabled: boolean
  min_order_amount: number
  delivery_fee: number
  avg_prep_minutes: number
  is_open: boolean
  kds_sound_new_order?: boolean
  kds_sound_status_change?: boolean
}

export type Category = {
  id: string
  restaurant_id: string
  name: string
  emoji: string | null
  sort_order: number
  is_active: boolean
}

export type Product = {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  compare_price: number | null
  image_url: string | null
  tags: string[]
  ingredients?: string[]
  is_featured: boolean
  is_available: boolean
  is_active: boolean
  stock: number | null
  prep_minutes: number
  sort_order: number
  sold_count: number
}

export type Order = {
  id: string
  restaurant_id: string
  customer_id: string | null
  table_id: string | null
  order_number: number
  status:
    | 'awaiting_payment'
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'
  type: 'pickup' | 'delivery' | 'table'
  customer_name: string | null
  customer_phone: string | null
  delivery_address: string | null
  subtotal: number
  delivery_fee?: number
  discount?: number
  total: number
  notes: string | null
  source: string | null
  estimated_ready_at: string | null
  accepted_at: string | null
  /** Cuando el local confirmó el pago y el pedido pasó a cocina (pending). */
  payment_confirmed_at?: string | null
  /** cash = va directo a cocina; cobro marcado en panel. other = espera confirmación remota antes de cocina. */
  payment_method?: 'cash' | 'other'
  /** true cuando el dinero quedó acreditado / cobrado (transferencia confirmada o efectivo cobrado). */
  payment_received?: boolean
  ready_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at?: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id?: string
  product_id: string | null
  product_name: string
  product_price: number
  quantity: number
  notes: string | null
  subtotal: number
}

export type Customer = {
  id: string
  restaurant_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  total_orders: number
  total_spent: number
  loyalty_points: number
  tier: 'regular' | 'silver' | 'gold' | 'vip'
  last_order_at: string | null
}

export type User = {
  id: string
  restaurant_id: string
  email: string
  role: 'owner' | 'admin' | 'employee'
  full_name: string | null
  avatar_url: string | null
}

export type AnalyticsEvent = {
  id: string
  restaurant_id: string
  event: string
  properties: Record<string, any> | null
  created_at: string
}

// Supabase v2.100+ requires Relationships, Views, Functions, Enums, CompositeTypes
type TableDef<R, I = Partial<R>, U = Partial<R>> = {
  Row: R
  Insert: I
  Update: U
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      restaurants: TableDef<
        Restaurant,
        Partial<Restaurant> & { slug: string; name: string },
        Partial<Restaurant>
      >
      categories: TableDef<
        Category,
        Partial<Category> & { restaurant_id: string; name: string },
        Partial<Category>
      >
      products: TableDef<
        Product,
        Partial<Product> & { restaurant_id: string; name: string; price: number },
        Partial<Product>
      >
      orders: TableDef<
        Order,
        Partial<Order> & { restaurant_id: string },
        Partial<Order>
      >
      order_items: TableDef<
        OrderItem,
        Partial<OrderItem> & { order_id: string; product_name: string; product_price: number; quantity: number },
        Partial<OrderItem>
      >
      customers: TableDef<
        Customer,
        Partial<Customer> & { restaurant_id: string; name: string },
        Partial<Customer>
      >
      users: TableDef<
        User,
        Partial<User> & { id: string; restaurant_id: string },
        Partial<User>
      >
      analytics_events: TableDef<
        AnalyticsEvent,
        Partial<AnalyticsEvent> & { restaurant_id: string; event: string },
        Partial<AnalyticsEvent>
      >
      tables: TableDef<
        { id: string; restaurant_id: string; name: string; qr_code: string | null; is_active: boolean },
        { restaurant_id: string; name: string; qr_code?: string | null; is_active?: boolean },
        { name?: string; qr_code?: string | null; is_active?: boolean }
      >
      loyalty_points: TableDef<
        { id: string; customer_id: string; restaurant_id: string; points: number; reason: string; created_at: string },
        { customer_id: string; restaurant_id: string; points: number; reason: string },
        { points?: number; reason?: string }
      >
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_restaurant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
