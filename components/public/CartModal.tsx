'use client'
import { useCartStore } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'
import { useState } from 'react'
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/utils/whatsapp'

export default function CartModal({ restaurant, onClose }: { restaurant: Restaurant, onClose: () => void }) {
  const cart = useCartStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState<'delivery' | 'pickup' | 'table'>('delivery')
  const [notes, setNotes] = useState('')

  const handleCheckout = () => {
    if (!name.trim()) return alert('Por favor, ingresa tu nombre.')
    if (type === 'delivery' && !address.trim()) return alert('Por favor, ingresa tu dirección.')
    
    const msg = generateWhatsAppMessage(restaurant, cart.items, {
      customerName: name,
      orderType: type,
      address,
      notes
    })
    
    window.open(getWhatsAppUrl(restaurant.whatsapp || '', msg), '_blank')
    cart.clearCart()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background w-full sm:w-[500px] rounded-t-3xl sm:rounded-3xl h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
        
        <div className="p-5 border-b border-border flex justify-between items-center bg-card rounded-t-3xl sm:rounded-t-3xl shrink-0">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span>🛒</span> Tu Pedido
          </h2>
          <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-border transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-6 flex-grow pb-8">
          <div className="flex flex-col gap-3">
            {cart.items.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-3 rounded-2xl border border-border bg-card shadow-sm">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="font-semibold text-primary/80">${item.price}</p>
                </div>
                <div className="flex items-center gap-3 bg-muted rounded-full p-1 shadow-sm border border-border">
                  <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-lg font-bold text-foreground hover:bg-background rounded-full transition-colors">-</button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => cart.addItem({ ...item, quantity: 1 })} className="w-8 h-8 flex items-center justify-center text-lg font-bold text-foreground hover:bg-background rounded-full transition-colors">+</button>
                </div>
              </div>
            ))}
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

              <div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3.5 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none resize-none font-medium placeholder:text-muted-foreground transition-all" rows={2} placeholder="Aclaraciones para la cocina (opcional)" />
              </div>
            </div>
          </div>
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
