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
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-full md:w-[400px] bg-primary text-primary-foreground rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-between hover:bg-primary/95 transition-all hover:-translate-y-1 active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {cart.itemCount()}
            </div>
            <span className="font-bold text-lg tracking-wide">VER PEDIDO</span>
          </div>
          <span className="font-extrabold text-xl drop-shadow-md">
            ${cart.total()}
          </span>
        </button>
      </div>
      
      {isOpen && (
        <CartModal 
          restaurant={restaurant} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
