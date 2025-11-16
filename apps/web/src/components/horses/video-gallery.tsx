'use client'

import { Film } from 'lucide-react'

interface Video {
  id: string
  url: string
  title: string | null
}

interface VideoGalleryProps {
  videos: Video[]
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Film className="h-6 w-6 text-green-600" />
        Videos
      </h2>
      <div className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="rounded-lg overflow-hidden bg-black">
            <video
              controls
              className="w-full"
              preload="metadata"
            >
              <source src={video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {video.title && (
              <p className="text-sm text-gray-700 mt-2 px-2">{video.title}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
