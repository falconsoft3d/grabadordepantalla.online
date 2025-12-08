'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaVideo, FaArrowLeft, FaSave, FaSignOutAlt, FaPlus, FaHome, FaTh, FaBars, FaTrash } from 'react-icons/fa'

interface User {
  userId: string
  email: string
  name?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me')
      const data = await response.json()
      
      if (!data.user) {
        router.push('/login')
        return
      }
      
      setUser(data.user)
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar perfil' })
        setIsSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      setUser(prev => prev ? { ...prev, name: formData.name, email: formData.email } : null)
      setIsSaving(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar perfil' })
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      setIsSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al cambiar contraseña' })
        setIsSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsSaving(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar contraseña' })
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción no se puede deshacer. Se eliminarán:\n- Tu perfil\n- Todos tus videos\n- Todos tus datos'
    )

    if (!confirmed) return

    const doubleConfirm = confirm(
      'Esta es tu última oportunidad.\n\n¿Realmente quieres eliminar tu cuenta permanentemente?'
    )

    if (!doubleConfirm) return

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Error al eliminar cuenta' })
        setIsSaving(false)
        return
      }

      // Logout and redirect
      await fetch('/api/logout', { method: 'POST' })
      router.push('/?deleted=true')
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar cuenta' })
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaVideo className="text-white text-sm" />
                </div>
                <span className="font-bold text-gray-900">GrabadorPantalla</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaBars />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 mx-auto">
              <FaBars />
            </button>
          )}
        </div>

        {/* New Recording Button */}
        <div className="p-4">
          <Link
            href="/dashboard"
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition shadow-lg ${sidebarOpen ? 'px-4 py-3' : 'p-3'}`}
          >
            <FaPlus />
            {sidebarOpen && <span>Nueva grabación</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaHome className="text-lg" />
                {sidebarOpen && <span className="font-medium">Inicio</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaTh className="text-lg" />
                {sidebarOpen && <span>Biblioteca</span>}
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <Link href="/dashboard/settings" className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} bg-blue-50 rounded-lg p-2 transition cursor-pointer`}>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </Link>
          {sidebarOpen && (
            <div className="mt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
            <p className="text-gray-600">Gestiona tu perfil y seguridad</p>
          </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Perfil</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaSave />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaSave />
              <span>{isSaving ? 'Guardando...' : 'Cambiar Contraseña'}</span>
            </button>
          </form>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Zona Peligrosa</h2>
          <p className="text-gray-600 mb-4">Una vez que elimines tu cuenta, no hay vuelta atrás. Se eliminarán permanentemente todos tus datos y videos.</p>
          <button
            onClick={handleDeleteAccount}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FaTrash />
            <span>{isSaving ? 'Eliminando...' : 'Eliminar mi cuenta'}</span>
          </button>
        </div>
        </div>
      </main>
    </div>
  )
}
