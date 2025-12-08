'use client'

import { useEffect, useRef, useState } from 'react'
import { FaPlay, FaStop, FaPause, FaDownload, FaTimes } from 'react-icons/fa'

interface ScreenRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void
  onCancel?: () => void
  onRecordingStateChange?: (isRecording: boolean, isPaused: boolean) => void
  onControlsReady?: (pauseFn: () => void, stopFn: () => void) => void
  onStopping?: (isStopping: boolean) => void
}

export default function ScreenRecorder({ onRecordingComplete, onCancel, onRecordingStateChange, onControlsReady, onStopping }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordMicrophone, setRecordMicrophone] = useState(true)
  const [recordSystemAudio, setRecordSystemAudio] = useState(true)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const recordingTimeRef = useRef<number>(0)
  const micStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Obtener lista de micrófonos disponibles
    const getMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioDevices = devices.filter(device => device.kind === 'audioinput')
        setMicrophones(audioDevices)
        if (audioDevices.length > 0 && !selectedMicId) {
          setSelectedMicId(audioDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Error getting microphones:', error)
      }
    }

    getMicrophones()

    // Actualizar lista cuando se conecten/desconecten dispositivos
    navigator.mediaDevices.addEventListener('devicechange', getMicrophones)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getMicrophones)
    }
  }, [])

  useEffect(() => {
    if (stream && videoPreviewRef.current && !videoPreviewRef.current.srcObject) {
      videoPreviewRef.current.srcObject = stream
      videoPreviewRef.current.play().catch(err => console.log('Error playing preview:', err))
    }
  }, [stream])

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      // Capturar pantalla con audio del sistema
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: recordSystemAudio
      })

      let combinedStream = displayStream

      // Si está habilitado el micrófono, capturarlo y combinarlo
      if (recordMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
            video: false
          })
          micStreamRef.current = micStream

          // Combinar audio del sistema y micrófono
          const audioContext = new AudioContext()
          const audioDestination = audioContext.createMediaStreamDestination()

          // Audio del sistema
          if (displayStream.getAudioTracks().length > 0) {
            const systemSource = audioContext.createMediaStreamSource(
              new MediaStream(displayStream.getAudioTracks())
            )
            systemSource.connect(audioDestination)
          }

          // Audio del micrófono
          const micSource = audioContext.createMediaStreamSource(micStream)
          micSource.connect(audioDestination)

          // Crear stream combinado
          const videoTrack = displayStream.getVideoTracks()[0]
          const audioTrack = audioDestination.stream.getAudioTracks()[0]
          combinedStream = new MediaStream([videoTrack, audioTrack])
        } catch (micError) {
          console.warn('No se pudo acceder al micrófono:', micError)
          // Continuar sin micrófono
        }
      }

      setStream(combinedStream)
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const finalDuration = recordingTimeRef.current
        console.log('🎬 MediaRecorder.onstop - Duration captured:', finalDuration, 'seconds')
        setRecordedBlob(blob)
        combinedStream.getTracks().forEach(track => track.stop())
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop())
          micStreamRef.current = null
        }
        setStream(null)
        if (onRecordingComplete) {
          console.log('🎬 Calling onRecordingComplete with duration:', finalDuration)
          onRecordingComplete(blob, finalDuration)
        }
      }

      // Show preview BEFORE starting recording
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = combinedStream
        await videoPreviewRef.current.play().catch(err => console.log('Error playing preview:', err))
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      if (onRecordingStateChange) onRecordingStateChange(true, false)

      // Start timer
      recordingTimeRef.current = 0
      setRecordingTime(0)
      console.log('⏱️ Starting timer...')
      timerRef.current = setInterval(() => {
        recordingTimeRef.current = recordingTimeRef.current + 1
        setRecordingTime(recordingTimeRef.current)
        console.log('⏱️ Timer tick:', recordingTimeRef.current, 'seconds')
      }, 1000)
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
          recordingTimeRef.current = recordingTimeRef.current + 1
          setRecordingTime(recordingTimeRef.current)
          console.log('⏱️ Timer tick (resumed):', recordingTimeRef.current, 'seconds')
        }, 1000)
        setIsPaused(false)
        if (onRecordingStateChange) onRecordingStateChange(true, false)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) clearInterval(timerRef.current)
        setIsPaused(true)
        if (onRecordingStateChange) onRecordingStateChange(true, true)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording - Current time:', recordingTimeRef.current, 'seconds')
      if (onStopping) onStopping(true)
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (onRecordingStateChange) onRecordingStateChange(false, false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  useEffect(() => {
    if (onControlsReady) {
      onControlsReady(pauseRecording, stopRecording)
    }
  }, [isRecording, isPaused])

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
    recordingTimeRef.current = 0
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
      {/* Video Preview durante grabación */}
      {(stream || isRecording) && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoPreviewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
            style={{ display: 'block' }}
          />
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg z-50">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-semibold">{formatTime(recordingTime)}</span>
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
              <div className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold">
                PAUSADO
              </div>
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

      {/* Audio Configuration */}
      {!isRecording && !recordedBlob && !stream && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Configuración de Audio</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recordSystemAudio}
                onChange={(e) => setRecordSystemAudio(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Grabar audio del sistema (pestañas, aplicaciones)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recordMicrophone}
                onChange={(e) => setRecordMicrophone(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Grabar micrófono</span>
            </label>

            {/* Microphone Selector */}
            {recordMicrophone && microphones.length > 0 && (
              <div className="ml-8 mt-2">
                <label htmlFor="micSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar micrófono:
                </label>
                <select
                  id="micSelect"
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                >
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Micrófono ${microphones.indexOf(mic) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition shadow-lg"
              title="Nueva grabación"
            >
              <FaPlay />
              <span>Nueva grabación</span>
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition shadow-lg"
              >
                <FaTimes />
                <span>Cerrar</span>
              </button>
            )}
          </>
        )}

        {onCancel && !isRecording && !recordedBlob && (
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
