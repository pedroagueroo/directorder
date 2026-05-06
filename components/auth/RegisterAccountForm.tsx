'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'

const inputClass =
  'w-full p-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all font-medium'

type Props = {
  /** "landing" = botón blanco; "login" = mismo estilo que la tarjeta de login */
  variant?: 'landing' | 'login'
  submitLabel?: string
  showLoginLink?: boolean
}

export default function RegisterAccountForm({
  variant = 'landing',
  submitLabel = 'Crear cuenta',
  showLoginLink = true,
}: Props) {
  const honeypotId = useId()
  /** Honeypot solo en estado React: si leemos el DOM, autofill/extensiones pueden llenar el input oculto y el servidor lo rechaza. */
  const [honeypot, setHoneypot] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }
    if (!terms) {
      setError('Tenés que aceptar los términos para continuar.')
      setLoading(false)
      return
    }

    let navigatedAway = false
    try {
      const formData = new FormData()
      formData.append('restaurant_name', restaurantName)
      formData.append('owner_name', ownerName)
      formData.append('whatsapp', whatsapp)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('confirm_password', confirmPassword)
      formData.append('terms', terms ? 'on' : 'off')
      formData.append('_company_website', honeypot)

      const res = await register(formData)
      if (!res || typeof res !== 'object') {
        setError('Respuesta inválida del servidor. Refrescá la página e intentá de nuevo.')
        return
      }
      const errMsg = 'error' in res ? res.error : undefined
      if (errMsg != null && String(errMsg).trim() !== '') {
        setError(String(errMsg))
        return
      }
      if ('role' in res) {
        const dest = res.role === 'owner' ? '/admin/dashboard' : '/staff'
        navigatedAway = true
        window.location.assign(dest)
      } else {
        setError('No se pudo crear la cuenta. Probá de nuevo.')
      }
    } catch {
      setError('No se pudo crear la cuenta. Probá de nuevo.')
    } finally {
      if (!navigatedAway) {
        setLoading(false)
      }
    }
  }

  const buttonClass =
    variant === 'login'
      ? 'w-full py-4 rounded-xl font-extrabold text-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] bg-white text-gray-900 hover:bg-orange-50'
      : 'w-full py-4 rounded-xl font-extrabold text-lg bg-white text-gray-900 hover:bg-orange-50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg'

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5 text-left">
      <div className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor={honeypotId}>No completar</label>
        <input
          type="text"
          id={honeypotId}
          name="_company_website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          data-lpignore="true"
          data-1p-ignore
          data-bwignore
        />
      </div>

      <div>
        <label htmlFor="reg-restaurant" className="block text-white/60 text-sm font-bold mb-2">
          Nombre del local
        </label>
        <input
          id="reg-restaurant"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className={inputClass}
          placeholder="Ej. Hamburguesería El Patio"
          required
          minLength={2}
          maxLength={80}
          autoComplete="organization"
        />
      </div>

      <div>
        <label htmlFor="reg-owner" className="block text-white/60 text-sm font-bold mb-2">
          Tu nombre y apellido (titular de la cuenta)
        </label>
        <input
          id="reg-owner"
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className={inputClass}
          placeholder="Ej. Juan Pérez"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="reg-whatsapp" className="block text-white/60 text-sm font-bold mb-2">
          WhatsApp del local <span className="text-white/35 font-normal">(opcional, recomendado)</span>
        </label>
        <input
          id="reg-whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className={inputClass}
          placeholder="Código de área + número, ej. 2235551234"
          autoComplete="tel"
        />
        <p className="mt-1.5 text-xs text-white/40">Lo usamos para el menú público y los pedidos. Podés editarlo después.</p>
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-white/60 text-sm font-bold mb-2">
          Email de acceso
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-white/60 text-sm font-bold mb-2">
          Contraseña
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="reg-password2" className="block text-white/60 text-sm font-bold mb-2">
          Repetí la contraseña
        </label>
        <input
          id="reg-password2"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          placeholder="Igual que la contraseña"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-1.5 h-4 w-4 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/50"
        />
        <span className="text-sm text-white/55 leading-snug">
          Acepto los datos ingresados y confirmo que represento al comercio indicado. Entiendo que esta cuenta es para
          gestionar el negocio en DirectOrder.
        </span>
      </label>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? 'Creando cuenta…' : submitLabel}
      </button>

      {showLoginLink && (
        <p className="pt-2 text-center text-white/45 text-sm font-semibold">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-orange-300 hover:text-orange-200 underline underline-offset-2">
            Iniciar sesión
          </Link>
        </p>
      )}
    </form>
  )
}
