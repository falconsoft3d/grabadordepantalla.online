import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      where: {
        userId: session.userId as string
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.log(error, 'VIDEOS_GET_ERROR')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, fileName, fileSize, duration, thumbnail } = body

    const video = await prisma.video.create({
      data: {
        title,
        description,
        fileName,
        fileSize,
        duration,
        thumbnail,
        userId: session.userId as string,
      }
    })

    return NextResponse.json(video)
  } catch (error) {
    console.log(error, 'VIDEO_POST_ERROR')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
