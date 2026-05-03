'use client'

import RegisterAccountForm from '@/components/auth/RegisterAccountForm'

export default function LandingRegister() {
  return (
    <div className="max-w-lg mx-auto rounded-3xl border border-orange-400/25 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-8 sm:p-10 shadow-2xl shadow-black/30">
      <div className="mb-6 rounded-2xl border border-orange-300/25 bg-orange-500/10 p-4 text-left">
        <p className="text-sm font-extrabold text-orange-100">Incluye desde el día 1</p>
        <p className="mt-1 text-sm text-orange-100/85">Menú online, pedidos por WhatsApp, KDS y Centro de Control.</p>
      </div>

      <RegisterAccountForm variant="landing" submitLabel="Crear cuenta gratis" showLoginLink />
    </div>
  )
}
