import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadVideoToDrive, refreshAccessToken } from '@/lib/googleDrive'

async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const request = indexedDB.open('GrabadorPantallaDB', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.userId as string
    const { id: videoId } = await params

    // Obtener usuario con tokens de Google Drive
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleDriveConnected: true,
        googleClientId: true,
        googleClientSecret: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true
      }
    })

    if (!user || !user.googleDriveConnected) {
      return NextResponse.json(
        { error: 'Google Drive no está conectado' },
        { status: 400 }
      )
    }

    if (!user.googleClientId || !user.googleClientSecret) {
      return NextResponse.json(
        { error: 'No se encontraron credenciales de Google configuradas' },
        { status: 400 }
      )
    }

    // Obtener video
    const video = await prisma.video.findUnique({
      where: { id: videoId, userId }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    // Si ya está compartido, devolver el enlace existente
    if (video.sharedToDrive && video.driveLink) {
      return NextResponse.json({
        success: true,
        driveLink: video.driveLink,
        driveFileId: video.driveFileId,
        alreadyShared: true
      })
    }

    // Verificar si el token ha expirado y renovarlo si es necesario
    let accessToken = user.googleAccessToken!
    if (user.googleTokenExpiry && new Date(user.googleTokenExpiry) < new Date()) {
      const newTokens = await refreshAccessToken(user.googleClientId, user.googleClientSecret, user.googleRefreshToken!)
      accessToken = newTokens.access_token!

      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: newTokens.access_token!,
          googleTokenExpiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null
        }
      })
    }

    // Obtener el video de IndexedDB (necesitamos implementar esto en el cliente)
    // Por ahora, asumimos que el video se envía en la solicitud
    const { videoBlob } = await request.json()

    if (!videoBlob) {
      return NextResponse.json(
        { error: 'Blob del video no proporcionado' },
        { status: 400 }
      )
    }

    // Convertir base64 a buffer
    const videoBuffer = Buffer.from(videoBlob, 'base64')

    // Subir video a Google Drive
    const driveResult = await uploadVideoToDrive(
      user.googleClientId,
      user.googleClientSecret,
      accessToken,
      user.googleRefreshToken!,
      videoBuffer,
      video.fileName,
      'video/webm'
    )

    // Generar código corto único
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const shortLink = `${appUrl}/v/${shortCode}`

    // Actualizar video en la base de datos
    await prisma.video.update({
      where: { id: videoId },
      data: {
        sharedToDrive: true,
        driveFileId: driveResult.fileId!,
        driveLink: driveResult.webViewLink!,
        shortCode: shortCode
      }
    })

    return NextResponse.json({
      success: true,
      driveLink: driveResult.webViewLink,
      driveFileId: driveResult.fileId,
      shortLink: shortLink,
      shortCode: shortCode
    })
  } catch (error: any) {
    console.error('Error sharing video to Drive:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Error al compartir video en Google Drive' },
      { status: 500 }
    )
  }
}
