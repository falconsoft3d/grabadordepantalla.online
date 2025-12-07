import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el video pertenece al usuario
    const video = await prisma.video.findUnique({
      where: { id: params.id }
    })

    if (!video || video.userId !== session.userId) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    await prisma.video.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error, 'VIDEO_DELETE_ERROR')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
