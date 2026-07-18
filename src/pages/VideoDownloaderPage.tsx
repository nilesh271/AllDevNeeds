import { useState } from 'react'
import {
  Typography, Input, Button, Select, Option, Card, CardBody, Progress, Alert, Chip,
} from '@material-tailwind/react'

const QUALITIES = ['360p', '480p', '720p HD', '1080p HD', '4K Ultra HD']
const FORMATS = ['MP4', 'MP3', 'WEBM', 'AVI', 'MOV']

interface DownloadJob {
  id: string
  url: string
  quality: string
  format: string
  progress: number
  status: 'pending' | 'downloading' | 'done' | 'error'
  filename: string
}

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('720p HD')
  const [format, setFormat] = useState('MP4')
  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [error, setError] = useState('')

  const isValidUrl = (u: string) => {
    try { new URL(u); return true } catch { return false }
  }

  const handleDownload = () => {
    setError('')
    if (!url) { setError('Please enter a URL'); return }
    if (!isValidUrl(url)) { setError('Please enter a valid URL'); return }

    const job: DownloadJob = {
      id: Date.now().toString(),
      url,
      quality,
      format,
      progress: 0,
      status: 'pending',
      filename: `video_${Date.now()}.${format.toLowerCase()}`,
    }

    setJobs(prev => [job, ...prev])
    setUrl('')

    // Simulate download progress
    let progress = 0
    const timer = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(timer)
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, progress: 100, status: 'done' } : j
        ))
      } else {
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, progress: Math.min(progress, 99), status: 'downloading' } : j
        ))
      }
    }, 300)
  }

  const ytPreview = () => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
  }

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Typography variant="h4" className="text-gray-900 dark:text-white font-bold mb-1">
          Video Downloader
        </Typography>
        <Typography className="text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
          Download videos from any URL in your preferred quality and format
        </Typography>
        <Chip value="Mock — no actual download" size="sm" className="mb-6 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />

        {/* Input card */}
        <Card className="glass-card rounded-xl mb-6">
          <CardBody className="p-6">
            {error && <Alert color="red" className="mb-4 text-sm py-2">{error}</Alert>}

            <div className="flex flex-col gap-4">
              <Input
                label="Video URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-400' }}
                icon={
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  </svg>
                }
              />

              {/* YouTube preview */}
              {ytPreview() && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img src={ytPreview()!} alt="Preview" className="w-24 h-14 object-cover rounded" />
                  <div>
                    <Typography className="text-gray-700 dark:text-gray-300 text-sm font-medium">YouTube Video</Typography>
                    <Typography className="text-gray-400 text-xs">Preview loaded</Typography>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Select label="Quality" value={quality} onChange={v => setQuality(v || '720p HD')}
                  className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }}>
                  {QUALITIES.map(q => (
                    <Option key={q} value={q}>
                      {q.includes('4K') ? '⭐ ' : q.includes('HD') ? '🎬 ' : '📹 '}{q}
                    </Option>
                  ))}
                </Select>
                <Select label="Format" value={format} onChange={v => setFormat(v || 'MP4')}
                  className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }}>
                  {FORMATS.map(f => (
                    <Option key={f} value={f}>
                      {f === 'MP3' ? '🎵 ' : '🎞️ '}{f}
                    </Option>
                  ))}
                </Select>
              </div>

              <Button
                fullWidth
                onClick={handleDownload}
                className="bg-sky-500 hover:bg-sky-600 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {quality} {format}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Supported sites */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Typography className="text-gray-400 text-sm w-full">Supported sites (mock):</Typography>
          {['YouTube', 'Vimeo', 'Twitter', 'Instagram', 'TikTok', 'Dailymotion'].map(site => (
            <Chip key={site} value={site} size="sm" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
          ))}
        </div>

        {/* Download queue */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold">
              Download Queue
            </Typography>
            {jobs.map(job => (
              <Card key={job.id} className="glass-card rounded-xl">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <Typography className="text-gray-900 dark:text-white text-sm font-medium truncate">
                        {job.filename}
                      </Typography>
                      <Typography className="text-gray-400 text-xs truncate mt-0.5">
                        {job.url}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Chip
                        value={job.quality}
                        size="sm"
                        className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs"
                      />
                      <Chip
                        value={job.format}
                        size="sm"
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress
                      value={job.progress}
                      color={job.status === 'done' ? 'green' : job.status === 'error' ? 'red' : 'blue'}
                      className="flex-1"
                      size="sm"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right font-mono">
                      {Math.round(job.progress)}%
                    </span>
                    <Chip
                      value={job.status === 'done' ? '✓ Done' : job.status === 'error' ? '✗ Error' : `${Math.round(job.progress)}%`}
                      size="sm"
                      color={job.status === 'done' ? 'green' : job.status === 'error' ? 'red' : 'blue'}
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
