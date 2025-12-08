import Link from 'next/link'
import { FaVideo, FaUsers, FaLock, FaRocket } from 'react-icons/fa'
import { prisma } from '@/lib/prisma'

async function getStats() {
  try {
    const [userCount, videoCount] = await Promise.all([
      prisma.user.count(),
      prisma.video.count()
    ])
    return { users: userCount, videos: videoCount }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return { users: 0, videos: 0 }
  }
}

export default async function Home() {
  const stats = await getStats()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FaVideo className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-900">GrabadorPantalla</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Registrarse gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Graba tu pantalla
            <span className="block text-blue-600">en segundos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La forma más fácil de grabar, compartir y guardar videos de tu pantalla. 
            Perfecto para tutoriales, presentaciones y más.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition shadow-lg hover:shadow-xl"
            >
              Comenzar gratis
            </Link>
            <Link 
              href="/login"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition shadow-md hover:shadow-lg border-2 border-gray-200"
            >
              Ver demo
            </Link>
          </div>
        </div>

        {/* Video Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <FaVideo className="text-6xl mb-4 mx-auto opacity-50" />
              <p className="text-xl font-medium">Vista previa de grabación</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Todo lo que necesitas para grabar
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRocket className="text-blue-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Rápido y fácil</h3>
              <p className="text-gray-600">
                Comienza a grabar en segundos. No necesitas instalar ningún software complicado.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privado y seguro</h3>
              <p className="text-gray-600">
                Tus videos se guardan localmente en tu dispositivo. Tu privacidad es nuestra prioridad.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-purple-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Para todos</h3>
              <p className="text-gray-600">
                Perfecto para educadores, creadores de contenido, equipos remotos y más.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-lg mb-2">Total de Usuarios</p>
                  <p className="text-5xl font-bold">{stats.users.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-6">
                  <FaUsers className="text-5xl" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-lg mb-2">Total de Videos</p>
                  <p className="text-5xl font-bold">{stats.videos.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-6">
                  <FaVideo className="text-5xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para comenzar a grabar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a miles de usuarios que ya están grabando sus pantallas
          </p>
          <Link 
            href="/register"
            className="inline-block bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition shadow-xl"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Desarrollado por <a href="https://www.marlonfalcon.com" className="underline hover:text-white">www.marlonfalcon.com</a></p>
        </div>
      </footer>
    </div>
  )
}
