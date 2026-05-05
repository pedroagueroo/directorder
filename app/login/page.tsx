'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/lib/actions/auth'
import Link from 'next/link'
import RegisterAccountForm from '@/components/auth/RegisterAccountForm'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const isLogin = mode === 'login'

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const res = await login(formData)
      if (!res || typeof res !== 'object') {
        setError('Respuesta inválida del servidor. Refrescá la página e intentá de nuevo.')
        return
      }
      if ('error' in res && res.error) {
        setError(String(res.error))
        return
      }
      const roleRaw = 'role' in res ? String(res.role) : 'owner'
      const needsBranchSelection =
        'needsBranchSelection' in res && Boolean((res as { needsBranchSelection?: boolean }).needsBranchSelection)
      const dest = needsBranchSelection
        ? '/select-branch'
        : roleRaw === 'owner'
          ? '/admin/dashboard'
          : '/staff'
      window.location.assign(dest)
    } catch (e) {
      const detail = e instanceof Error ? e.message : ''
      setError(
        detail
          ? `Error de conexión: ${detail}`
          : 'No se pudo iniciar sesión (red o servidor). Probá de nuevo.'
      )
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[500px] rounded-full bg-amber-500/8 blur-[100px]" />

      <div className={`w-full relative z-10 ${isLogin ? 'max-w-md' : 'max-w-lg'}`}>
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              ← Volver a la landing
            </Link>
          </div>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex justify-center items-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">
              D
            </div>
            <span className="font-extrabold text-3xl text-white tracking-tight">DirectOrder</span>
          </div>
          <p className="text-white/40 font-medium">
            {isLogin ? 'Ingresá a tu panel de administración' : 'Creá tu cuenta con los datos de tu local'}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              isLogin ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              !isLogin ? 'bg-orange-500 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Card */}
        <div
          className={`backdrop-blur-xl border rounded-3xl p-8 shadow-2xl transition-all ${
            isLogin
              ? 'bg-white/[0.04] border-white/[0.08]'
              : 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-300/30 shadow-orange-500/20'
          }`}
        >
          {!isLogin && (
            <div className="mb-5 rounded-2xl border border-orange-300/30 bg-orange-500/10 p-4">
              <p className="text-sm font-extrabold text-orange-100">Tu cuenta incluye desde el día 1:</p>
              <p className="mt-1 text-sm text-orange-200/90">
                Menú online, pedidos por WhatsApp, KDS y Centro de Control. El nombre del local define la URL pública
                de tu menú (se puede ajustar en configuración).
              </p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-white/60 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-extrabold text-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
              >
                {loading ? '⏳ Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <RegisterAccountForm variant="login" submitLabel="Crear cuenta" showLoginLink={false} />
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? 'register' : 'login')
                setError('')
              }}
              className="text-white/40 hover:text-white/70 font-bold text-sm transition-colors"
            >
              {isLogin ? '¿Primera vez en DirectOrder? Crear cuenta' : 'Ya tengo cuenta, quiero iniciar sesión'}
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
