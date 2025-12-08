import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string

    // Obtener todos los videos del usuario con sus vistas
    const videos = await prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        shortCode: true,
        views: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 100, // Limitar a las últimas 100 vistas
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            referer: true,
            createdAt: true
          }
        }
      }
    })

    // Aplanar las vistas y agregar información del video
    const allViews = videos.flatMap(video => 
      video.views.map(view => ({
        ...view,
        videoId: video.id,
        videoTitle: video.title,
        shortCode: video.shortCode
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ views: allViews })
  } catch (error) {
    console.error('Error fetching views:', error)
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 })
  }
}
