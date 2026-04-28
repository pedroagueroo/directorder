import type { Restaurant } from '@/lib/types/database'
import Image from 'next/image'

export default function MenuHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="relative w-full h-[300px] sm:h-[400px] flex items-end justify-center pb-8 overflow-hidden lg:rounded-b-[2.5rem] shadow-2xl">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${restaurant.banner_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80'})`,
          backgroundColor: restaurant.primary_color || '#e85d04'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto flex flex-col items-center">
        {restaurant.logo_url && (
          <Image 
            src={restaurant.logo_url} 
            alt={restaurant.name}
            width={128}
            height={128}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl mb-4 object-cover"
          />
        )}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="text-white/90 text-sm sm:text-lg font-medium max-w-md drop-shadow">
            {restaurant.description}
          </p>
        )}
        
        <div className="mt-5 flex gap-3">
          {restaurant.is_open ? (
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 text-sm font-semibold backdrop-blur-md shadow-sm">
              ✨ Abierto Ahora
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-100 border border-rose-400/50 text-sm font-semibold backdrop-blur-md shadow-sm">
              🌙 Cerrado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
