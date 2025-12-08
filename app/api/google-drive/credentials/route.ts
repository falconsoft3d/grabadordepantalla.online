import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string

    // Obtener credenciales del cuerpo
    const { clientId, clientSecret } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID y Client Secret son requeridos' },
        { status: 400 }
      )
    }

    // Guardar credenciales en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleClientId: clientId,
        googleClientSecret: clientSecret
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving Google credentials:', error)
    return NextResponse.json(
      { error: 'Error al guardar credenciales de Google' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      hasCredentials: !!(user.googleClientId && user.googleClientSecret),
      clientId: user.googleClientId || null
    })
  } catch (error) {
    console.error('Error getting Google credentials:', error)
    return NextResponse.json(
      { error: 'Error al obtener credenciales de Google' },
      { status: 500 }
    )
  }
}
