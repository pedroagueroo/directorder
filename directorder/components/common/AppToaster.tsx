'use client'

import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#fff',
          color: '#1f1f1f',
          fontWeight: 600,
        },
      }}
    />
  )
}
