import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string
    const { id: videoId } = await params
    const { shortCode } = await request.json()

    if (!shortCode) {
      return NextResponse.json({ error: 'Código corto requerido' }, { status: 400 })
    }

    // Validar formato (solo letras y números, 4-10 caracteres)
    if (!/^[A-Za-z0-9]{4,10}$/.test(shortCode)) {
      return NextResponse.json(
        { error: 'El código debe tener entre 4 y 10 caracteres alfanuméricos' },
        { status: 400 }
      )
    }

    // Verificar que el video existe y pertenece al usuario
    const video = await prisma.video.findUnique({
      where: { id: videoId, userId }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    // Verificar que el código no esté en uso por otro video
    const existingVideo = await prisma.video.findUnique({
      where: { shortCode: shortCode.toUpperCase() }
    })

    if (existingVideo && existingVideo.id !== videoId) {
      return NextResponse.json(
        { error: 'Este código ya está en uso' },
        { status: 409 }
      )
    }

    // Actualizar el código corto
    await prisma.video.update({
      where: { id: videoId },
      data: {
        shortCode: shortCode.toUpperCase()
      }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const shortLink = `${appUrl}/v/${shortCode.toUpperCase()}`

    return NextResponse.json({
      success: true,
      shortCode: shortCode.toUpperCase(),
      shortLink
    })
  } catch (error) {
    console.error('Error updating short code:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el código corto' },
      { status: 500 }
    )
  }
}
