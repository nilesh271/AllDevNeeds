import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography, Input, Select, Option, Card, CardBody, Chip, Badge,
} from '@material-tailwind/react'
import { useAppSelector } from '../hooks/redux'

const CATEGORIES = ['All', 'React', 'TypeScript', 'Redux', 'CSS', 'Tools']

export default function LearningPage() {
  const navigate = useNavigate()
  const { items } = useAppSelector(s => s.learning)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || item.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Typography variant="h4" className="text-gray-900 dark:text-white font-bold mb-1">
            Learning Hub
          </Typography>
          <Typography className="text-gray-500 dark:text-gray-400 text-sm">
            Curated developer resources and tutorials
          </Typography>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              label="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="dark:text-white"
              labelProps={{ className: 'dark:text-gray-400' }}
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              label="Category"
              value={category}
              onChange={v => setCategory(v || 'All')}
              className="dark:text-white"
              labelProps={{ className: 'dark:text-gray-400' }}
            >
              {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </div>
        </div>

        {/* Results count */}
        <Typography className="text-gray-400 text-sm mb-4">
          {filtered.length} resource{filtered.length !== 1 ? 's' : ''} found
        </Typography>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => (
            <Card
              key={item.id}
              className="glass-card rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-sky-900/20 
                         transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              onClick={() => navigate(`/learning/${item.id}`)}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: '16/9' }}>
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/480x270/1e293b/94a3b8?text=${encodeURIComponent(item.category)}`
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-600">
                    <Typography className="text-white font-bold text-2xl">{item.category[0]}</Typography>
                  </div>
                )}
                {/* Play overlay */}
                {item.url.includes('youtube') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                    {item.title}
                  </Typography>
                  <Chip value={item.category} size="sm"
                    className="bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-xs shrink-0" />
                </div>
                <Typography className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
                  {item.description}
                </Typography>
                <Typography className="text-gray-400 text-xs mt-3">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Typography>
              </CardBody>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="text-5xl mb-3">🔍</div>
              <Typography className="text-gray-400 dark:text-gray-500">
                No resources found for "{search}"
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
