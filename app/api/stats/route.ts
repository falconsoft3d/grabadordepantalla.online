import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener contadores de la base de datos
    const [userCount, videoCount] = await Promise.all([
      prisma.user.count(),
      prisma.video.count()
    ])

    return NextResponse.json({
      users: userCount,
      videos: videoCount
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
