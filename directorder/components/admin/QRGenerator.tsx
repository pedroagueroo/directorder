'use client'
import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRGenerator({ slug }: { slug: string }) {
  const url = useMemo(() => {
    if (typeof window === 'undefined') return `/${slug}`
    return `${window.location.origin}/${slug}`
  }, [slug])
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-card p-8 rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center text-center">
      <h3 className="text-xl font-bold mb-6">QR del Menú</h3>
      
      <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 inline-block">
        <QRCodeSVG
          value={url}
          size={180}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"Q"}
          marginSize={2}
        />
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={handlePrint}
          className="w-full bg-foreground text-background font-bold py-3 rounded-xl hover:bg-foreground/90 transition-colors"
        >
          Imprimir QR
        </button>
        <a 
          href={url} 
          target="_blank" 
          className="w-full bg-muted text-foreground font-bold py-3 rounded-xl hover:bg-muted-foreground/20 transition-colors"
        >
          Ir al Link
        </a>
      </div>
    </div>
  )
}
