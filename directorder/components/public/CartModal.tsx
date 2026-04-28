'use client'
import { useCartStore } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'
import { useState } from 'react'
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/utils/whatsapp'
import { createOrder } from '@/lib/actions/orders'

export default function CartModal({ restaurant, onClose }: { restaurant: Restaurant, onClose: () => void }) {
  const cart = useCartStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState<'delivery' | 'pickup' | 'table'>('delivery')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCheckout = async () => {
    if (!name.trim()) return alert('Por favor, ingresa tu nombre.')
    if (type === 'delivery' && !address.trim()) return alert('Por favor, ingresa tu dirección.')
    
    setIsSubmitting(true)
    try {
      // 1. Crear el pedido en el sistema interno (JSON)
      await createOrder({
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        customerName: name,
        orderType: type,
        deliveryAddress: address,
        items: cart.items,
        notes
      })

      // 2. Generar el mensaje de WhatsApp
      const msg = generateWhatsAppMessage(restaurant, cart.items, {
        customerName: name,
        orderType: type,
        address,
        notes
      })
      
      // 3. Abrir WhatsApp y limpiar
      window.open(getWhatsAppUrl(restaurant.whatsapp || '', msg), '_blank')
      cart.clearCart()
      onClose()
    } catch (e) {
      alert('Hubo un error al procesar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // SUGERENCIA DE VENTA (Upselling) - Solo mostrar si no tienen "Papas Fritas" (prod-5)
  const hasPapas = cart.items.some(i => i.productId === 'prod-5')
  const handleUpsell = () => {
    cart.addItem({
      productId: 'prod-5',
      name: 'Papas Fritas',
      price: 2200,
      quantity: 1
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background w-full sm:w-[500px] rounded-t-3xl sm:rounded-3xl h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
        
        <div className="p-5 border-b border-border flex justify-between items-center bg-card rounded-t-3xl sm:rounded-t-3xl shrink-0">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span>🛒</span> Tu Pedido
          </h2>
          <div className="flex items-center gap-3">
            {cart.items.length > 0 && (
              <button onClick={cart.clearCart} className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors">
                Vaciar
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-border transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-6 flex-grow pb-8">
          <div className="flex flex-col gap-3">
            {cart.items.length === 0 ? (
              <p className="text-center text-foreground/50 py-4 font-medium">El carrito está vacío</p>
            ) : (
              cart.items.map(item => (
                <div key={item.cartItemId} className="flex justify-between items-center p-3 rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex-grow pr-4">
                    <h4 className="font-bold">{item.name}</h4>
                    {item.notes && <p className="text-sm text-foreground/60 italic leading-snug my-0.5">{item.notes}</p>}
                    <p className="font-semibold text-primary/80">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-muted rounded-full p-1 shadow-sm border border-border shrink-0">
                    <button onClick={() => cart.updateQuantity(item.cartItemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-lg font-bold text-foreground hover:bg-background rounded-full transition-colors">-</button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.cartItemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-lg font-bold text-foreground hover:bg-background rounded-full transition-colors">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 pt-5 border-t border-border">
            <h3 className="font-bold text-lg">Detalles de Entrega</h3>
            
            <div className="flex bg-muted p-1.5 rounded-xl">
              <button 
                onClick={() => setType('delivery')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'delivery' ? 'bg-background shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
              >🛵 Delivery</button>
              <button 
                onClick={() => setType('pickup')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'pickup' ? 'bg-background shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
              >🏪 Retiro</button>
              {restaurant.table_mode_enabled && (
                <button 
                  onClick={() => setType('table')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'table' ? 'bg-background shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
                >🪑 Mesa</button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full p-3.5 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none font-medium placeholder:text-muted-foreground transition-all" placeholder="Nombre completo" />
              </div>

              {type === 'delivery' && (
                <div>
                  <input value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full p-3.5 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none font-medium placeholder:text-muted-foreground transition-all" placeholder="Dirección exacta (Calle, Número...)" />
                </div>
              )}
            </div>
          </div>

          {!hasPapas && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
              <div>
                <p className="font-bold text-orange-600 dark:text-orange-400">¿Agregamos papas fritas? 🍟</p>
                <p className="text-sm text-orange-600/80 dark:text-orange-400/80">Por solo $2.200</p>
              </div>
              <button 
                onClick={handleUpsell}
                className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-orange-600 transition-colors shrink-0"
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        <div className="p-5 bg-card border-t border-border sm:rounded-b-3xl shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="font-bold text-lg text-foreground/70">Total a pagar:</span>
            <span className="font-extrabold text-3xl">${cart.total()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full py-4 text-white bg-[#25D366] hover:bg-[#128C7E] rounded-2xl font-bold flex justify-center items-center gap-2 transition-all text-lg shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <span>Pedir por WhatsApp</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
        </div>
        
      </div>
    </div>
  )
}
