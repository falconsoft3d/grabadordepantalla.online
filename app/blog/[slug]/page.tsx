import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FaCalendar, FaUser, FaClock, FaArrowLeft } from 'react-icons/fa'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface BlogPostData {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  readTime: string
  content: string
}

async function getPost(slug: string): Promise<BlogPostData | null> {
  try {
    const postsDirectory = path.join(process.cwd(), 'content/blog')
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const htmlContent = await marked.parse(content)

    return {
      slug,
      title: data.title || 'Sin título',
      date: data.date || new Date().toISOString(),
      author: data.author || 'Equipo GrabadorPantalla',
      excerpt: data.excerpt || '',
      readTime: data.readTime || '5 min',
      content: htmlContent
    }
  } catch (error) {
    console.error('Error al leer el post:', error)
    return null
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link 
          href="/blog"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition"
        >
          <FaArrowLeft />
          <span>Volver al blog</span>
        </Link>
      </div>

      {/* Blog Post */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Post Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center space-x-2">
                <FaCalendar className="text-blue-500" />
                <span>{new Date(post.date).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaUser className="text-purple-500" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaClock className="text-green-500" />
                <span>{post.readTime} de lectura</span>
              </div>
            </div>
          </header>

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900 
              prose-p:text-gray-700 
              prose-a:text-blue-600 hover:prose-a:text-blue-700
              prose-strong:text-gray-900
              prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              prose-ul:text-gray-700
              prose-ol:text-gray-700
              prose-li:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>

      <Footer />
    </div>
  )
}
