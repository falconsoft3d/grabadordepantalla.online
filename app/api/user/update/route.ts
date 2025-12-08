import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email } = body

    // Verificar si el email ya está en uso por otro usuario
    if (email !== session.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        email,
      },
    })

    return NextResponse.json({
      message: 'Perfil actualizado',
      user: {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
