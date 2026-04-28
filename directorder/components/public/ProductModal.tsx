'use client'
import type { Product } from '@/lib/types/database'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import Image from 'next/image'

export default function ProductModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const cart = useCartStore()
  const [quantity, setQuantity] = useState(1)
  
  // Initialize all ingredients as checked
  const [ingredients, setIngredients] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    if (product.ingredients) {
      product.ingredients.forEach(ing => {
        state[ing] = true
      })
    }
    return state
  })
  
  const [extraNotes, setExtraNotes] = useState('')

  const handleToggle = (ing: string) => {
    setIngredients(prev => ({ ...prev, [ing]: !prev[ing] }))
  }

  const handleAddToCart = () => {
    // Generate notes based on unchecked ingredients
    const removedIngredients = Object.entries(ingredients)
      .filter(([_, checked]) => !checked)
      .map(([name]) => `Sin ${name}`)
      
    let finalNotes = removedIngredients.join(', ')
    if (extraNotes.trim()) {
      finalNotes = finalNotes ? `${finalNotes} | ${extraNotes}` : extraNotes
    }

    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      notes: finalNotes || undefined
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="bg-background w-full sm:w-[500px] rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-200 overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="w-full h-[250px] sm:h-[300px] relative bg-muted shrink-0">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 500px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🍔</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="px-5 -mt-6 relative z-10 flex-grow overflow-y-auto pb-6">
          <h2 className="text-3xl font-black mb-2">{product.name}</h2>
          {product.description && (
            <p className="text-foreground/70 font-medium mb-4">{product.description}</p>
          )}

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-lg border-b border-border pb-2">Ingredientes (Desmarcar para quitar)</h3>
              <div className="grid grid-cols-1 gap-2">
                {product.ingredients.map(ing => (
                  <label key={ing} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className={`font-semibold ${!ingredients[ing] ? 'line-through text-foreground/40' : ''}`}>
                      {ing}
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={ingredients[ing]} onChange={() => handleToggle(ing)} />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {product.category_id !== 'cat-3' && (
            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-lg border-b border-border pb-2">¿Algo más? (Opcional)</h3>
              <textarea 
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                className="w-full p-4 rounded-2xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none resize-none font-medium placeholder:text-muted-foreground transition-all" 
                rows={2} 
                placeholder={
                  product.category_id === 'cat-1' ? "Ej: La hamburguesa bien cocida, aderezo aparte..." :
                  product.category_id === 'cat-2' ? "Ej: Bien crocantes, sin sal..." :
                  product.category_id === 'cat-4' ? "Ej: Para compartir, cucharitas extra..." :
                  "Aclaraciones adicionales..."
                }
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-4 bg-muted rounded-full p-2 border border-border shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                className="w-10 h-10 flex items-center justify-center text-2xl font-bold bg-background shadow-sm hover:bg-foreground hover:text-background rounded-full transition-all"
              >-</button>
              <span className="font-black text-xl w-6 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)} 
                className="w-10 h-10 flex items-center justify-center text-2xl font-bold bg-background shadow-sm hover:bg-foreground hover:text-background rounded-full transition-all"
              >+</button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border bg-card shrink-0">
          <button 
            onClick={handleAddToCart}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
          >
            Agregar al Carrito • ${(product.price * quantity).toLocaleString('es-AR')}
          </button>
        </div>

      </div>
    </div>
  )
}
