'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types/database'

export function useOrders(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true })

    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [restaurantId, supabase])

  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders()

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [...prev, payload.new as Order])
            playNewOrderSound()
          }
          if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
                .filter(o => !['delivered', 'cancelled'].includes(o.status))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, fetchOrders, supabase])

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await supabase
      .from('orders')
      .update({
        status,
        ...(status === 'preparing' ? { accepted_at: new Date().toISOString() } : {}),
        ...(status === 'ready' ? { ready_at: new Date().toISOString() } : {}),
        ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
      })
      .eq('id', orderId)
  }

  return { orders, loading, updateStatus }
}

function playNewOrderSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}
