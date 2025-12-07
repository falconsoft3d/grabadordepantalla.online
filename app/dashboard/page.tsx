'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaVideo, FaSignOutAlt, FaPlus, FaHome, FaFolder, FaTh, FaClock, FaStar, FaTrash, FaCog, FaBars, FaTimes } from 'react-icons/fa'
import ScreenRecorder from '@/components/ScreenRecorder'

interface Video {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  duration?: number
  createdAt: string
  isFavorite?: boolean
}

interface User {
  userId: string
  email: string
  name?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRecorder, setShowRecorder] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

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
      fetchVideos()
    } catch (error) {
      router.push('/login')
    }
  }
  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
        // Cargar favoritos desde localStorage
        const savedFavorites = localStorage.getItem('favorites')
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)))
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = (videoId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(videoId)) {
        newFavorites.delete(videoId)
      } else {
        newFavorites.add(videoId)
      }
      // Guardar en localStorage
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== videoId))
        // También remover de favoritos si está
        if (favorites.has(videoId)) {
          toggleFavorite(videoId)
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Error al eliminar el video')
    }
  } }
  }

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    const title = `Grabación ${new Date().toLocaleString('es')}`
    
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          fileName: `recording-${Date.now()}.webm`,
          fileSize: blob.size,
          duration,
        }),
      })

      if (response.ok) {
        fetchVideos()
        setShowRecorder(false)
      }
    } catch (error) {
      console.error('Error saving video:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/')
        {/* New Recording Button */}
        {!showRecorder && (
          <div className="p-4">
            <button
              onClick={() => setShowRecorder(true)}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition shadow-lg ${sidebarOpen ? 'px-4 py-3' : 'p-3'}`}
            >
              <FaPlus />
              {sidebarOpen && <span>Nueva grabación</span>}
            </button>
          </div>
        )}lassName="text-center">
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
          <button
            onClick={() => setShowRecorder(true)}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition shadow-lg ${sidebarOpen ? 'px-4 py-3' : 'p-3'}`}
          >
            <FaPlus />
            {sidebarOpen && <span>Nueva grabación</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
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
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaFolder className="text-lg" />
                {sidebarOpen && <span>Carpetas</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaClock className="text-lg" />
                {sidebarOpen && <span>Recientes</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaStar className="text-lg" />
                {sidebarOpen && <span>Favoritos</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaTrash className="text-lg" />
                {sidebarOpen && <span>Papelera</span>}
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 space-y-2">
              <Link href="/dashboard" className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaCog />
                <span>Configuración</span>
              </Link>
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
          ) : !showRecorder ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 aspect-video flex items-center justify-center relative">
                    <FaVideo className="text-white text-4xl opacity-50" />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => toggleFavorite(video.id)}
                        className={`${favorites.has(video.id) ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700'} rounded-full p-2 shadow-lg hover:scale-110 transition`}
                      >
                        <FaStar className="text-sm" />
                      </button>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        className="bg-white text-red-600 rounded-full p-2 shadow-lg hover:scale-110 transition"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1">{video.title}</h3>
                      {favorites.has(video.id) && (
                        <FaStar className="text-yellow-500 text-xs flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{formatFileSize(video.fileSize)} · {formatDuration(video.duration)}</p>
                      <p>{new Date(video.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <ScreenRecorder 
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setShowRecorder(false)}
              />
            </div>
          )}

          {/* Videos Grid */}
          {videos.length === 0 && !showRecorder ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
              <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No tienes grabaciones todavía</p>
              <p className="text-gray-500 mb-6">Haz clic en "Nueva grabación" para comenzar</p>
              <button
                onClick={() => setShowRecorder(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2 transition"
              >
                <FaPlus />
                <span>Crear primera grabación</span>
              </button>
            </div>
          ) : !showRecorder ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 aspect-video flex items-center justify-center relative">
                    <FaVideo className="text-white text-4xl opacity-50" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button className="bg-white text-blue-600 rounded-full p-3 shadow-lg hover:scale-110 transition">
                        <FaVideo className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{video.title}</h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{formatFileSize(video.fileSize)} · {formatDuration(video.duration)}</p>
                      <p>{new Date(video.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
