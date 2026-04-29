'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

type SyncStatus = 'connected' | 'reconnecting' | 'error'

export function useOrders(
  restaurantId: string,
  options?: { newOrderSoundEnabled?: boolean; statusSoundEnabled?: boolean }
) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected')
  const [retryInMs, setRetryInMs] = useState(0)

  const previousSnapshotRef = useRef<Record<string, string>>({})
  const retryCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const baseInterval = 4000
  const maxInterval = 20000

  const fetchOrders = useCallback(async () => {
    void restaurantId
    try {
      const res = await fetch('/api/orders', { credentials: 'include' })
      if (res.status === 401) {
        setOrders([])
        setError('Sesion vencida')
        setSyncStatus('error')
        return false
      }
      if (!res.ok) throw new Error('Error de red al actualizar cocina')
      const data = await res.json()

      const activeOrders = data.filter((o: any) =>
        ['pending', 'preparing', 'ready'].includes(o.status)
      )

      const nextSnapshot: Record<string, string> = Object.fromEntries(
        activeOrders.map((o: any) => [o.id, o.status])
      )
      const previousSnapshot = previousSnapshotRef.current
      const newPendingOrders = activeOrders.filter(
        (o: any) => o.status === 'pending' && !previousSnapshot[o.id]
      )
      const changedStatusOrders = activeOrders.filter(
        (o: any) => previousSnapshot[o.id] && previousSnapshot[o.id] !== o.status
      )

      if (newPendingOrders.length > 0 && (options?.newOrderSoundEnabled ?? true)) {
        playNewOrderSound()
        toast.success(`Nuevo pedido: ${newPendingOrders.length}`, { id: 'kds-new-order' })
      }
      if (changedStatusOrders.length > 0 && (options?.statusSoundEnabled ?? true)) {
        playStatusChangeSound()
      }

      previousSnapshotRef.current = nextSnapshot
      setOrders(activeOrders)
      setLastUpdatedAt(new Date())
      setError(null)
      setSyncStatus('connected')
      retryCountRef.current = 0
      setRetryInMs(0)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo sincronizar cocina'
      setError(message)
      retryCountRef.current += 1
      const nextRetry = Math.min(maxInterval, baseInterval * 2 ** retryCountRef.current)
      setRetryInMs(nextRetry)
      setSyncStatus(retryCountRef.current > 3 ? 'error' : 'reconnecting')
      return false
    } finally {
      setLoading(false)
    }
  }, [restaurantId, options?.newOrderSoundEnabled, options?.statusSoundEnabled])

  const schedulePolling = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const delay = retryInMs > 0 ? retryInMs : baseInterval
    timerRef.current = setTimeout(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        schedulePolling()
        return
      }
      await fetchOrders()
      schedulePolling()
    }, delay)
  }, [fetchOrders, retryInMs])

  useEffect(() => {
    fetchOrders().finally(schedulePolling)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchOrders()
    }
    const onOnline = () => {
      toast('Conexion recuperada. Sincronizando...')
      void fetchOrders()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
    }
  }, [fetchOrders, schedulePolling])

  const updateStatus = async (orderId: string, status: string) => {
    const previous = orders
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', orderId, status }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el estado del pedido')
      await fetchOrders()
    } catch (e) {
      setOrders(previous)
      toast.error(e instanceof Error ? e.message : 'Error actualizando pedido')
    }
  }

  return { orders, loading, error, syncStatus, lastUpdatedAt, retryInMs, updateStatus, refetch: fetchOrders }
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

function playStatusChangeSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}
