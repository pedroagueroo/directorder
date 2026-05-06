'use client'

import { useState, useTransition } from 'react'
import type { InputHTMLAttributes } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/lib/types/database'
import { updateRestaurantSettingsAction } from '@/lib/actions/settings'

type EditableSection = 'local' | 'channels' | 'visual' | null

export default function SettingsClient({
  restaurant,
  branches,
  isOwner,
}: {
  restaurant: Restaurant
  branches: Restaurant[]
  isOwner: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [branchPending, startBranchTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [primaryColor, setPrimaryColor] = useState(restaurant.primary_color)
  const [secondaryColor, setSecondaryColor] = useState(restaurant.secondary_color)
  const [editableSection, setEditableSection] = useState<EditableSection>(null)

  const startEdit = (section: Exclude<EditableSection, null>) => {
    setError('')
    setSuccess('')
    setEditableSection(section)
  }

  const cancelEdit = () => {
    setEditableSection(null)
    setPrimaryColor(restaurant.primary_color)
    setSecondaryColor(restaurant.secondary_color)
    setError('')
    setSuccess('')
  }

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-[1100px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Configuracion</h1>
        <p className="text-muted-foreground font-semibold text-base sm:text-lg text-foreground/60">
          Datos clave del local, canales de venta y sucursales.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <form
          action={(formData) =>
            startTransition(async () => {
              setError('')
              setSuccess('')
              try {
                const res = await updateRestaurantSettingsAction(formData)
                if (res?.error) {
                  setError(res.error)
                  return
                }
                setSuccess('Datos del local guardados.')
                setEditableSection(null)
                router.refresh()
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'No se pudo guardar. Revisá tu conexión e intentá de nuevo.'
                )
              }
            })
          }
        >
          <section className="rounded-[2rem] border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 sm:p-7 space-y-4 shadow-sm">
            <SectionHeader
              title="Datos del local"
              editing={editableSection === 'local'}
              onEdit={() => startEdit('local')}
              onCancel={cancelEdit}
            />
            <input type="hidden" name="section" value="local" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              name="name"
              label="Nombre del local"
              defaultValue={restaurant.name}
              required
              disabled={editableSection !== 'local'}
            />
            <LabeledInput
              name="whatsapp"
              label="Numero de WhatsApp"
              defaultValue={restaurant.whatsapp ?? ''}
              placeholder="Ej: 2235049768 o +5492235049768"
              disabled={editableSection !== 'local'}
            />
            <LabeledInput
              name="address"
              label="Direccion visible"
              defaultValue={restaurant.address ?? ''}
              placeholder="Ej: Av. Colon 1520, Mar del Plata"
              disabled={editableSection !== 'local'}
            />
            <LabeledInput name="currency" label="Moneda (referencia)" defaultValue={restaurant.currency} disabled />
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground/80">Descripcion</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={restaurant.description ?? ''}
              className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
              placeholder="Conta en 1-2 lineas que hace especial a tu local."
              disabled={editableSection !== 'local'}
            />
          </label>
            {editableSection === 'local' && (
              <SectionSaveButton pending={isPending} />
            )}
          </section>
        </form>

        <form
          action={(formData) =>
            startTransition(async () => {
              setError('')
              setSuccess('')
              try {
                const res = await updateRestaurantSettingsAction(formData)
                if (res?.error) {
                  setError(res.error)
                  return
                }
                setSuccess('Canales de atencion guardados.')
                setEditableSection(null)
                router.refresh()
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'No se pudo guardar. Revisá tu conexión e intentá de nuevo.'
                )
              }
            })
          }
        >
          <section className="rounded-[2rem] border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 sm:p-7 space-y-4 shadow-sm">
            <SectionHeader
              title="Canales de atencion"
              editing={editableSection === 'channels'}
              onEdit={() => startEdit('channels')}
              onCancel={cancelEdit}
            />
            <input type="hidden" name="section" value="channels" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput
              name="delivery_fee"
              label="Costo de envio ($)"
              type="number"
              min="0"
              step="100"
              defaultValue={restaurant.delivery_fee}
              disabled={editableSection !== 'channels'}
            />
            <LabeledInput
              name="min_order_amount"
              label="Pedido minimo ($)"
              type="number"
              min="0"
              step="100"
              defaultValue={restaurant.min_order_amount}
              disabled={editableSection !== 'channels'}
            />
            <LabeledInput
              name="avg_prep_minutes"
              label="Tiempo promedio (min)"
              type="number"
              min="1"
              max="180"
              step="1"
              defaultValue={restaurant.avg_prep_minutes}
              disabled={editableSection !== 'channels'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Check
              name="delivery_enabled"
              label="Delivery habilitado"
              defaultChecked={restaurant.delivery_enabled}
              disabled={editableSection !== 'channels'}
            />
            <Check
              name="pickup_enabled"
              label="Retiro habilitado"
              defaultChecked={restaurant.pickup_enabled}
              disabled={editableSection !== 'channels'}
            />
            <Check
              name="table_mode_enabled"
              label="Modo mesa habilitado"
              defaultChecked={restaurant.table_mode_enabled}
              disabled={editableSection !== 'channels'}
            />
            <Check
              name="kds_sound_new_order"
              label="Sonido: pedido nuevo (KDS)"
              defaultChecked={restaurant.kds_sound_new_order ?? true}
              disabled={editableSection !== 'channels'}
            />
            <Check
              name="kds_sound_status_change"
              label="Sonido: cambio de estado (KDS)"
              defaultChecked={restaurant.kds_sound_status_change ?? true}
              disabled={editableSection !== 'channels'}
            />
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground/80">
              Zona para verificar direcciones de delivery (opcional)
            </span>
            <input
              name="delivery_geocode_suffix"
              type="text"
              defaultValue={restaurant.delivery_geocode_suffix ?? ''}
              disabled={editableSection !== 'channels'}
              placeholder="Ej: Mar del Plata, Buenos Aires, Argentina"
              className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm disabled:opacity-60"
            />
            <span className="text-xs text-muted-foreground leading-snug block">
              Si lo dejás vacío, solo pedimos calle y número (sin consultar mapas). Si completás una zona, validamos que
              la dirección exista ahí (OpenStreetMap). Útil para un solo radio de entrega; para otra ciudad escribí la
              zona completa.
            </span>
          </label>
            {editableSection === 'channels' && (
              <SectionSaveButton pending={isPending} />
            )}
          </section>
        </form>

        <form
          action={(formData) =>
            startTransition(async () => {
              setError('')
              setSuccess('')
              try {
                const res = await updateRestaurantSettingsAction(formData)
                if (res?.error) {
                  setError(res.error)
                  return
                }
                setSuccess('Identidad visual guardada.')
                setEditableSection(null)
                router.refresh()
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'No se pudo guardar. Revisá tu conexión e intentá de nuevo.'
                )
              }
            })
          }
        >
          <section className="rounded-[2rem] border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 sm:p-7 space-y-4 shadow-sm">
            <SectionHeader
              title="Identidad visual"
              editing={editableSection === 'visual'}
              onEdit={() => startEdit('visual')}
              onCancel={cancelEdit}
            />
            <input type="hidden" name="section" value="visual" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPickerField
              name="primary_color"
              label="Color primario"
              value={primaryColor}
              onChange={setPrimaryColor}
              disabled={editableSection !== 'visual'}
            />
            <ColorPickerField
              name="secondary_color"
              label="Color secundario"
              value={secondaryColor}
              onChange={setSecondaryColor}
              disabled={editableSection !== 'visual'}
            />
          </div>
            {editableSection === 'visual' && (
              <SectionSaveButton pending={isPending} />
            )}
          </section>
        </form>

        <section className="rounded-[2rem] border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 sm:p-7 space-y-4 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Sucursales</h2>
          <form
            action={(formData) =>
              startBranchTransition(async () => {
                setError('')
                setSuccess('')
                try {
                  const res = await updateRestaurantSettingsAction(formData)
                  if (res?.error) {
                    setError(res.error)
                    return
                  }
                  setSuccess('Sucursal creada correctamente.')
                  router.refresh()
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : 'No se pudo crear la sucursal. Revisá tu conexión e intentá de nuevo.'
                  )
                }
              })
            }
          >
            {isOwner ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LabeledInput
                    name="branch_name"
                    label="Nombre de nueva sucursal"
                    placeholder="Ej. Constitución"
                    required
                  />
                  <LabeledInput name="branch_address" label="Dirección" placeholder="Ej. Av. Constitución 6000" />
                  <LabeledInput name="branch_whatsapp" label="WhatsApp" placeholder="Ej. 2231234567" />
                </div>
                <Check name="branch_share_menu" label="Compartir menú con la sucursal actual" defaultChecked />
                <SectionSaveButton
                  pending={branchPending}
                  label="Crear sucursal"
                  submitName="section"
                  submitValue="branch_create"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Solo el dueño puede crear o eliminar sucursales.</p>
            )}
          </form>

          <div className="pt-2 border-t border-border/60 space-y-2">
            <p className="text-sm font-semibold text-foreground/75">Sucursales de tu marca</p>
            {branches.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  b.id === restaurant.id ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/60'
                }`}
              >
                <div>
                  <p className="font-bold">
                    {b.name} {b.id === restaurant.id ? <span className="text-xs text-primary">(activa)</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /{b.slug} · {b.address || 'Sin dirección'} · {b.whatsapp || 'Sin WhatsApp'}
                  </p>
                </div>
                {isOwner && b.id !== restaurant.id ? (
                  <form
                    action={(formData) =>
                      startBranchTransition(async () => {
                        setError('')
                        setSuccess('')
                        try {
                          const res = await updateRestaurantSettingsAction(formData)
                          if (res?.error) {
                            setError(res.error)
                            return
                          }
                          setSuccess('Sucursal eliminada.')
                          router.refresh()
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'No se pudo eliminar la sucursal. Revisá tu conexión e intentá de nuevo.'
                          )
                        }
                      })
                    }
                    className="shrink-0"
                  >
                    <input type="hidden" name="section" value={`branch_delete:${b.id}`} />
                    <button
                      type="submit"
                      disabled={branchPending}
                      className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 text-sm font-semibold bg-rose-50 hover:bg-rose-100 disabled:opacity-60"
                      onClick={(e) => {
                        if (!confirm(`¿Eliminar sucursal "${b.name}"?`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      {branchPending ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ColorPickerField({
  name,
  label,
  value,
  onChange,
  disabled,
}: {
  name: string
  label: string
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 shadow-sm transition-colors ${
          disabled ? 'opacity-70' : 'hover:bg-muted/40'
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <span
            className="inline-block h-5 w-5 rounded-full border border-border/80"
            style={{ backgroundColor: value }}
          />
          <span className="font-semibold">{value.toUpperCase()}</span>
        </div>
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-11 w-20 cursor-pointer rounded-xl border border-border/80 bg-background p-1.5"
        />
      </div>
    </label>
  )
}

function LabeledInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <input {...inputProps} className="w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3" />
    </label>
  )
}

function Check({
  name,
  label,
  defaultChecked,
  disabled,
}: {
  name: string
  label: string
  defaultChecked: boolean
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 ${disabled ? 'opacity-70' : ''}`}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="h-4 w-4 accent-primary"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}

function SectionHeader({
  title,
  editing,
  onEdit,
  onCancel,
}: {
  title: string
  editing: boolean
  onEdit: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
      <button
        type="button"
        onClick={editing ? onCancel : onEdit}
        className="px-4 py-2 rounded-xl border border-border bg-background/70 text-sm font-semibold hover:bg-muted/40"
      >
        {editing ? 'Cancelar' : 'Editar seccion'}
      </button>
    </div>
  )
}

function SectionSaveButton({
  pending,
  label,
  onClick,
  submitName,
  submitValue,
}: {
  pending: boolean
  label?: string
  onClick?: () => void
  submitName?: string
  submitValue?: string
}) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="submit"
        name={submitName}
        value={submitValue}
        disabled={pending}
        onClick={onClick}
        className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.55)] hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? 'Guardando...' : label || 'Guardar seccion'}
      </button>
    </div>
  )
}
