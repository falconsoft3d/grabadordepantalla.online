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

    return NextResponse.json({ videos })
  } catch (error) {
    console.log(error, 'VIDEOS_GET_ERROR')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    console.log('SESSION:', session)

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('BODY:', body)
    const { title, description, fileName, fileSize, duration, thumbnail } = body

    console.log('Creating video with:', { title, fileName, fileSize, duration: typeof duration, userId: session.userId })

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

    console.log('Video created:', video)
    return NextResponse.json({ video })
  } catch (error) {
    console.error('VIDEO_POST_ERROR:', error)
    return NextResponse.json({ error: 'Error interno', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
