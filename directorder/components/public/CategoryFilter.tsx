'use client'
import { useState } from 'react'

export default function CategoryFilter({ categories }: { categories: any[] }) {
  const [activeId, setActiveId] = useState(categories?.[0]?.id)
  
  if (!categories || categories.length === 0) return null

  const handleScroll = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(`cat-${id}`)
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
    }
  }

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border py-4 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleScroll(cat.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-semibold transition-all shadow-sm ${
                activeId === cat.id 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-muted text-foreground/80 hover:bg-muted/80'
              }`}
            >
              {cat.emoji && <span className="mr-2">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
