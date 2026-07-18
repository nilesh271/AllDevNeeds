import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Button, Chip, Card, CardBody } from '@material-tailwind/react'
import { useAppSelector } from '../hooks/redux'

export default function LearningDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items } = useAppSelector(s => s.learning)
  const item = items.find(i => i.id === id)

  if (!item) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <Typography variant="h5" className="text-gray-900 dark:text-white mb-2">Resource not found</Typography>
          <Button onClick={() => navigate('/learning')} className="bg-sky-500 mt-4">Back to Learning</Button>
        </div>
      </div>
    )
  }

  // Extract YouTube video ID
  const ytMatch = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  const ytId = ytMatch?.[1]

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button
          variant="text"
          onClick={() => navigate('/learning')}
          className="dark:text-gray-300 mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learning
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {ytId ? (
              <div className="rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={item.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                <Typography className="text-white font-bold text-4xl">{item.category[0]}</Typography>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-start gap-3 mb-3">
                <Typography variant="h4" className="text-gray-900 dark:text-white font-bold flex-1">
                  {item.title}
                </Typography>
                <Chip value={item.category} size="sm" className="bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 shrink-0" />
              </div>
              <Typography className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </Typography>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="glass-card rounded-xl">
              <CardBody className="p-4">
                <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-3">Resource Info</Typography>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <span className="text-gray-900 dark:text-white font-medium">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Added</span>
                    <span className="text-gray-900 dark:text-white font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 dark:text-gray-400">Source</span>
                    <span className="text-sky-500 font-medium truncate max-w-[160px]">
                      {ytId ? 'YouTube' : new URL(item.url).hostname}
                    </span>
                  </div>
                </div>

                <Button
                  fullWidth
                  className="bg-sky-500 hover:bg-sky-600 mt-4"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  Open Original →
                </Button>
              </CardBody>
            </Card>

            {/* Related */}
            <Card className="glass-card rounded-xl">
              <CardBody className="p-4">
                <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-3">More in {item.category}</Typography>
                <div className="space-y-3">
                  {useAppSelector(s => s.learning).items
                    .filter(i => i.category === item.category && i.id !== item.id)
                    .slice(0, 3)
                    .map(rel => (
                      <div
                        key={rel.id}
                        className="flex gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1.5 -mx-1.5 transition-colors"
                        onClick={() => navigate(`/learning/${rel.id}`)}
                      >
                        <img
                          src={rel.thumbnail || `https://placehold.co/80x45/1e293b/94a3b8?text=${rel.category[0]}`}
                          alt={rel.title}
                          className="w-20 h-12 object-cover rounded"
                          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x45/1e293b/94a3b8?text=${rel.category[0]}` }}
                        />
                        <p className="text-gray-700 dark:text-gray-300 text-xs font-medium line-clamp-2">{rel.title}</p>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
