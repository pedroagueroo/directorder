'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRGenerator({ slug }: { slug: string }) {
  const url = `http://localhost:3000/${slug}`
  
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
          imageSettings={{
            src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ea580c'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
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
