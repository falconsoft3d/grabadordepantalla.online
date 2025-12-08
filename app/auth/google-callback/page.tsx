'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError('Error al conectar con Google Drive: ' + errorParam)
        setTimeout(() => {
          window.close()
        }, 3000)
        return
      }

      if (!code) {
        setError('No se recibió el código de autorización')
        setTimeout(() => {
          window.close()
        }, 3000)
        return
      }

      try {
        const response = await fetch('/api/google-drive/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        })

        if (!response.ok) {
          throw new Error('Error al procesar la autorización')
        }

        // Cerrar la ventana popup y notificar al padre
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_DRIVE_CONNECTED' }, '*')
        }
        window.close()
      } catch (err) {
        setError('Error al conectar con Google Drive')
        console.error('Callback error:', err)
        setTimeout(() => {
          window.close()
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {error ? (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Esta ventana se cerrará automáticamente...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conectando con Google Drive</h2>
            <p className="text-gray-600">Por favor espera...</p>
          </div>
        )}
      </div>
    </div>
  )
}
