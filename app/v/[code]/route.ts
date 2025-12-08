import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Buscar video por código corto
    const video = await prisma.video.findUnique({
      where: { shortCode: code }
    })

    if (!video || !video.driveLink) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    // Registrar la visita
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined

    await prisma.$transaction([
      // Crear registro de visita
      prisma.videoView.create({
        data: {
          videoId: video.id,
          ipAddress,
          userAgent,
          referer
        }
      }),
      // Incrementar contador
      prisma.video.update({
        where: { id: video.id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })
    ])

    // Redirigir a Google Drive
    return NextResponse.redirect(video.driveLink, 302)
  } catch (error) {
    console.error('Error en redirección:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
