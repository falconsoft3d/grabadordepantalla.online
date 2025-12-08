'use client'

import { useEffect, useRef, useState } from 'react'
import { FaPlay, FaPause, FaCheck, FaTimes } from 'react-icons/fa'

interface VideoEditorProps {
  videoUrl: string
  duration: number
  onSave: (segments: TimelineSegment[]) => void
  onCancel: () => void
}

interface TimelineSegment {
  start: number
  end: number
  id: string
}

export default function VideoEditor({ videoUrl, duration, onSave, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(duration)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playhead' | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekTo = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, duration))
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration
    seekTo(time)
  }

  const handleMouseDown = (type: 'start' | 'end' | 'playhead') => {
    setIsDragging(type)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const time = percentage * duration

    if (isDragging === 'playhead') {
      seekTo(time)
    } else if (isDragging === 'start') {
      setStartTime(Math.max(0, Math.min(time, endTime - 0.5)))
    } else if (isDragging === 'end') {
      setEndTime(Math.max(startTime + 0.5, Math.min(time, duration)))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const setStartMarker = () => {
    setStartTime(currentTime)
    if (currentTime >= endTime) {
      setEndTime(Math.min(currentTime + 1, duration))
    }
  }

  const setEndMarker = () => {
    setEndTime(currentTime)
    if (currentTime <= startTime) {
      setStartTime(Math.max(currentTime - 1, 0))
    }
  }

  const handleSave = () => {
    const segment: TimelineSegment = {
      start: startTime,
      end: endTime,
      id: 'trimmed'
    }
    onSave([segment])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold text-lg">Recortar Video</h2>
          <div className="text-gray-400 text-sm">
            Duración original: {formatTime(duration)} | Nueva duración: {formatTime(endTime - startTime)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <FaCheck />
            <span>Guardar</span>
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <FaTimes />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="max-w-5xl w-full">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-700 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={togglePlayPause}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition"
            >
              {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl ml-1" />}
            </button>
            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <button
              onClick={setStartMarker}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
            >
              Marcar INICIO
            </button>
            <button
              onClick={setEndMarker}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition"
            >
              Marcar FIN
            </button>
          </div>

          {/* Información de recorte */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Inicio</div>
              <div className="text-white text-lg font-mono">{formatTime(startTime)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Fin</div>
              <div className="text-white text-lg font-mono">{formatTime(endTime)}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div
              ref={timelineRef}
              className="relative h-20 bg-gray-800 rounded-lg cursor-pointer select-none"
              onClick={handleTimelineClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Selected region */}
              <div
                className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-30 border-l-2 border-r-2 border-blue-500"
                style={{
                  left: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`
                }}
              />

              {/* Start marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-10"
                style={{ left: `${(startTime / duration) * 100}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown('start')
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  INICIO
                </div>
              </div>

              {/* End marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-ew-resize z-10"
                style={{ left: `${(endTime / duration) * 100}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown('end')
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  FIN
                </div>
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 cursor-ew-resize"
                style={{ left: `${(currentTime / duration) * 100}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown('playhead')
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-yellow-400" />
              </div>

              {/* Time markers */}
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-between px-2 text-gray-400 text-xs font-mono">
                <span>0:00</span>
                <span>{formatTime(duration / 2)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
