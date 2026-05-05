'use client'
import type { Product } from '@/lib/types/database'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import Image from 'next/image'

export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const cart = useCartStore()
  const [quantity, setQuantity] = useState(1)

  const [ingredients, setIngredients] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    if (product.ingredients) {
      product.ingredients.forEach((ing) => {
        state[ing] = true
      })
    }
    return state
  })

  const [extraNotes, setExtraNotes] = useState('')

  const handleToggle = (ing: string) => {
    setIngredients((prev) => ({ ...prev, [ing]: !prev[ing] }))
  }

  const handleAddToCart = () => {
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
    <div
      className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4 overscroll-none touch-pan-y"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-card w-full sm:w-[500px] rounded-t-2xl sm:rounded-2xl max-h-[min(94dvh,calc(100dvh-0.5rem))] h-[min(94dvh,calc(100dvh-0.5rem))] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom-10 duration-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top,0px))] right-3 z-10 min-h-11 min-w-11 touch-manipulation bg-card/95 border border-border text-foreground rounded-xl flex items-center justify-center hover:bg-muted transition-colors sm:top-3 sm:min-h-10 sm:min-w-10"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="w-full h-[220px] sm:h-[280px] relative bg-muted shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 500px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="modal-scroll px-5 -mt-4 relative z-10 flex-1 min-h-0 overflow-y-auto pb-4">
          <h2 id="product-modal-title" className="text-2xl font-semibold text-foreground tracking-tight mb-2">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{product.description}</p>
          )}

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Personalizá el pedido (desmarcá lo que no quieras)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {product.ingredients.map((ing) => (
                  <label
                    key={ing}
                    className="flex min-h-11 items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/40 transition-colors touch-manipulation"
                  >
                    <span className={`text-sm font-medium ${!ingredients[ing] ? 'line-through text-muted-foreground' : ''}`}>
                      {ing}
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={ingredients[ing]} onChange={() => handleToggle(ing)} />
                      <div className="w-10 h-5 bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border after:border-border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {product.category_id !== 'cat-3' && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Aclaraciones (opcional)</h3>
              <textarea
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-ring/30 outline-none resize-none text-sm placeholder:text-muted-foreground"
                rows={2}
                placeholder={
                  product.category_id === 'cat-1'
                    ? 'Ej. punto de cocción, salsas…'
                    : product.category_id === 'cat-2'
                      ? 'Ej. sin sal, bien cocidas…'
                      : product.category_id === 'cat-4'
                        ? 'Ej. compartir, cubiertos…'
                        : 'Otras indicaciones…'
                }
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-muted rounded-xl p-1.5 border border-border">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="min-h-12 min-w-12 touch-manipulation flex items-center justify-center text-xl font-medium bg-card rounded-lg border border-border hover:bg-muted transition-colors sm:min-h-10 sm:min-w-10"
              >
                −
              </button>
              <span className="font-semibold text-lg w-10 text-center tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="min-h-12 min-w-12 touch-manipulation flex items-center justify-center text-xl font-medium bg-card rounded-lg border border-border hover:bg-muted transition-colors sm:min-h-10 sm:min-w-10"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 pb-safe border-t border-border bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full min-h-12 touch-manipulation py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-[0.95] transition-opacity shadow-sm active:scale-[0.99]"
          >
            Agregar al pedido · ${(product.price * quantity).toLocaleString('es-AR')}
          </button>
        </div>
      </div>
    </div>
  )
}
