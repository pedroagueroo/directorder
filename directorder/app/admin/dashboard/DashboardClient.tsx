'use client'
import { useDashboardAnalytics } from '@/lib/hooks/useAnalytics'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Utensils, DollarSign, ShoppingCart, Clock } from 'lucide-react'
import QRGenerator from '@/components/admin/QRGenerator'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function DashboardClient({
  restaurantId,
  menuSlug,
}: {
  restaurantId: string
  menuSlug: string
}) {
  const { todaySales, todayOrders, avgTicket, peakHour, topProducts, orderMix } =
    useDashboardAnalytics(restaurantId)

  const hasSalesToday = todayOrders > 0

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
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
      x: { grid: { display: false } },
    },
  }

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg text-foreground/60">
            Ventas y pedidos del día (zona Argentina)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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
        </div>
      </div>

      {!hasSalesToday && (
        <p className="text-sm text-muted-foreground rounded-2xl border border-border bg-muted/30 px-4 py-3">
          Todavía no hay pedidos marcados como entregados hoy. Las métricas se actualizan cuando el equipo
          pasa un pedido a <strong>Entregado</strong> en cocina.
        </p>
      )}

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
