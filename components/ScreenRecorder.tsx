'use client'

import { useEffect, useRef, useState } from 'react'
import { FaPlay, FaStop, FaPause, FaDownload, FaTimes } from 'react-icons/fa'

interface ScreenRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void
  onCancel?: () => void
}

export default function ScreenRecorder({ onRecordingComplete, onCancel }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [stream])

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: true
      })

      setStream(displayStream)
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)
        if (onRecordingComplete) {
          onRecordingComplete(blob, recordingTime)
        }
        displayStream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = displayStream
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Error al iniciar la grabación. Asegúrate de dar permisos.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) clearInterval(timerRef.current)
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `grabacion-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    chunksRef.current = []
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Video Preview - Siempre visible cuando hay stream o grabación */}
      {(isRecording || stream) && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <video
            ref={videoPreviewRef}
            autoPlay
            muted
            className="w-full h-full object-contain"
          />
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-semibold">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Recorded Video */}
      {recordedBlob && !isRecording && !stream && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <video
            src={URL.createObjectURL(recordedBlob)}
            controls
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center items-center space-x-4">
        {!isRecording && !recordedBlob && !stream && (
          <button
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition shadow-lg"
          >
            <FaPlay />
            <span>Comenzar grabación</span>
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full transition shadow-lg"
              title={isPaused ? 'Reanudar' : 'Pausar'}
            >
              <FaPause className="text-xl" />
            </button>
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition shadow-lg"
            >
              <FaStop />
              <span>Detener</span>
            </button>
          </>
        )}

        {recordedBlob && !isRecording && (
          <>
            <button
              onClick={downloadRecording}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition shadow-lg"
            >
              <FaDownload />
              <span>Descargar</span>
            </button>
            <button
              onClick={resetRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full transition shadow-lg"
              title="Nueva grabación"
            >
              <FaTimes className="text-xl" />
            </button>
          </>
        )}

        {onCancel && !isRecording && (
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold transition"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Info */}
      {!isRecording && !recordedBlob && !stream && (
        <div className="text-center text-gray-600">
          <p>Haz clic en el botón para comenzar a grabar tu pantalla</p>
          <p className="text-sm mt-2">Podrás elegir qué ventana o pantalla grabar</p>
        </div>
      )}
    </div>
  )
}
