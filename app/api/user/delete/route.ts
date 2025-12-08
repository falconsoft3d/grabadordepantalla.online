import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(request: Request) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Delete user (videos will be deleted automatically due to cascade)
    await prisma.user.delete({
      where: {
        id: session.userId as string
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('USER_DELETE_ERROR:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 })
  }
}
