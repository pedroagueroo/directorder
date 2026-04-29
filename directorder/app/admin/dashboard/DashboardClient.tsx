'use client'
import { useState, useTransition } from 'react'
import { useDashboardAnalytics } from '@/lib/hooks/useAnalytics'
import { Bar, Doughnut } from 'react-chartjs-2'
import 'chart.js/auto'
import { Utensils, DollarSign, ShoppingCart, Clock, BellRing, ChefHat } from 'lucide-react'
import QRGenerator from '@/components/admin/QRGenerator'
import { setRestaurantOpenAction } from '@/lib/actions/restaurant'
import toast from 'react-hot-toast'

export default function DashboardClient({
  restaurantId,
  menuSlug,
  restaurantOpen,
}: {
  restaurantId: string
  menuSlug: string
  restaurantOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(restaurantOpen)
  const [toggleError, setToggleError] = useState('')
  const [deliveryError, setDeliveryError] = useState('')
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    todaySales,
    todayOrders,
    avgTicket,
    peakHour,
    topProducts,
    orderMix,
    pendingOrders,
    preparingOrders,
    readyOrders,
    readyOrderList,
    syncStatus,
    lastUpdatedAt,
    error: syncError,
    isDemoData,
    refreshAnalytics,
  } =
    useDashboardAnalytics(restaurantId)

  const mixData = {
    labels: ['Delivery', 'Retiro', 'Mesa'],
    datasets: [
      {
        data: [orderMix.delivery, orderMix.pickup, orderMix.table],
        backgroundColor: ['#e85d04', '#f48c06', '#ffb703'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const topData = {
    labels: topProducts.length ? topProducts.map((p) => p.name) : ['Sin ventas hoy'],
    datasets: [
      {
        label: 'Unidades',
        data: topProducts.length ? topProducts.map((p) => p.count) : [0],
        backgroundColor: '#e85d04',
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: (value: string | number) => `${Math.round(Number(value) || 0)}`,
        },
      },
      x: { grid: { display: false } },
    },
  }

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Centro de Control</h1>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg text-foreground/60">
            Ventas y pedidos del día (zona Argentina)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setToggleError('')
                const next = !isOpen
                setIsOpen(next)
                const res = await setRestaurantOpenAction(next)
                if (res?.error) {
                  setIsOpen(!next)
                  setToggleError(res.error)
                }
              })
            }
            className={`px-5 py-2.5 rounded-2xl shadow-sm font-bold transition-colors text-center border ${
              isOpen
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 border-rose-300 hover:bg-rose-500/20'
            } disabled:opacity-60`}
          >
            {isOpen ? 'Local abierto' : 'Local cerrado'}
          </button>
          <a
            href={`/${menuSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary/10 text-primary hover:bg-primary/20 px-5 py-2.5 rounded-2xl shadow-sm font-bold transition-colors text-center"
          >
            Ver menú público ↗
          </a>
          <div className="bg-card px-5 py-2.5 rounded-2xl shadow-sm border border-border font-bold flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hoy: {new Date().toLocaleDateString('es-AR')}
          </div>
          <div className="bg-card px-4 py-2.5 rounded-2xl shadow-sm border border-border text-xs font-semibold">
            {isDemoData ? 'Modo DEMO' : 'Datos reales'}
          </div>
        </div>
      </div>
      {toggleError && (
        <p className="text-sm text-rose-600 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          {toggleError}
        </p>
      )}
      <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-xs sm:text-sm flex flex-wrap items-center gap-3">
        <span>
          Sincronizacion:{' '}
          <strong>
            {syncStatus === 'connected'
              ? 'Conectado'
              : syncStatus === 'reconnecting'
              ? 'Reconectando...'
              : 'Error'}
          </strong>
        </span>
        <span>
          Ultima actualizacion:{' '}
          <strong>{lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString('es-AR') : 'sin datos'}</strong>
        </span>
        {syncError && <span className="text-rose-600">{syncError}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Ventas hoy"
          value={`$${todaySales.toLocaleString('es-AR')}`}
          icon={<DollarSign size={24} />}
        />
        <MetricCard
          title="Pedidos entregados hoy"
          value={todayOrders}
          icon={<ShoppingCart size={24} />}
        />
        <MetricCard
          title="Ticket promedio hoy"
          value={
            todayOrders > 0 ? `$${Math.round(avgTicket).toLocaleString('es-AR')}` : '—'
          }
          icon={<Utensils size={24} />}
        />
        <MetricCard title="Hora pico hoy" value={peakHour} icon={<Clock size={24} />} />
      </div>

      <div className="bg-card/70 border border-border rounded-2xl p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60 mb-2.5">
          Estado operativo en vivo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <MiniStat label="Pendientes" value={pendingOrders} icon={<BellRing size={14} />} />
          <MiniStat label="Preparando" value={preparingOrders} icon={<ChefHat size={14} />} />
          <MiniStat label="Listos" value={readyOrders} icon={<ShoppingCart size={14} />} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-extrabold">Listos para entregar</h3>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-foreground/70">
            {readyOrderList.length} pedidos
          </span>
        </div>
        {deliveryError && (
          <p className="mb-3 text-sm text-rose-600 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            {deliveryError}
          </p>
        )}
        {readyOrderList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pedidos listos en este momento.</p>
        ) : (
          <div className="space-y-2.5">
            {readyOrderList.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    Pedido #{order.orderNumber} · {order.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.type} · ${order.total.toLocaleString('es-AR')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={deliveringOrderId === order.id}
                  onClick={async () => {
                    try {
                      setDeliveryError('')
                      setDeliveringOrderId(order.id)
                      const res = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          action: 'updateStatus',
                          orderId: order.id,
                          status: 'delivered',
                        }),
                      })
                      if (!res.ok) {
                        const payload = await res.json().catch(() => ({}))
                        throw new Error(payload?.error || 'No se pudo marcar como entregado.')
                      }
                      await refreshAnalytics()
                      toast.success(`Pedido #${order.orderNumber} marcado como entregado`)
                    } catch (e) {
                      setDeliveryError(
                        e instanceof Error ? e.message : 'No se pudo marcar como entregado.'
                      )
                      toast.error(
                        e instanceof Error ? e.message : 'No se pudo marcar como entregado.'
                      )
                    } finally {
                      setDeliveringOrderId(null)
                    }
                  }}
                  className="self-start sm:self-auto px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {deliveringOrderId === order.id ? 'Guardando…' : 'Marcar entregado'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
        <div className="xl:col-span-2 bg-card p-6 sm:p-8 rounded-[2rem] border border-border shadow-sm">
          <h3 className="text-xl sm:text-2xl font-extrabold mb-6 sm:mb-8">Top productos (hoy)</h3>
          <div className="h-[280px] sm:h-[350px]">
            <Bar data={topData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-[2rem] border border-border shadow-sm flex flex-col">
          <h3 className="text-xl sm:text-2xl font-extrabold mb-6 sm:mb-8">Mix de pedidos (hoy)</h3>
          <div className="h-[260px] sm:h-[300px] flex justify-center items-center flex-grow">
            <Doughnut
              data={mixData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { padding: 16, font: { weight: 'bold', size: 12 } },
                  },
                },
                cutout: '75%',
              }}
            />
          </div>
        </div>

        <div className="xl:col-span-3">
          <QRGenerator slug={menuSlug} />
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl leading-none font-black mt-1 tabular-nums">{value}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-primary/10 p-3.5 rounded-2xl text-primary">{icon}</div>
      </div>
      <div>
        <p className="text-foreground/60 font-bold mb-2">{title}</p>
        <h3 className="font-black text-3xl sm:text-4xl tabular-nums">{value}</h3>
      </div>
    </div>
  )
}
