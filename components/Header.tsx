import Link from 'next/link'
import { FaVideo } from 'react-icons/fa'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FaVideo className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold text-gray-900">GrabadorPantalla</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link 
            href="/blog"
            className="text-gray-700 hover:text-gray-900 font-medium transition"
          >
            Blog
          </Link>
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
  )
}
