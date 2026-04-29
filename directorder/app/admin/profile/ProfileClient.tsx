'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileCredentialsAction } from '@/lib/actions/profile'

export default function ProfileClient({
  restaurantName,
  initialEmail,
}: {
  restaurantName: string
  initialEmail: string
}) {
  const router = useRouter()
  const [showEditOptions, setShowEditOptions] = useState(false)
  const [editMode, setEditMode] = useState<'none' | 'email' | 'password'>('none')
  const [email, setEmail] = useState(initialEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const resetEditingState = () => {
    setShowEditOptions(false)
    setEditMode('none')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setEmail(initialEmail)
  }

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-[900px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{restaurantName}</h1>
        <p className="text-muted-foreground font-semibold text-base sm:text-lg text-foreground/60">
          Perfil de la cuenta y datos de acceso
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form
        action={(formData) =>
          startTransition(async () => {
            setError('')
            setSuccess('')
            const res = await updateProfileCredentialsAction(formData)
            if (res?.error) {
              setError(res.error)
              return
            }
            setSuccess('Perfil actualizado correctamente.')
            setShowEditOptions(false)
            setEditMode('none')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
            router.refresh()
          })
        }
        className="rounded-[2rem] border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 sm:p-7 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black tracking-tight">Datos para ingresar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                if (showEditOptions) {
                  resetEditingState()
                } else {
                  setShowEditOptions(true)
                }
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-background/70 border-border hover:bg-muted/40"
            >
              {showEditOptions ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-foreground/80">Email de acceso</span>
          <div className="flex items-center gap-2">
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={editMode !== 'email'}
              className="flex-1 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 disabled:opacity-70"
              required
            />
            {showEditOptions && (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setEditMode('email')
                }}
                className={`shrink-0 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  editMode === 'email'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-foreground/10'
                }`}
              >
                Editar email
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-foreground/80">Contraseña</span>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value="********"
              disabled
              className="flex-1 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 opacity-70"
            />
            {showEditOptions && (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setEditMode('password')
                }}
                className={`shrink-0 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  editMode === 'password'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-foreground/10'
                }`}
              >
                Editar contraseña
              </button>
            )}
          </div>
        </div>

        {editMode === 'password' && (
          <>
            <input type="hidden" name="email" value={email} />
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground/80">Contraseña actual (verificación)</span>
              <input
                name="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                placeholder="Solo necesaria si cambiás contraseña"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground/80">Nueva contraseña</span>
              <input
                name="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                placeholder="Minimo 6 caracteres"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground/80">Repetir nueva contraseña</span>
              <input
                name="confirm_new_password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                placeholder="Repetí la nueva contraseña"
              />
            </label>
          </>
        )}

        {editMode !== 'none' && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetEditingState}
              disabled={isPending}
              className="px-5 py-3 rounded-2xl border border-border bg-background/70 font-bold hover:bg-muted/40 disabled:opacity-60"
            >
              Cancelar edición
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
