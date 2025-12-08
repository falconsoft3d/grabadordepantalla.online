import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { deleteFileFromDrive, refreshAccessToken } from '@/lib/googleDrive'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: {
        id: params.id,
        userId: session.userId
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.log(error, 'VIDEO_GET_ERROR')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

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
      where: { id: params.id },
      include: {
        user: {
          select: {
            googleDriveConnected: true,
            googleClientId: true,
            googleClientSecret: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true
          }
        }
      }
    })

    if (!video || video.userId !== session.userId) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    // Si el video está compartido en Drive, eliminarlo también
    if (video.sharedToDrive && video.driveFileId && video.user.googleDriveConnected) {
      try {
        if (!video.user.googleClientId || !video.user.googleClientSecret) {
          console.warn('Missing Google credentials for Drive deletion')
        } else {
          let accessToken = video.user.googleAccessToken!
          
          // Verificar si el token ha expirado y renovarlo si es necesario
          if (video.user.googleTokenExpiry && new Date(video.user.googleTokenExpiry) < new Date()) {
            const newTokens = await refreshAccessToken(
              video.user.googleClientId,
              video.user.googleClientSecret,
              video.user.googleRefreshToken!
            )
            accessToken = newTokens.access_token!

            await prisma.user.update({
              where: { id: session.userId },
              data: {
                googleAccessToken: newTokens.access_token!,
                googleTokenExpiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null
              }
            })
          }

          await deleteFileFromDrive(
            video.user.googleClientId,
            video.user.googleClientSecret,
            accessToken,
            video.user.googleRefreshToken!,
            video.driveFileId
          )
        }
      } catch (driveError) {
        console.error('Error deleting from Drive:', driveError)
        // Continuar con la eliminación de la base de datos aunque falle Drive
      }
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
