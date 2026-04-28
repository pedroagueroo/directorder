'use client'
import { useEffect, useState, useCallback } from 'react'

export function useOrders(restaurantId: string) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      
      const activeOrders = data.filter((o: any) => 
        ['pending', 'preparing', 'ready'].includes(o.status)
      )
      
      setOrders((prev) => {
        // Detect new pending orders to play sound
        if (prev.length > 0) {
          const newOrders = activeOrders.filter((ao: any) => 
            ao.status === 'pending' && !prev.find((po: any) => po.id === ao.id)
          )
          if (newOrders.length > 0) playNewOrderSound()
        }
        return activeOrders
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000) // Poll every 3s
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', orderId, status })
    })
    
    fetchOrders()
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
