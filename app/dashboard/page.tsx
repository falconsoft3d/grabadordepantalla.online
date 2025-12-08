'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { FaVideo, FaSignOutAlt, FaPlus, FaHome, FaFolder, FaTh, FaClock, FaStar, FaTrash, FaCog, FaBars, FaTimes, FaPlay, FaPause, FaStop, FaDownload, FaChartBar } from 'react-icons/fa';
import ScreenRecorder from '@/components/ScreenRecorder'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface Video {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  duration?: number
  thumbnail?: string
  createdAt: string
  isFavorite?: boolean
  sharedToDrive?: boolean
  driveLink?: string
  driveFileId?: string
  shortCode?: string
  viewCount?: number
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
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const pauseRecordingRef = useRef<(() => void) | null>(null)
  const stopRecordingRef = useRef<(() => void) | null>(null)
  const [currentView, setCurrentView] = useState<'inicio' | 'biblioteca' | 'detalle' | 'configuracion' | 'historial'>('inicio')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string>('')
  const [googleClientSecret, setGoogleClientSecret] = useState<string>('')
  const [filterType, setFilterType] = useState<'all' | 'shared' | 'mostViewed' | 'largest'>('all')
  const [editingShortCode, setEditingShortCode] = useState<string | null>(null)
  const [newShortCode, setNewShortCode] = useState<string>('')
  const [videoViews, setVideoViews] = useState<any[]>([])
  const [loadingViews, setLoadingViews] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<'hour' | 'day' | 'month'>('day')

  useEffect(() => {
    checkAuth()
    checkDriveStatus()
    checkDriveCredentials()
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
      
      // Cargar favoritos desde localStorage
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  const fetchVideos = async () => {
    try {
      console.log('Fetching videos...')
      const response = await fetch('/api/videos')
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Videos data:', data)
      console.log('Videos array:', data.videos)
      setVideos(data.videos || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching videos:', error)
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
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }

  const downloadVideo = async (videoId: string, title: string) => {
    try {
      const { getVideoBlob } = await import('@/lib/videoStorage')
      const blob = await getVideoBlob(videoId)
      
      if (!blob) {
        alert('Video no encontrado en el almacenamiento local')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading video:', error)
      alert('Error al descargar el video')
    }
  }

  const openVideoDetail = async (video: Video) => {
    try {
      // Obtener el blob del video desde IndexedDB
      const { getVideoBlob } = await import('@/lib/videoStorage')
      const blob = await getVideoBlob(video.id)
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        setSelectedVideo(video)
        setCurrentView('detalle')
      }
    } catch (error) {
      console.error('Error loading video:', error)
      alert('Error al cargar el video')
    }
  }

  const closeVideoDetail = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl('')
    }
    setSelectedVideo(null)
    setCurrentView('inicio')
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
        if (favorites.has(videoId)) {
          toggleFavorite(videoId)
        }
        // Si estamos en la vista de detalle y eliminamos el video actual, volver
        if (currentView === 'detalle' && selectedVideo?.id === videoId) {
          closeVideoDetail()
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Error al eliminar el video')
    }
  }

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    const title = `Grabación ${new Date().toLocaleString('es')}`
    
    try {
      console.log('Iniciando guardado de video...', { size: blob.size, duration })
      
      // Importar funciones dinámicamente
      const { saveVideoBlob, createVideoThumbnail } = await import('@/lib/videoStorage')
      
      // Crear miniatura con manejo de error
      let thumbnail = ''
      try {
        console.log('Generando miniatura...')
        thumbnail = await createVideoThumbnail(blob)
        console.log('Miniatura generada exitosamente')
      } catch (thumbError) {
        console.warn('Error al generar miniatura, continuando sin ella:', thumbError)
        // Continuar sin miniatura si falla
      }
      
      console.log('Guardando metadata en base de datos...')
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
          thumbnail,
        }),
      })

      if (response.ok) {
        const savedVideo = await response.json()
        console.log('Video guardado en BD:', savedVideo)
        
        // Verificar que tenemos el ID del video
        const videoId = savedVideo.video?.id || savedVideo.id
        if (!videoId) {
          throw new Error('No se recibió el ID del video guardado')
        }
        
        // Guardar blob en IndexedDB
        console.log('Guardando blob en IndexedDB...')
        await saveVideoBlob(videoId, blob)
        console.log('Blob guardado exitosamente')
        
        await fetchVideos()
        console.log('Lista de videos actualizada')
        // Mostrar mensaje de éxito
        alert('Video guardado exitosamente en la biblioteca')
      } else {
        const error = await response.json()
        console.error('Error al guardar en BD:', error)
        alert('Error al guardar el video: ' + (error.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error saving video:', error)
      alert('Error al guardar el video: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setIsStopping(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFilteredVideos = () => {
    let filtered = [...videos]
    
    switch (filterType) {
      case 'shared':
        filtered = filtered.filter(v => v.sharedToDrive)
        break
      case 'mostViewed':
        filtered = filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        break
      case 'largest':
        filtered = filtered.sort((a, b) => b.fileSize - a.fileSize)
        break
      default:
        // 'all' - no filter
        break
    }
    
    return filtered
  }

  const fetchVideoViews = async () => {
    setLoadingViews(true)
    try {
      const response = await fetch('/api/videos/views')
      const data = await response.json()
      setVideoViews(data.views || [])
    } catch (error) {
      console.error('Error fetching views:', error)
    } finally {
      setLoadingViews(false)
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

  const checkDriveStatus = async () => {
    try {
      const response = await fetch('/api/google-drive/status')
      const data = await response.json()
      setDriveConnected(data.connected || false)
    } catch (error) {
      console.error('Error checking Drive status:', error)
    }
  }

  const checkDriveCredentials = async () => {
    try {
      const response = await fetch('/api/google-drive/credentials')
      if (response.ok) {
        const data = await response.json()
        const hasCredsNow = data.hasCredentials || false
        setHasCredentials(hasCredsNow)
        if (hasCredsNow && data.clientId) {
          setGoogleClientId(data.clientId)
        } else {
          setGoogleClientId('')
        }
      }
    } catch (error) {
      console.error('Error checking Drive credentials:', error)
      setHasCredentials(false)
      setGoogleClientId('')
    }
  }

  const saveGoogleCredentials = async () => {
    const clientId = googleClientId.trim()
    const clientSecret = googleClientSecret.trim()

    if (!clientId || !clientSecret) {
      alert('Por favor ingresa ambas credenciales')
      return
    }

    // Validación básica del formato
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      alert('El Client ID debe terminar en .apps.googleusercontent.com')
      return
    }

    if (!clientSecret.startsWith('GOCSPX-')) {
      alert('El Client Secret debe comenzar con GOCSPX-')
      return
    }

    setDriveLoading(true)
    try {
      const response = await fetch('/api/google-drive/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: clientId, 
          clientSecret: clientSecret 
        })
      })

      if (response.ok) {
        setHasCredentials(true)
        setShowCredentialsForm(false)
        setGoogleClientSecret('') // Limpiar el secret por seguridad
        alert('✅ Credenciales guardadas exitosamente. Ahora puedes conectar Google Drive.')
      } else {
        const data = await response.json()
        alert('❌ Error al guardar credenciales: ' + (data.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error saving credentials:', error)
      alert('❌ Error al guardar credenciales. Por favor intenta de nuevo.')
    } finally {
      setDriveLoading(false)
    }
  }

  const connectGoogleDrive = async () => {
    if (!hasCredentials) {
      alert('Primero debes configurar tus credenciales de Google Drive')
      setShowCredentialsForm(true)
      return
    }

    setDriveLoading(true)
    try {
      const response = await fetch('/api/google-drive/auth-url')
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al generar URL de autenticación')
        setDriveLoading(false)
        return
      }
      
      // Abrir ventana de autenticación
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const authWindow = window.open(
        data.authUrl,
        'Google Drive Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Escuchar cuando se complete la conexión
      const messageHandler = async (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_DRIVE_CONNECTED') {
          window.removeEventListener('message', messageHandler)
          await checkDriveStatus()
          setDriveLoading(false)
          alert('✅ Google Drive conectado exitosamente')
        }
      }
      
      window.addEventListener('message', messageHandler)
      
      // Limpiar listener si la ventana se cierra sin completar
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          setDriveLoading(false)
        }
      }, 500)
    } catch (error) {
      console.error('Error connecting to Drive:', error)
      alert('❌ Error al conectar con Google Drive')
      setDriveLoading(false)
    }
  }

  const disconnectGoogleDrive = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar Google Drive?')) {
      return
    }

    setDriveLoading(true)
    try {
      const response = await fetch('/api/google-drive/disconnect', {
        method: 'POST'
      })
      
      if (response.ok) {
        setDriveConnected(false)
        alert('Google Drive desconectado exitosamente')
      } else {
        alert('Error al desconectar Google Drive')
      }
    } catch (error) {
      console.error('Error disconnecting from Drive:', error)
      alert('Error al desconectar Google Drive')
    } finally {
      setDriveLoading(false)
    }
  }

  const shareVideoToDrive = async (videoId: string) => {
    if (!driveConnected) {
      alert('Primero debes conectar Google Drive en Configuración')
      return
    }

    try {
      // Obtener el blob del video desde IndexedDB
      const { getVideoBlob } = await import('@/lib/videoStorage')
      const blob = await getVideoBlob(videoId)
      
      if (!blob) {
        alert('Video no encontrado en el almacenamiento local')
        return
      }

      // Convertir blob a base64
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      
      reader.onloadend = async () => {
        try {
          const base64 = reader.result?.toString().split(',')[1]
          
          console.log('Compartiendo video a Drive...', videoId)
          console.log('Tamaño del blob:', blob.size, 'bytes')
          
          const response = await fetch(`/api/videos/${videoId}/share-drive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoBlob: base64 })
          })
          
          const data = await response.json()
          console.log('Respuesta del servidor:', data)
          
          if (response.ok) {
            alert('✅ Video compartido en Google Drive exitosamente')
            
            // Actualizar el video en el estado
            setVideos(prev => prev.map(v => 
              v.id === videoId 
                ? { ...v, sharedToDrive: true, driveLink: data.driveLink, shortCode: data.shortCode, viewCount: 0 } 
                : v
            ))
            
            // Si estamos viendo el detalle, actualizar también
            if (selectedVideo?.id === videoId) {
              setSelectedVideo(prev => prev ? { ...prev, sharedToDrive: true, driveLink: data.driveLink, shortCode: data.shortCode, viewCount: 0 } : null)
            }
          } else {
            console.error('Error del servidor:', data.error)
            alert('❌ Error al compartir video: ' + (data.error || 'Error desconocido'))
          }
        } catch (error: any) {
          console.error('Error sharing video to Drive:', error)
          alert('❌ Error al compartir video: ' + (error.message || 'Error desconocido'))
        }
      }
    } catch (error: any) {
      console.error('Error loading video:', error)
      alert('❌ Error al cargar el video: ' + (error.message || 'Error desconocido'))
    }
  }

  const updateShortCode = async (videoId: string, newCode: string) => {
    try {
      if (!/^[A-Za-z0-9]{4,10}$/.test(newCode)) {
        alert('❌ El código debe tener entre 4 y 10 caracteres alfanuméricos')
        return
      }

      const response = await fetch(`/api/videos/${videoId}/short-code`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortCode: newCode })
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Código corto actualizado')
        
        // Actualizar el video en el estado
        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, shortCode: data.shortCode } 
            : v
        ))
        
        // Si estamos viendo el detalle, actualizar también
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(prev => prev ? { ...prev, shortCode: data.shortCode } : null)
        }

        setEditingShortCode(null)
        setNewShortCode('')
      } else {
        alert('❌ ' + (data.error || 'Error al actualizar'))
      }
    } catch (error: any) {
      console.error('Error updating short code:', error)
      alert('❌ Error al actualizar el código corto')
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
              <Link href="/" className="flex items-center space-x-2">
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
        {!showRecorder && (
          <div className="p-4">
            <button
              onClick={() => {
                setCurrentView('inicio')
                setShowRecorder(true)
              }}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition shadow-lg ${sidebarOpen ? 'px-4 py-3' : 'p-3'}`}
            >
              <FaPlus />
              {sidebarOpen && <span>Nueva grabación</span>}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setCurrentView('inicio')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  currentView === 'inicio' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaHome className="text-lg" />
                {sidebarOpen && <span className={currentView === 'inicio' ? 'font-medium' : ''}>Inicio</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('biblioteca')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  currentView === 'biblioteca' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaTh className="text-lg" />
                {sidebarOpen && <span className={currentView === 'biblioteca' ? 'font-medium' : ''}>Biblioteca</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('historial')
                  fetchVideoViews()
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  currentView === 'historial' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaChartBar className="text-lg" />
                {sidebarOpen && <span className={currentView === 'historial' ? 'font-medium' : ''}>Historial</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('configuracion')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  currentView === 'configuracion' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCog className="text-lg" />
                {sidebarOpen && <span className={currentView === 'configuracion' ? 'font-medium' : ''}>Configuración</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <Link href="/dashboard/settings" className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} hover:bg-gray-100 rounded-lg p-2 transition cursor-pointer`}>
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
        {currentView === 'historial' ? (
          <div className="h-full flex flex-col">
            {/* Header con estadísticas */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Historial de Visualizaciones</h2>
                  <p className="text-sm text-gray-500">Seguimiento de todas las visitas a tus videos compartidos</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{videoViews.length}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total Visitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {new Set(videoViews.map((v: any) => v.videoId)).size}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Videos Vistos</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <FaChartBar className="text-lg" />
                    <span>{showChart ? 'Ver Tabla' : 'Ver Gráfico'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {loadingViews ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando historial...</p>
                </div>
              </div>
            ) : videoViews.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay visualizaciones registradas</p>
                  <p className="text-gray-400 text-sm mt-2">Comparte videos para comenzar a ver estadísticas</p>
                </div>
              </div>
            ) : showChart ? (
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Clicks vs Tiempo</h3>
                    
                    {/* Period Selector */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setChartPeriod('hour')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          chartPeriod === 'hour' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Por Hora
                      </button>
                      <button
                        onClick={() => setChartPeriod('day')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          chartPeriod === 'day' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Por Día
                      </button>
                      <button
                        onClick={() => setChartPeriod('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          chartPeriod === 'month' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Por Mes
                      </button>
                    </div>
                  </div>
                  
                  {/* Chart Container */}
                  <div className="space-y-4">
                    {(() => {
                      let chartData: any[] = []
                      
                      if (chartPeriod === 'hour') {
                        // Generar todas las 24 horas
                        const hourlyData: any = {}
                        for (let i = 0; i < 24; i++) {
                          const hour = i.toString().padStart(2, '0')
                          hourlyData[`${hour}:00`] = 0
                        }
                        
                        // Contar vistas por hora
                        videoViews.forEach((view: any) => {
                          const date = new Date(view.createdAt)
                          const hour = date.getHours().toString().padStart(2, '0')
                          const key = `${hour}:00`
                          if (hourlyData[key] !== undefined) {
                            hourlyData[key]++
                          }
                        })
                        
                        chartData = Object.keys(hourlyData).map(period => ({
                          name: period,
                          clicks: hourlyData[period]
                        }))
                      } else if (chartPeriod === 'day') {
                        // Agrupar por día
                        const grouped = videoViews.reduce((acc: any, view: any) => {
                          const date = new Date(view.createdAt)
                          const key = date.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short'
                          })
                          acc[key] = (acc[key] || 0) + 1
                          return acc
                        }, {})
                        
                        chartData = Object.keys(grouped).slice(-14).map(period => ({
                          name: period,
                          clicks: grouped[period]
                        }))
                      } else {
                        // Agrupar por mes
                        const grouped = videoViews.reduce((acc: any, view: any) => {
                          const date = new Date(view.createdAt)
                          const key = date.toLocaleDateString('es-ES', {
                            month: 'short',
                            year: 'numeric'
                          })
                          acc[key] = (acc[key] || 0) + 1
                          return acc
                        }, {})
                        
                        chartData = Object.keys(grouped).slice(-12).map(period => ({
                          name: period,
                          clicks: grouped[period]
                        }))
                      }
                      
                      const maxClicks = Math.max(...chartData.map(d => d.clicks), 1)
                      const avgClicks = Math.round(videoViews.length / chartData.length) || 0
                      
                      return (
                        <>
                          {/* Chart */}
                          <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                                <defs>
                                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="name" 
                                  angle={chartPeriod === 'hour' ? -45 : -45}
                                  textAnchor="end"
                                  height={60}
                                  tick={{ fill: '#6b7280', fontSize: 12 }}
                                  stroke="#d1d5db"
                                />
                                <YAxis 
                                  tick={{ fill: '#6b7280', fontSize: 12 }}
                                  stroke="#d1d5db"
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    padding: '10px'
                                  }}
                                  labelStyle={{ color: '#9ca3af', marginBottom: '5px' }}
                                  formatter={(value: any) => [`${value} clicks`, 'Visualizaciones']}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="clicks" 
                                  stroke="#3b82f6" 
                                  strokeWidth={3}
                                  fill="url(#colorClicks)" 
                                  activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Summary Stats */}
                          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {avgClicks}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Promedio/{chartPeriod === 'hour' ? 'Hora' : chartPeriod === 'day' ? 'Día' : 'Mes'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {maxClicks}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Pico Máximo</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {videoViews.length}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Total Clicks</div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-white sticky top-0 z-10 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dirección IP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispositivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {videoViews.map((view: any, index: number) => {
                      // Parse user agent for device info
                      const ua = view.userAgent || ''
                      let deviceIcon = '💻'
                      let deviceType = 'Escritorio'
                      let browserName = 'Navegador'
                      
                      if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
                        deviceIcon = '📱'
                        deviceType = 'Móvil'
                      } else if (ua.includes('Tablet') || ua.includes('iPad')) {
                        deviceIcon = '📱'
                        deviceType = 'Tablet'
                      }
                      
                      // Extract browser info
                      if (ua.includes('Chrome')) browserName = 'Chrome'
                      else if (ua.includes('Firefox')) browserName = 'Firefox'
                      else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'Safari'
                      else if (ua.includes('Edge')) browserName = 'Edge'
                      
                      // Format date
                      const date = new Date(view.createdAt)
                      const formattedDate = date.toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                      const formattedTime = date.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                      
                      return (
                        <tr key={view.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center flex-shrink-0">
                                <FaVideo className="text-white text-xs" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">{view.videoTitle}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                              {view.shortCode}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm font-mono text-gray-700">{view.ipAddress}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{deviceIcon}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{deviceType}</div>
                                <div className="text-xs text-gray-500">{browserName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {view.referer ? (
                              <div className="text-sm text-gray-600 truncate max-w-xs" title={view.referer}>
                                🔗 {new URL(view.referer).hostname}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                Acceso Directo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                            <div className="text-xs text-gray-500">{formattedTime}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentView === 'inicio' ? 'Inicio' : currentView === 'biblioteca' ? 'Biblioteca de Videos' : currentView === 'configuracion' ? 'Configuración' : 'Detalle del Video'}
            </h1>
            <p className="text-gray-600">
              {currentView === 'inicio' 
                ? 'Comienza a grabar tu pantalla o gestiona tus videos' 
                : currentView === 'biblioteca'
                ? 'Todos tus videos grabados en tu local'
                : currentView === 'configuracion'
                ? 'Configura las integraciones y preferencias de tu cuenta'
                : 'Información detallada del video'}
            </p>
          </div>

          {/* Recording Interface - Solo en Inicio */}
          {showRecorder && currentView === 'inicio' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Nueva Grabación</h2>
                <button
                  onClick={() => setShowRecorder(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <ScreenRecorder 
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setShowRecorder(false)}
                onRecordingStateChange={(recording, paused) => {
                  setIsRecording(recording)
                  setIsPaused(paused)
                }}
                onControlsReady={(pauseFn, stopFn) => {
                  pauseRecordingRef.current = pauseFn
                  stopRecordingRef.current = stopFn
                }}
                onStopping={(stopping) => setIsStopping(stopping)}
              />
            </div>
          )}

          {/* Vista de Inicio */}
          {currentView === 'inicio' && !showRecorder && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Card: Nueva Grabación */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                  <FaVideo className="text-5xl mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-2">Nueva Grabación</h3>
                  <p className="mb-6 opacity-90">Captura tu pantalla en segundos.
                  Tus videos solo se guardaran local a menos que integres con una nube</p>
                  <button
                    onClick={() => setShowRecorder(true)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>Comenzar a grabar</span>
                  </button>
                </div>

                {/* Card: Mis Videos */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
                  <FaTh className="text-5xl text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Mis Videos</h3>
                  <p className="text-gray-600 mb-6">Tienes {videos.length} video{videos.length !== 1 ? 's' : ''} guardado{videos.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={() => setCurrentView('biblioteca')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center space-x-2"
                  >
                    <FaTh />
                    <span>Ver biblioteca</span>
                  </button>
                </div>
              </div>

              {/* Sección de Favoritos */}
              {videos.filter(v => favorites.has(v.id)).length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-500 text-xl" />
                      <h2 className="text-2xl font-bold text-gray-900">Videos Favoritos</h2>
                    </div>
                    <button
                      onClick={() => setCurrentView('biblioteca')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver todos →
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos
                      .filter(v => favorites.has(v.id))
                      .slice(0, 4)
                      .map((video) => (
                        <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group relative">
                          <div onClick={() => openVideoDetail(video)} className="block cursor-pointer">
                            <div className="bg-gray-900 aspect-video flex items-center justify-center relative overflow-hidden">
                              {video.thumbnail ? (
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-full flex items-center justify-center">
                                  <FaVideo className="text-white text-4xl opacity-50" />
                                </div>
                              )}
                              {/* Play overlay on hover */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <FaPlay className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate flex-1">{video.title}</h3>
                                <FaStar className="text-yellow-500 text-xs flex-shrink-0 mt-1" />
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>{formatFileSize(video.fileSize)} · {formatDuration(video.duration)}</p>
                                <p>{new Date(video.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                          </div>
                          {/* Action buttons - positioned above the link */}
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleFavorite(video.id)
                              }}
                              className="bg-yellow-500 text-white rounded-full p-2 shadow-lg hover:scale-110 transition"
                            >
                              <FaStar className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                downloadVideo(video.id, video.title)
                              }}
                              className="bg-white text-green-600 rounded-full p-2 shadow-lg hover:scale-110 transition"
                            >
                              <FaDownload className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                deleteVideo(video.id)
                              }}
                              className="bg-white text-red-600 rounded-full p-2 shadow-lg hover:scale-110 transition"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vista de Biblioteca */}
          {currentView === 'biblioteca' && (
            <>
              {videos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                  <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No tienes grabaciones todavía</p>
                  <p className="text-gray-500 mb-6">Haz clic en "Nueva grabación" para comenzar</p>
                  <button
                    onClick={() => {
                      setCurrentView('inicio')
                      setShowRecorder(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2 transition"
                  >
                    <FaPlus />
                    <span>Crear primera grabación</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Total de Videos */}
                    <button
                      onClick={() => setFilterType('all')}
                      className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl text-left ${filterType === 'all' ? 'ring-4 ring-blue-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                          <FaVideo className="text-2xl" />
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{videos.length}</p>
                          <p className="text-sm opacity-80">Total Videos</p>
                        </div>
                      </div>
                      {filterType === 'all' && (
                        <div className="text-xs opacity-90 mt-2">✓ Mostrando todos</div>
                      )}
                    </button>

                    {/* Videos Compartidos */}
                    <button
                      onClick={() => setFilterType('shared')}
                      className={`bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl text-left ${filterType === 'shared' ? 'ring-4 ring-green-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            {videos.filter(v => v.sharedToDrive).length}
                          </p>
                          <p className="text-sm opacity-80">Compartidos</p>
                        </div>
                      </div>
                      {filterType === 'shared' && (
                        <div className="text-xs opacity-90 mt-2">✓ Solo compartidos</div>
                      )}
                    </button>

                    {/* Total de Vistas */}
                    <button
                      onClick={() => setFilterType('mostViewed')}
                      className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl text-left ${filterType === 'mostViewed' ? 'ring-4 ring-purple-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            {videos.reduce((sum, v) => sum + (v.viewCount || 0), 0)}
                          </p>
                          <p className="text-sm opacity-80">Total Vistas</p>
                        </div>
                      </div>
                      {filterType === 'mostViewed' && (
                        <div className="text-xs opacity-90 mt-2">✓ Más vistos primero</div>
                      )}
                    </button>

                    {/* Almacenamiento */}
                    <button
                      onClick={() => setFilterType('largest')}
                      className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl text-left ${filterType === 'largest' ? 'ring-4 ring-orange-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            {formatFileSize(videos.reduce((sum, v) => sum + v.fileSize, 0))}
                          </p>
                          <p className="text-sm opacity-80">Almacenado</p>
                        </div>
                      </div>
                      {filterType === 'largest' && (
                        <div className="text-xs opacity-90 mt-2">✓ Más grandes primero</div>
                      )}
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getFilteredVideos().map((video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group relative">
                  <div onClick={() => openVideoDetail(video)} className="block cursor-pointer">
                    <div className="bg-gray-900 aspect-video flex items-center justify-center relative overflow-hidden">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-full flex items-center justify-center">
                          <FaVideo className="text-white text-4xl opacity-50" />
                        </div>
                      )}
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <FaPlay className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        <div className="flex items-center justify-between">
                          <p>{new Date(video.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                          {driveConnected && video.sharedToDrive && video.driveLink && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigator.clipboard.writeText(video.driveLink!)
                                alert('✅ Enlace copiado')
                              }}
                              className="text-blue-600 hover:text-blue-700 transition"
                              title="Copiar enlace de Drive"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {driveConnected && video.sharedToDrive && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1 text-green-600">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                              </svg>
                              <span className="font-medium">Video compartido</span>
                              {typeof video.viewCount === 'number' && (
                                <span className="text-gray-500">· {video.viewCount} vistas</span>
                              )}
                            </div>
                            {video.shortCode && (
                              editingShortCode === video.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <span className="text-xs text-gray-500">{window.location.origin}/v/</span>
                                  <input
                                    type="text"
                                    value={newShortCode}
                                    onChange={(e) => setNewShortCode(e.target.value.toUpperCase())}
                                    className="w-24 px-1 py-0.5 text-xs border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                    placeholder={video.shortCode}
                                    maxLength={10}
                                  />
                                  <button
                                    onClick={() => updateShortCode(video.id, newShortCode)}
                                    className="text-green-600 hover:text-green-700 text-xs"
                                    title="Guardar"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => { setEditingShortCode(null); setNewShortCode(''); }}
                                    className="text-red-600 hover:text-red-700 text-xs"
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const shortLink = `${window.location.origin}/v/${video.shortCode}`
                                      navigator.clipboard.writeText(shortLink)
                                      alert('✅ Enlace corto copiado')
                                    }}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition"
                                    title="Copiar enlace corto"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="text-xs">{window.location.origin}/v/{video.shortCode}</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEditingShortCode(video.id)
                                      setNewShortCode(video.shortCode || '')
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-xs"
                                    title="Editar código"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons - positioned above the link */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(video.id)
                      }}
                      className={`${favorites.has(video.id) ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700'} rounded-full p-2 shadow-lg hover:scale-110 transition`}
                      title="Marcar como favorito"
                    >
                      <FaStar className="text-sm" />
                    </button>
                    {driveConnected && (
                      video.sharedToDrive ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (video.driveLink) {
                              navigator.clipboard.writeText(video.driveLink)
                              alert('✅ Enlace de Drive copiado al portapapeles')
                            }
                          }}
                          className="bg-green-500 text-white rounded-full p-2 shadow-lg hover:scale-110 transition"
                          title="Enlace de Drive (copiar)"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            shareVideoToDrive(video.id)
                          }}
                          className="bg-blue-500 text-white rounded-full p-2 shadow-lg hover:scale-110 transition"
                          title="Compartir en Google Drive"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                        </button>
                      )
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        downloadVideo(video.id, video.title)
                      }}
                      className="bg-white text-green-600 rounded-full p-2 shadow-lg hover:scale-110 transition"
                      title="Descargar"
                    >
                      <FaDownload className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteVideo(video.id)
                      }}
                      className="bg-white text-red-600 rounded-full p-2 shadow-lg hover:scale-110 transition"
                      title="Eliminar"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}

          {/* Vista de Detalle del Video */}
          {currentView === 'detalle' && selectedVideo && (
            <div className="space-y-6">
              <button
                onClick={closeVideoDetail}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
              >
                <FaTimes />
                <span>Cerrar</span>
              </button>

              {/* Video Player */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
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
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedVideo.title}</h1>
                    <p className="text-gray-600 text-sm">{new Date(selectedVideo.createdAt).toLocaleString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(selectedVideo.id)}
                    className="text-2xl ml-4"
                  >
                    {favorites.has(selectedVideo.id) ? (
                      <FaStar className="text-yellow-400" />
                    ) : (
                      <FaStar className="text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Duración</p>
                    <p className="text-gray-900 font-semibold">{formatDuration(selectedVideo.duration)}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Tamaño</p>
                    <p className="text-gray-900 font-semibold">{formatFileSize(selectedVideo.fileSize)}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Archivo</p>
                    <p className="text-gray-900 font-semibold text-sm truncate">{selectedVideo.fileName}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* Drive Share Section */}
                  {driveConnected && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                          <span className="font-semibold text-gray-900">Google Drive</span>
                        </div>
                        {(selectedVideo as any).sharedToDrive && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Compartido</span>
                        )}
                      </div>
                      
                      {(selectedVideo as any).sharedToDrive && (selectedVideo as any).driveLink ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Este video está disponible en Google Drive</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={(selectedVideo as any).driveLink}
                              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText((selectedVideo as any).driveLink)
                                alert('Enlace copiado al portapapeles')
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              Copiar
                            </button>
                            <a
                              href={(selectedVideo as any).driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                            >
                              Abrir
                            </a>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => shareVideoToDrive(selectedVideo.id)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                          <span>Compartir en Drive</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadVideo(selectedVideo.id, selectedVideo.title)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaDownload />
                      <span>Descargar</span>
                    </button>
                    <button
                      onClick={() => deleteVideo(selectedVideo.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaTrash />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuración View */}
          {currentView === 'configuracion' && (
            <div className="space-y-6">
              {/* Google Drive Integration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Integración con Google Drive</h2>
                    <p className="text-gray-600">
                      Conecta tu cuenta de Google Drive para poder compartir tus videos directamente desde la plataforma.
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${driveConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {driveConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>

                {/* Formulario de credenciales */}
                {!hasCredentials || showCredentialsForm ? (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-indigo-900 mb-4 text-lg">📋 Configurar Credenciales de Google Drive</h3>
                    
                    {/* Instrucciones paso a paso */}
                    <div className="mb-6 space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-indigo-100">
                        <h4 className="font-semibold text-gray-900 mb-3">🔧 Pasos para obtener tus credenciales:</h4>
                        
                        <ol className="space-y-3 text-sm text-gray-700">
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">1.</span>
                            <div>
                              <strong>Ve a Google Cloud Console:</strong>
                              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                console.cloud.google.com
                              </a>
                            </div>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">2.</span>
                            <div>
                              <strong>Crea un nuevo proyecto</strong> o selecciona uno existente
                            </div>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">3.</span>
                            <div>
                              <strong>Habilita la API de Google Drive:</strong>
                              <ul className="ml-4 mt-1 space-y-1">
                                <li>• Ve a "APIs y servicios" → "Biblioteca"</li>
                                <li>• Busca "Google Drive API"</li>
                                <li>• Haz clic en "Habilitar"</li>
                              </ul>
                            </div>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">4.</span>
                            <div>
                              <strong>Configura la pantalla de consentimiento:</strong>
                              <ul className="ml-4 mt-1 space-y-1">
                                <li>• Ve a "APIs y servicios" → "Pantalla de consentimiento de OAuth"</li>
                                <li>• Selecciona "Externo" y haz clic en "Crear"</li>
                                <li>• Completa la información básica (nombre de app, email)</li>
                                <li>• En "Alcances", agrega: <code className="bg-gray-100 px-1 text-xs">.../auth/drive.file</code></li>
                                <li>• Guarda y continúa</li>
                              </ul>
                            </div>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">5.</span>
                            <div>
                              <strong>Crea credenciales OAuth 2.0:</strong>
                              <ul className="ml-4 mt-1 space-y-1">
                                <li>• Ve a "APIs y servicios" → "Credenciales"</li>
                                <li>• Haz clic en "Crear credenciales" → "ID de cliente de OAuth"</li>
                                <li>• Tipo de aplicación: "Aplicación web"</li>
                                <li>• Nombre: "GrabadorPantalla" (o el que prefieras)</li>
                                <li>• <strong>URI de redireccionamiento autorizado:</strong> Copia y pega este exactamente:</li>
                              </ul>
                              <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2">
                                <code className="text-xs font-mono text-amber-900 break-all">
                                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/auth/google-callback
                                </code>
                                <button
                                  onClick={() => {
                                    const uri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/auth/google-callback`
                                    navigator.clipboard.writeText(uri)
                                    alert('URI copiado al portapapeles')
                                  }}
                                  className="ml-2 text-xs text-amber-700 hover:text-amber-800 underline"
                                >
                                  Copiar
                                </button>
                              </div>
                            </div>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="font-bold mr-2 text-indigo-600">6.</span>
                            <div>
                              <strong>Copia las credenciales:</strong>
                              <ul className="ml-4 mt-1 space-y-1">
                                <li>• Se mostrará un popup con tu <strong>Client ID</strong> y <strong>Client Secret</strong></li>
                                <li>• Copia ambos valores y pégalos en el formulario de abajo</li>
                              </ul>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>
                    
                    <p className="text-sm text-indigo-800 mb-4 font-medium">
                      Ingresa tus credenciales de Google Cloud Console:
                    </p>
                    
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-700 mb-2">
                          Client ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="googleClientId"
                          name="googleClientId"
                          type="text"
                          value={googleClientId}
                          onChange={(e) => setGoogleClientId(e.target.value)}
                          placeholder="123456789012-abc123def456.apps.googleusercontent.com"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                          autoComplete="new-password"
                          spellCheck="false"
                        />
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <span>ℹ️</span>
                          <span>Debe terminar en <code className="bg-gray-100 px-1 py-0.5 rounded">.apps.googleusercontent.com</code></span>
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="googleClientSecret" className="block text-sm font-medium text-gray-700 mb-2">
                          Client Secret <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="googleClientSecret"
                          name="googleClientSecret"
                          type="text"
                          value={googleClientSecret}
                          onChange={(e) => setGoogleClientSecret(e.target.value)}
                          placeholder="GOCSPX-AbCdEf123456789..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                          autoComplete="new-password"
                          spellCheck="false"
                        />
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <span>ℹ️</span>
                          <span>Debe comenzar con <code className="bg-gray-100 px-1 py-0.5 rounded">GOCSPX-</code></span>
                        </p>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={saveGoogleCredentials}
                          disabled={driveLoading || !googleClientId.trim() || !googleClientSecret.trim()}
                          className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                          {driveLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Guardando...
                            </span>
                          ) : (
                            'Guardar Credenciales'
                          )}
                        </button>
                        {hasCredentials && (
                          <button
                            onClick={() => {
                              setShowCredentialsForm(false)
                              setGoogleClientId('')
                              setGoogleClientSecret('')
                            }}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            Credenciales configuradas correctamente
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Client ID: <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">{googleClientId || '...'}</code>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowCredentialsForm(true)
                          setGoogleClientSecret('') // Limpiar el secret
                        }}
                        className="text-sm text-green-700 hover:text-green-800 font-medium underline flex-shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                {/* Información de uso - Colapsable */}
                <details className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <summary className="font-semibold text-blue-900 cursor-pointer">💡 ¿Cómo funciona la integración?</summary>
                  <ul className="space-y-2 text-sm text-blue-800 mt-3">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>Configura tus credenciales de Google Cloud Console (solo una vez)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Conecta tu cuenta de Google Drive haciendo clic en el botón de abajo</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Una vez conectado, verás un botón "Compartir en Drive" en cada video</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>Al compartir, tu video se subirá a Google Drive y obtendrás un enlace público</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">5.</span>
                      <span>Puedes copiar el enlace y compartirlo con quien quieras</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">6.</span>
                      <span>Si eliminas un video compartido, también se eliminará de Google Drive</span>
                    </li>
                  </ul>
                </details>

                {/* Documentación adicional */}
                <details className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <summary className="font-semibold text-amber-900 cursor-pointer">⚠️ Información importante y solución de problemas</summary>
                  <div className="mt-3 space-y-4">
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm mb-2">Privacidad y Seguridad:</h4>
                      <ul className="space-y-1 text-sm text-amber-800">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Los videos compartidos serán públicos (cualquiera con el enlace podrá verlos)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Los videos se almacenan en tu cuenta de Google Drive, ocupando tu espacio disponible</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Tus credenciales se guardan de forma segura en la base de datos</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Nunca compartas tu Client Secret con nadie</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm mb-2">Errores Comunes:</h4>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li>
                          <strong>"URI de redireccionamiento no autorizado":</strong>
                          <br/>Verifica que copiaste exactamente el URI mostrado arriba en Google Cloud Console
                        </li>
                        <li>
                          <strong>"API no habilitada":</strong>
                          <br/>Asegúrate de habilitar la Google Drive API en tu proyecto
                        </li>
                        <li>
                          <strong>"Credenciales inválidas":</strong>
                          <br/>Verifica que copiaste correctamente el Client ID y Client Secret
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm mb-2">Límites:</h4>
                      <ul className="space-y-1 text-sm text-amber-800">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Cuenta gratuita de Google: 15 GB compartidos entre Gmail, Drive y Fotos</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Videos grandes pueden tardar varios minutos en subir</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Si llegas al límite, necesitarás liberar espacio o actualizar a Google One</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </details>

                {/* Botón de acción */}
                <div className="flex gap-4">
                  {!driveConnected ? (
                    <button
                      onClick={connectGoogleDrive}
                      disabled={driveLoading || !hasCredentials}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      title={!hasCredentials ? 'Primero configura tus credenciales' : ''}
                    >
                      {driveLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Conectando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.5 13L1 21h22l-5.5-8H6.5zm7.5-9L8.5 13h7L20 4h-6zM4 4l5.5 9H16L10.5 4H4z"/>
                          </svg>
                          <span>{hasCredentials ? 'Conectar Google Drive' : 'Configura credenciales primero'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={disconnectGoogleDrive}
                      disabled={driveLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                    >
                      {driveLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Desconectando...</span>
                        </>
                      ) : (
                        <>
                          <FaTimes />
                          <span>Desconectar Google Drive</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Futuras integraciones */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 opacity-50">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Más integraciones próximamente</h2>
                <p className="text-gray-600">
                  Estamos trabajando en más integraciones como Dropbox, OneDrive, y más.
                </p>
              </div>
            </div>
          )}
          </div>
        )}
      </main>

      {/* Floating Recording Controls - Left Side */}
      {isRecording && (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-50">
          <button
            onClick={() => {
              if (pauseRecordingRef.current) {
                pauseRecordingRef.current()
              }
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 transform transition"
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <FaPlay className="text-2xl" /> : <FaPause className="text-2xl" />}
          </button>
          <button
            onClick={() => {
              if (stopRecordingRef.current) {
                stopRecordingRef.current()
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-2xl hover:scale-110 transform transition"
            title="Detener grabación"
          >
            <FaStop className="text-2xl" />
          </button>
        </div>
      )}



      {/* Cartel de Parando */}
      {isStopping && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Procesando grabación...</h3>
            <p className="text-gray-600">
              Estamos guardando tu video, esto tomará solo unos segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
