import Link from 'next/link'
import LandingRegister from '@/components/landing/LandingRegister'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-6 sm:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex justify-center items-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
            D
          </div>
          <span className="font-extrabold text-2xl tracking-tight">DirectOrder</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2.5 rounded-xl font-bold text-white/80 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <a
            href="#crear-cuenta"
            className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-0.5"
          >
            Comenzar Gratis
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-20 sm:pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium tracking-tight">
            Menú digital y pedidos directos, sin comisiones por pedido
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            Vendé directo.
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 text-transparent bg-clip-text">
              Sin comisiones.
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Menú digital con pedidos por WhatsApp, cocina en tiempo real y panel de analytics. 
            <span className="text-white/90 font-bold"> Todo en un solo lugar.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/demo-burger" className="px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-orange-500/90 to-amber-600/90 text-white shadow-lg shadow-black/20 hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.99]">
              Ver menú de demostración
            </Link>
            <a
              href="#crear-cuenta"
              className="px-8 py-4 rounded-2xl font-extrabold text-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Crear mi cuenta →
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          <FeatureCard
            emoji="📱"
            title="Menú Digital QR"
            description="Tu menú online con fotos, precios y categorías. Cada mesa tiene su código QR. Sin apps, sin descargas."
          />
          <FeatureCard
            emoji="🔥"
            title="Cocina en Tiempo Real"
            description="Panel KDS con drag & drop. Los pedidos llegan al instante. Sonido de alerta para nuevos pedidos."
            highlighted
          />
          <FeatureCard
            emoji="📊"
            title="Analytics Propios"
            description="Ticket promedio, hora pico, productos estrella y fidelización de clientes. Sin depender de terceros."
          />
        </div>

        {/* Crear cuenta en la landing */}
        <section
          id="crear-cuenta"
          className="mt-28 sm:mt-36 scroll-mt-28 max-w-3xl mx-auto text-center"
          aria-labelledby="crear-cuenta-titulo"
        >
          <h2 id="crear-cuenta-titulo" className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Creá tu cuenta <span className="text-orange-400">en segundos</span>
          </h2>
          <p className="text-white/55 font-medium text-lg mb-10 max-w-xl mx-auto">
            Sin tarjeta. Entrá al Centro de Control y configurá tu menú cuando quieras.
          </p>
          <LandingRegister />
        </section>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-16 mt-32 pb-10">
          <Stat value="0%" label="Comisiones" />
          <Stat value="30s" label="Setup inicial" />
          <Stat value="∞" label="Pedidos gratis" />
          <Stat value="24/7" label="Disponible" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/30 font-medium text-sm">
        © {new Date().getFullYear()} DirectOrder — Argentina
      </footer>
    </div>
  )
}

function FeatureCard({ emoji, title, description, highlighted = false }: any) {
  return (
    <div className={`p-8 rounded-3xl border transition-all hover:-translate-y-2 hover:shadow-2xl ${
      highlighted 
        ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20 shadow-lg shadow-orange-500/5' 
        : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
    }`}>
      <span className="text-4xl mb-5 block">{emoji}</span>
      <h3 className="text-xl font-extrabold mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed font-medium">{description}</p>
    </div>
  )
}

function Stat({ value, label }: any) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-400 to-amber-400 text-transparent bg-clip-text">{value}</div>
      <div className="text-white/40 font-bold mt-2 text-sm uppercase tracking-wider">{label}</div>
    </div>
  )
}
