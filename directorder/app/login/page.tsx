'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      const res = await login(formData)
      if (res.error) {
        setError(res.error)
      } else {
        if (res.role === 'owner') {
          router.push('/admin/dashboard')
        } else {
          router.push('/staff')
        }
      }
    } else {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      // Import the register function dynamically or ensure it's imported at the top
      const { register } = await import('@/lib/actions/auth')
      const res = await register(formData)
      
      if (res.error) {
        setError(res.error)
      } else {
        setError('')
        alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex justify-center items-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">
              D
            </div>
            <span className="font-extrabold text-3xl text-white tracking-tight">DirectOrder</span>
          </div>
          <p className="text-white/40 font-medium">
            {mode === 'login' ? 'Ingresá a tu panel de administración' : 'Creá tu cuenta y empezá a vender'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/60 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm font-bold mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-extrabold text-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? '⏳ Cargando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-white/40 hover:text-white/70 font-bold text-sm transition-colors"
            >
              {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-sm mt-8 font-medium">
          © {new Date().getFullYear()} DirectOrder — Hecho con 🧡
        </p>
      </div>
    </div>
  )
}
