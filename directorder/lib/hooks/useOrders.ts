'use client'
import { useEffect, useState, useCallback } from 'react'

export function useOrders(restaurantId: string) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    void restaurantId
    try {
      const res = await fetch('/api/orders', { credentials: 'include' })
      if (res.status === 401) {
        setOrders([])
        return
      }
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      const activeOrders = data.filter((o: any) =>
        ['pending', 'preparing', 'ready'].includes(o.status)
      )

      setOrders((prev) => {
        if (prev.length > 0) {
          const newOrders = activeOrders.filter(
            (ao: any) =>
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
  }, [restaurantId])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders()
      }
    }, 3000)
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchOrders()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))

    const res = await fetch('/api/orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', orderId, status }),
    })

    if (!res.ok) {
      await fetchOrders()
      return
    }
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
