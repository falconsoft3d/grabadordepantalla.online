import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string

    // Obtener estado de conexión
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleDriveConnected: true,
        googleTokenExpiry: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      connected: user.googleDriveConnected,
      tokenExpiry: user.googleTokenExpiry
    })
  } catch (error) {
    console.error('Error getting Google Drive status:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado de Google Drive' },
      { status: 500 }
    )
  }
}
