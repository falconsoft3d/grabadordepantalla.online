import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAuthUrl } from '@/lib/googleDrive'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string

    // Obtener credenciales del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleClientId: true,
        googleClientSecret: true
      }
    })

    if (!user || !user.googleClientId || !user.googleClientSecret) {
      return NextResponse.json(
        { error: 'Primero debes configurar tus credenciales de Google Drive' },
        { status: 400 }
      )
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/google-callback`
    const authUrl = getAuthUrl(user.googleClientId, user.googleClientSecret, redirectUri)
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: 'Error al generar URL de autenticación' },
      { status: 500 }
    )
  }
}
