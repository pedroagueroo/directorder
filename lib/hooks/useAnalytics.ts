'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { summarizeDailySales, DEFAULT_ANALYTICS_TIMEZONE } from '@/lib/utils/analytics'
import { fetchWithRetry } from '@/lib/utils/fetch-with-retry'

const empty = {
  todaySales: 0,
  todayOrders: 0,
  avgTicket: 0,
  peakHour: '—',
  weekSales: [] as number[],
  topProducts: [] as Array<{ name: string; count: number }>,
  orderMix: { delivery: 0, pickup: 0, table: 0 },
  pendingOrders: 0,
  preparingOrders: 0,
  readyOrders: 0,
  readyOrderList: [] as Array<{
    id: string
    orderNumber: number
    customerName: string
    total: number
    type: string
  }>,
  awaitingPaymentList: [] as Array<{
    id: string
    orderNumber: number
    customerName: string
    total: number
    type: string
    createdAt: string
  }>,
  cashPendingList: [] as Array<{
    id: string
    orderNumber: number
    customerName: string
    total: number
    type: string
    status: string
    createdAt: string
  }>,
}

const demoFallback = {
  todaySales: 128450,
  todayOrders: 34,
  avgTicket: 3778,
  peakHour: '21h',
  topProducts: [
    { name: 'Doble Cheddar Bacon', count: 18 },
    { name: 'Clásica de la Casa', count: 14 },
    { name: 'Papas Cheddar y Panceta', count: 12 },
    { name: 'Pollo Crispy', count: 9 },
    { name: 'Coca Cola 500ml', count: 8 },
  ] as Array<{ name: string; count: number }>,
  orderMix: { delivery: 18, pickup: 12, table: 4 },
}

export function useDashboardAnalytics(
  restaurantId: string,
  options?: { enableDemoData?: boolean }
) {
  const [data, setData] = useState(empty)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDemoData, setIsDemoData] = useState(false)
  const retryCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    void restaurantId
    try {
      const res = await fetchWithRetry('/api/orders', { credentials: 'include' }, { retries: 2 })
      if (res.status === 401) {
        setData(empty)
        setError('Sesion vencida')
        setSyncStatus('error')
        return false
      }
      if (!res.ok) throw new Error('No se pudo actualizar el panel')
      const orders = await res.json()
      if (!Array.isArray(orders)) throw new Error('Respuesta inválida del servidor')
      const summary = summarizeDailySales(orders, DEFAULT_ANALYTICS_TIMEZONE)
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length
      const preparingOrders = orders.filter((o: any) => o.status === 'preparing').length
      const readyOrders = orders.filter((o: any) => o.status === 'ready').length
      const readyOrderList = orders
        .filter((o: any) => o.status === 'ready')
        .sort((a: any, b: any) => {
          const aDate = new Date(a.ready_at || a.updated_at || a.created_at).getTime()
          const bDate = new Date(b.ready_at || b.updated_at || b.created_at).getTime()
          return bDate - aDate
        })
        .map((o: any) => ({
          id: o.id,
          orderNumber: Number(o.order_number) || 0,
          customerName: o.customer_name || 'Cliente',
          total: Number(o.total) || 0,
          type: String(o.type || 'pickup'),
        }))
      const awaitingPaymentList = orders
        .filter((o: any) => o.status === 'awaiting_payment')
        .sort((a: any, b: any) => {
          const aDate = new Date(a.created_at).getTime()
          const bDate = new Date(b.created_at).getTime()
          return aDate - bDate
        })
        .map((o: any) => ({
          id: o.id,
          orderNumber: Number(o.order_number) || 0,
          customerName: o.customer_name || 'Cliente',
          total: Number(o.total) || 0,
          type: String(o.type || 'pickup'),
          createdAt: String(o.created_at || ''),
        }))
      const cashPendingList = orders
        .filter(
          (o: any) =>
            o.payment_method === 'cash' &&
            o.payment_received !== true &&
            ['pending', 'preparing', 'ready'].includes(o.status)
        )
        .sort((a: any, b: any) => {
          const aDate = new Date(a.created_at).getTime()
          const bDate = new Date(b.created_at).getTime()
          return aDate - bDate
        })
        .map((o: any) => ({
          id: o.id,
          orderNumber: Number(o.order_number) || 0,
          customerName: o.customer_name || 'Cliente',
          total: Number(o.total) || 0,
          type: String(o.type || 'pickup'),
          status: String(o.status || 'pending'),
          createdAt: String(o.created_at || ''),
        }))
      const useDemo = (options?.enableDemoData ?? false) && summary.todayOrders === 0
      setIsDemoData(useDemo)

      setData({
        todaySales: useDemo ? demoFallback.todaySales : summary.todaySales,
        todayOrders: useDemo ? demoFallback.todayOrders : summary.todayOrders,
        avgTicket: useDemo ? demoFallback.avgTicket : summary.avgTicket,
        peakHour: useDemo ? demoFallback.peakHour : summary.peakHour,
        weekSales: [],
        orderMix: useDemo ? demoFallback.orderMix : summary.orderMix,
        topProducts: useDemo ? demoFallback.topProducts : summary.topProducts,
        pendingOrders,
        preparingOrders,
        readyOrders,
        readyOrderList,
        awaitingPaymentList,
        cashPendingList,
      })
      setLastUpdatedAt(new Date())
      setError(null)
      setSyncStatus('connected')
      retryCountRef.current = 0
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error sincronizando panel')
      retryCountRef.current += 1
      setSyncStatus(retryCountRef.current > 3 ? 'error' : 'reconnecting')
      return false
    }
  }, [restaurantId, options?.enableDemoData])

  useEffect(() => {
    let cancelled = false

    const loop = async () => {
      if (cancelled) return
      await fetchData()
      const delay = Math.min(20000, 5000 * 2 ** retryCountRef.current)
      timerRef.current = setTimeout(loop, delay)
    }

    void loop()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchData()
    }
    const onOnline = () => void fetchData()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
    }
  }, [fetchData])

  return { ...data, syncStatus, lastUpdatedAt, error, isDemoData, refreshAnalytics: fetchData }
}
