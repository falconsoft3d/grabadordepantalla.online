'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaDownload, FaTrash, FaStar, FaRegStar, FaVideo, FaSignOutAlt, FaHome, FaFolder, FaCog, FaBars, FaTimes } from 'react-icons/fa'

interface Video {
  id: string
  title: string
  fileName: string
  fileSize: number
  duration: number
  thumbnail?: string
  createdAt: string
}

interface User {
  userId: string
  email: string
  name?: string
}

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadVideo()
    loadFavorites()
    checkAuth()
  }, [params.id])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me')
      const data = await response.json()
      
      if (data.error) {
        router.push('/login')
        return
      }
      
      setUser(data)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  const loadFavorites = () => {
    const stored = localStorage.getItem('favoriteVideos')
    if (stored) {
      const favorites = new Set(JSON.parse(stored))
      setIsFavorite(favorites.has(params.id))
    }
  }

  const loadVideo = async () => {
    try {
      setLoading(true)
      
      // Obtener información del video
      const response = await fetch(`/api/videos/${params.id}`)
      if (!response.ok) {
        throw new Error('Video no encontrado')
      }
      
      const data = await response.json()
      setVideo(data.video)

      // Obtener el blob del video desde IndexedDB
      const { getVideoBlob } = await import('@/lib/videoStorage')
      const blob = await getVideoBlob(params.id as string)
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
      }
    } catch (error) {
      console.error('Error loading video:', error)
      alert('Error al cargar el video')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    const stored = localStorage.getItem('favoriteVideos')
    const favorites = new Set(stored ? JSON.parse(stored) : [])
    
    if (favorites.has(params.id)) {
      favorites.delete(params.id)
    } else {
      favorites.add(params.id)
    }
    
    localStorage.setItem('favoriteVideos', JSON.stringify(Array.from(favorites)))
    setIsFavorite(!isFavorite)
  }

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = video?.fileName || `video-${params.id}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Error al eliminar el video')
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando video...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Video no encontrado</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-700 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <FaVideo className="text-blue-500 text-2xl" />
                <h1 className="text-white font-bold text-xl">Grabador</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition ml-auto"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition mb-2"
          >
            <FaHome className="text-xl flex-shrink-0" />
            {sidebarOpen && <span>Inicio</span>}
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition mb-2"
          >
            <FaFolder className="text-xl flex-shrink-0" />
            {sidebarOpen && <span>Biblioteca</span>}
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition mb-2"
          >
            <FaCog className="text-xl flex-shrink-0" />
            {sidebarOpen && <span>Configuración</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          {sidebarOpen && user && (
            <div className="mb-3 px-4">
              <p className="text-gray-400 text-sm truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-400 hover:text-red-300 hover:bg-gray-800 px-4 py-3 rounded-lg transition w-full"
          >
            <FaSignOutAlt className="text-xl flex-shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <FaArrowLeft />
              <span>Volver</span>
            </button>
          </div>

        {/* Video Player */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl mb-6">
          <div className="aspect-video bg-black">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full"
                autoPlay={false}
              >
                Tu navegador no soporta el elemento de video.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No se pudo cargar el video</p>
              </div>
            )}
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              <p className="text-gray-400 text-sm">{formatDate(video.createdAt)}</p>
            </div>
            <button
              onClick={toggleFavorite}
              className="text-2xl ml-4"
            >
              {isFavorite ? (
                <FaStar className="text-yellow-400" />
              ) : (
                <FaRegStar className="text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Duración</p>
              <p className="text-white font-semibold">{formatDuration(video.duration)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Tamaño</p>
              <p className="text-white font-semibold">{formatFileSize(video.fileSize)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Archivo</p>
              <p className="text-white font-semibold text-sm truncate">{video.fileName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaDownload />
              <span>Descargar</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaTrash />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
