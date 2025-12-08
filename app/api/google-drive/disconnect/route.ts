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

    // Desconectar Google Drive
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting from Google Drive:', error)
    return NextResponse.json(
      { error: 'Error al desconectar de Google Drive' },
      { status: 500 }
    )
  }
}
