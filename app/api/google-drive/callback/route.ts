import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getTokensFromCode } from '@/lib/googleDrive'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string

    // Obtener código de autorización
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

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
        { error: 'No se encontraron credenciales de Google configuradas' },
        { status: 400 }
      )
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/google-callback`

    // Intercambiar código por tokens
    const tokens = await getTokensFromCode(code, user.googleClientId, user.googleClientSecret, redirectUri)

    // Guardar tokens en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveConnected: true,
        googleAccessToken: tokens.access_token!,
        googleRefreshToken: tokens.refresh_token!,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error connecting to Google Drive:', error)
    return NextResponse.json(
      { error: 'Error al conectar con Google Drive' },
      { status: 500 }
    )
  }
}
