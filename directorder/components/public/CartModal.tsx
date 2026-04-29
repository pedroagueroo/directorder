'use client'
import { useCartStore } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'
import { useRef, useState } from 'react'
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/utils/whatsapp'
import { createOrder } from '@/lib/actions/orders'
import { validateMarDelPlataAddress } from '@/lib/actions/validateAddress'
import { validateAddressFormat } from '@/lib/utils/address'
import toast from 'react-hot-toast'

export default function CartModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const cart = useCartStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState<'delivery' | 'pickup' | 'table'>('delivery')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState('')
  const [addressError, setAddressError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  const handleCheckout = async () => {
    setNameError('')
    setAddressError('')

    if (cart.items.length === 0) return
    if (!restaurant.is_open) {
      toast.error('El local esta cerrado en este momento.')
      return
    }

    if (!name.trim()) {
      setNameError('Ingresá tu nombre para continuar.')
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nameInputRef.current?.focus()
      return
    }

    if (type === 'delivery') {
      const format = validateAddressFormat(address)
      if (!format.ok) {
        setAddressError(format.message)
        addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        addressInputRef.current?.focus()
        return
      }
    }

    if (!hasWhatsAppConfigured) {
      toast.error('Este local no tiene WhatsApp configurado.')
      return
    }

    setIsSubmitting(true)
    try {
      if (type === 'delivery') {
        const geo = await validateMarDelPlataAddress(address)
        if (!geo.ok) {
          setAddressError(geo.message)
          addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          addressInputRef.current?.focus()
          return
        }
      }

      const deliveryAddress = type === 'delivery' ? address.trim() : undefined
      const orderNotes = type === 'delivery' && notes.trim() ? notes.trim() : undefined
      const deliveryFee =
        type === 'delivery' && restaurant.delivery_enabled !== false
          ? Number((restaurant as { delivery_fee?: number }).delivery_fee) || 0
          : 0

      const result = await createOrder({
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        customerName: name,
        orderType: type,
        deliveryAddress,
        items: cart.items,
        notes: orderNotes
      })
      toast.success(`Pedido #${result.orderNumber} creado correctamente`)

      const msg = generateWhatsAppMessage(restaurant, cart.items, {
        customerName: name,
        orderType: type,
        address: deliveryAddress,
        notes: orderNotes,
        deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      })

      setTimeout(() => {
        window.open(getWhatsAppUrl(restaurant.whatsapp || '', msg), '_blank')
      }, 450)
      cart.clearCart()
      onClose()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Hubo un error al procesar el pedido.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasPapas = cart.items.some((i) => i.productId === 'prod-5')
  const handleUpsell = () => {
    cart.addItem({
      productId: 'prod-5',
      name: 'Papas Fritas',
      price: 2200,
      quantity: 1
    })
  }

  const isDelivery = type === 'delivery'
  const submitBusyLabel = isDelivery && isSubmitting ? 'Verificando dirección…' : isSubmitting ? 'Enviando…' : null
  const hasWhatsAppConfigured = !!restaurant.whatsapp?.replace(/\D/g, '')
  const subtotal = cart.total()
  const deliveryFeeEstimate =
    isDelivery && restaurant.delivery_enabled !== false
      ? Number((restaurant as { delivery_fee?: number }).delivery_fee) || 0
      : 0
  const totalWithDelivery = subtotal + deliveryFeeEstimate

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-in fade-in duration-200 overscroll-none touch-pan-y"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-card w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl max-h-[min(92dvh,calc(100dvh-0.5rem))] h-[min(92dvh,calc(100dvh-0.5rem))] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom-10 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
      >
        <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 id="cart-modal-title" className="text-lg font-semibold text-foreground tracking-tight">
              Tu pedido
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Revisá los datos antes de enviar</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={cart.clearCart}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-scroll overflow-y-auto p-5 flex flex-col gap-6 flex-1 min-h-0 pb-6">
          <div className="flex flex-col gap-3">
            {cart.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">El carrito está vacío</p>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between items-center p-4 rounded-xl border border-border bg-background/50"
                >
                  <div className="flex-grow pr-4 min-w-0">
                    <h4 className="font-semibold text-foreground">{item.name}</h4>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{item.notes}</p>
                    )}
                    <p className="text-sm font-medium text-primary mt-2">${item.price} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/80 rounded-xl p-1 border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => cart.updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="min-h-11 min-w-11 touch-manipulation flex items-center justify-center text-lg font-medium text-foreground hover:bg-card rounded-lg transition-colors sm:min-h-9 sm:min-w-9"
                    >
                      −
                    </button>
                    <span className="font-semibold w-8 text-center tabular-nums text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="min-h-11 min-w-11 touch-manipulation flex items-center justify-center text-lg font-medium text-foreground hover:bg-card rounded-lg transition-colors sm:min-h-9 sm:min-w-9"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="font-semibold text-foreground">Entrega</h3>

            <div
              className={`grid gap-1.5 p-1 bg-muted rounded-xl border border-border ${restaurant.table_mode_enabled ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              <button
                type="button"
                onClick={() => {
                  setType('delivery')
                  setAddressError('')
                }}
                className={`min-h-11 touch-manipulation py-2.5 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                  type === 'delivery' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('pickup')
                  setAddressError('')
                }}
                className={`min-h-11 touch-manipulation py-2.5 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                  type === 'pickup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Retiro
              </button>
              {restaurant.table_mode_enabled && (
                <button
                  type="button"
                  onClick={() => {
                    setType('table')
                    setAddressError('')
                  }}
                  className={`min-h-11 touch-manipulation py-2.5 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                    type === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mesa
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="checkout-name" className="sr-only">
                  Nombre
                </label>
                <input
                  ref={nameInputRef}
                  id="checkout-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (nameError) setNameError('')
                  }}
                  type="text"
                  className={`w-full p-3.5 rounded-xl border bg-background focus:ring-2 focus:ring-ring/30 outline-none text-sm placeholder:text-muted-foreground transition-all ${
                    nameError ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-border'
                  }`}
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'checkout-name-error' : undefined}
                />
                {nameError && (
                  <p id="checkout-name-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                    {nameError}
                  </p>
                )}
              </div>

              {isDelivery && (
                <>
                  <div>
                    <label htmlFor="checkout-address" className="sr-only">
                      Dirección en Mar del Plata
                    </label>
                    <input
                      ref={addressInputRef}
                      id="checkout-address"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value)
                        if (addressError) setAddressError('')
                      }}
                      type="text"
                      className={`w-full p-3.5 rounded-xl border bg-background focus:ring-2 focus:ring-ring/30 outline-none text-sm placeholder:text-muted-foreground transition-all ${
                        addressError ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-border'
                      }`}
                      placeholder="Ej. San Martín 1850 (calle y número)"
                      autoComplete="street-address"
                      aria-invalid={!!addressError}
                      aria-describedby={addressError ? 'checkout-address-error' : 'checkout-address-hint'}
                    />
                    <p id="checkout-address-hint" className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                      Calle y número obligatorios. Comprobamos la ubicación en Mar del Plata (OpenStreetMap).
                    </p>
                    {addressError && (
                      <p id="checkout-address-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                        {addressError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-notes" className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Notas para el local (opcional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full p-3.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-ring/30 outline-none text-sm placeholder:text-muted-foreground resize-none"
                      placeholder="Ej. timbre, referencias, horario…"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {!hasPapas && (
            <div className="bg-muted/50 border border-border p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground text-sm">¿Agregamos papas fritas?</p>
                <p className="text-sm text-muted-foreground mt-0.5">$2.200</p>
              </div>
              <button
                type="button"
                onClick={handleUpsell}
                className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shrink-0"
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        <div className="p-5 pb-safe border-t border-border bg-muted/20 sm:rounded-b-2xl shrink-0 space-y-3">
          <div className="space-y-1.5 px-0.5">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Envío</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {deliveryFeeEstimate > 0
                  ? `$${deliveryFeeEstimate.toLocaleString('es-AR')}`
                  : '$0'}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
              <span className="font-semibold text-2xl tabular-nums text-foreground">
                ${totalWithDelivery.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={cart.items.length === 0 || isSubmitting || !restaurant.is_open || !hasWhatsAppConfigured}
            onClick={handleCheckout}
            className="w-full min-h-12 touch-manipulation py-3.5 rounded-xl font-semibold text-[15px] flex justify-center items-center gap-2 transition-opacity bg-[#128C7E] text-white hover:bg-[#0f7a6e] disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-[0.99]"
          >
            <span>
              {!hasWhatsAppConfigured
                ? 'Configurar WhatsApp del local'
                : !restaurant.is_open
                ? 'Local cerrado'
                : submitBusyLabel ?? 'Enviar pedido por WhatsApp'}
            </span>
            {!isSubmitting && (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            )}
          </button>
          <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-1">
            {!hasWhatsAppConfigured
              ? 'Falta configurar el número de WhatsApp del local para poder enviar pedidos.'
              : isDelivery
              ? 'La dirección de delivery se valida con mapa abierto; el repartidor puede confirmar al llegar.'
              : 'El pedido se envía por WhatsApp al local.'}
          </p>
        </div>
      </div>
    </div>
  )
}
