// IndexedDB para almacenar videos localmente
const DB_NAME = 'GrabadorPantallaDB'
const STORE_NAME = 'videos'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveVideoBlob(videoId: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ id: videoId, blob })
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getVideoBlob(videoId: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(videoId)
    
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.blob : null)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteVideoBlob(videoId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(videoId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function createVideoThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    const url = URL.createObjectURL(blob)
    video.src = url
    video.muted = true
    video.playsInline = true
    
    let seekTimeout: NodeJS.Timeout
    
    video.onloadedmetadata = () => {
      // Capturar frame al 10% del video o máximo 1 segundo
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
      
      // Timeout de seguridad
      seekTimeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('Timeout waiting for video seek'))
      }, 5000)
    }
    
    video.onseeked = () => {
      clearTimeout(seekTimeout)
      
      try {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((thumbnailBlob) => {
          URL.revokeObjectURL(url)
          
          if (thumbnailBlob) {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read thumbnail'))
            reader.readAsDataURL(thumbnailBlob)
          } else {
            reject(new Error('Failed to create thumbnail blob'))
          }
        }, 'image/jpeg', 0.7)
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }
    
    video.onerror = (e) => {
      clearTimeout(seekTimeout)
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video: ' + e))
    }
  })
}
