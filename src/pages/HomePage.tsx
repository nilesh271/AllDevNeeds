import { useNavigate } from 'react-router-dom'
import { Typography, Button, Card, CardBody, Chip } from '@material-tailwind/react'
import { useAppSelector } from '../hooks/redux'

const FEATURES = [
  {
    icon: '⌨️',
    title: 'Code Sharing',
    description: 'Real-time code editor with syntax highlighting. Share snippets instantly.',
    path: '/code',
    color: 'from-violet-500 to-purple-600',
    badge: 'Live Editor',
  },
  {
    icon: '📝',
    title: 'Sticky Notes',
    description: 'Drag-and-drop sticky notes board. Organize your thoughts visually.',
    path: '/notes',
    color: 'from-amber-400 to-orange-500',
    badge: 'Drag & Drop',
  },
  {
    icon: '🎓',
    title: 'Learning Hub',
    description: 'Curated dev tutorials and resources. Bookmark what matters.',
    path: '/learning',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Protected',
    protected: true,
  },
  {
    icon: '📁',
    title: 'File Manager',
    description: 'Upload and manage files across Google Drive or Supabase Storage.',
    path: '/files',
    color: 'from-sky-500 to-blue-600',
    badge: 'Multi-Cloud',
  },
  {
    icon: '🕐',
    title: 'DateTime Tools',
    description: 'Convert between timezones and date formats. Calculate date differences.',
    path: '/datetime',
    color: 'from-rose-500 to-pink-600',
    badge: 'Converter',
  },
  {
    icon: '⬇️',
    title: 'Video Downloader',
    description: 'Download videos in HD or 4K. Save as MP4 or MP3.',
    path: '/video-downloader',
    color: 'from-indigo-500 to-blue-600',
    badge: 'Mock',
  },
]

const STATS = [
  { value: '6+', label: 'Developer Tools' },
  { value: '100%', label: 'Client-Side' },
  { value: '0', label: 'Backend Required' },
  { value: '∞', label: 'Possibilities' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector(s => s.auth)

  return (
    <div className="page-container">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-sky-950 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-sky-400 rounded-full pulse-glow" />
              <span className="text-sky-300 text-sm font-medium">All-in-one developer toolkit</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Every tool a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400"> dev needs</span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl mb-8 leading-relaxed">
              Code editor, sticky notes, file manager, learning hub, datetime converter,
              and video downloader — all in one place, no backend required.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/code')}
                className="bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/30 text-base font-semibold"
              >
                Start Coding →
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outlined"
                  onClick={() => navigate('/signup')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 text-base"
                >
                  Get Full Access
                </Button>
              )}
            </div>

            {/* Terminal preview */}
            <div className="mt-12 bg-gray-900 rounded-xl border border-gray-700 p-4 text-left max-w-lg mx-auto shadow-2xl">
              <div className="flex gap-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <pre className="text-sm font-mono text-gray-300">
                <span className="text-green-400">$</span> npm install alldevneeds{'\n'}
                <span className="text-sky-400">✓</span> <span className="text-gray-400">6 tools installed</span>{'\n'}
                <span className="text-sky-400">✓</span> <span className="text-gray-400">0 backend required</span>{'\n'}
                <span className="text-green-400">→</span> Ready in <span className="text-yellow-400">0.42s</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-gray-200 dark:lg:divide-gray-700">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center lg:px-8">
                <p className="text-4xl font-bold text-sky-500 mb-1">{stat.value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Typography variant="h2" className="text-gray-900 dark:text-white text-3xl font-bold mb-3">
            Everything you need
          </Typography>
          <Typography className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Six purpose-built tools designed for developers, all running in your browser.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <Card
              key={feature.title}
              className="glass-card rounded-2xl hover:shadow-lg dark:hover:shadow-sky-900/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              onClick={() => {
                if (feature.protected && !isAuthenticated) navigate('/login')
                else navigate(feature.path)
              }}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {feature.icon}
                  </div>
                  <Chip
                    value={feature.badge}
                    size="sm"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium"
                  />
                </div>

                <Typography variant="h6" className="text-gray-900 dark:text-white font-bold mb-2">
                  {feature.title}
                </Typography>
                <Typography className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
                  {feature.description}
                </Typography>

                <div className="flex items-center text-sky-500 dark:text-sky-400 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Open tool</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-r from-sky-500 to-blue-600 py-16">
          <div className="max-w-3xl mx-auto text-center px-4">
            <Typography variant="h3" className="text-white font-bold mb-3 text-2xl sm:text-3xl">
              Unlock the full toolkit
            </Typography>
            <Typography className="text-sky-100 mb-6 text-lg">
              Sign up to access the Learning Hub, protected resources, and full admin panel.
            </Typography>
            <div className="flex gap-3 justify-center">
              <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 font-semibold"
                onClick={() => navigate('/signup')}>
                Create account
              </Button>
              <Button size="lg" variant="outlined" className="border-white text-white hover:bg-sky-600"
                onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Typography className="text-gray-400 text-sm">
            AllDevNeeds — Built with React, Vite, TailwindCSS & Material Tailwind
          </Typography>
        </div>
      </footer>
    </div>
  )
}
