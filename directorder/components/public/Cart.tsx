'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import type { Restaurant } from '@/lib/types/database'
import CartModal from './CartModal'

export default function CartBar({ restaurant }: { restaurant: Restaurant }) {
  const [isOpen, setIsOpen] = useState(false)
  const cart = useCartStore()

  if (cart.items.length === 0) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 md:justify-center md:flex pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-full md:max-w-md bg-primary text-primary-foreground rounded-2xl px-5 py-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.22)] flex items-center justify-between hover:opacity-[0.96] transition-opacity active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/15 rounded-lg w-9 h-9 flex items-center justify-center text-sm font-semibold tabular-nums">
              {cart.itemCount()}
            </div>
            <span className="font-semibold text-base tracking-tight">Ver pedido</span>
          </div>
          <span className="font-semibold text-lg tabular-nums">${cart.total()}</span>
        </button>
      </div>

      {isOpen && <CartModal restaurant={restaurant} onClose={() => setIsOpen(false)} />}
    </>
  )
}
