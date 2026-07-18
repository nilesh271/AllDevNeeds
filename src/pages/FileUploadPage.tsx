import { useState, useRef } from 'react'
import {
  Typography, Button, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter,
  Chip, IconButton, Alert,
} from '@material-tailwind/react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { addFiles, deleteFile, FileRecord } from '../store/filesSlice'

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const STORAGE_OPTIONS = ['google-drive', 'supabase'] as const

export default function FileUploadPage() {
  const [open, setOpen] = useState(false)
  const [storage, setStorage] = useState<'google-drive' | 'supabase'>('google-drive')
  const [dragging, setDragging] = useState(false)
  const [staged, setStaged] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dispatch = useAppDispatch()
  const { files } = useAppSelector(s => s.files)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setStaged(Array.from(fileList))
  }

  const handleUpload = async () => {
    if (!staged.length) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 1200)) // Simulate upload

    const records: FileRecord[] = staged.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      storage,
      timestamp: new Date().toISOString(),
    }))

    dispatch(addFiles(records))
    setUploading(false)
    setStaged([])
    setOpen(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDownload = (file: FileRecord) => {
    // Mock download
    const a = document.createElement('a')
    a.href = `data:text/plain;charset=utf-8,Mock file: ${file.name}`
    a.download = file.name
    a.click()
  }

  const storageIcon = (s: string) => s === 'google-drive' ? '🔵' : '🟢'
  const storageLabel = (s: string) => s === 'google-drive' ? 'Google Drive' : 'Supabase'

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Typography variant="h4" className="text-gray-900 dark:text-white font-bold">File Manager</Typography>
            <Typography className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Upload and manage files across cloud storage providers
            </Typography>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-sky-500 hover:bg-sky-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Files
          </Button>
        </div>

        {success && <Alert color="green" className="mb-4">Files uploaded successfully!</Alert>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Files', value: files.length },
            { label: 'Total Size', value: formatSize(files.reduce((a, f) => a + f.size, 0)) },
            { label: 'Google Drive', value: files.filter(f => f.storage === 'google-drive').length },
            { label: 'Supabase', value: files.filter(f => f.storage === 'supabase').length },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-sky-500">{s.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Files table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">File</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Size</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Storage</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400 shrink-0">
                          {file.name.split('.').pop()?.toUpperCase().slice(0, 3) || 'FILE'}
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">
                      {formatSize(file.size)}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <Chip
                        value={storageLabel(file.storage)}
                        size="sm"
                        className={`${file.storage === 'google-drive' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}
                      />
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm hidden lg:table-cell">
                      {new Date(file.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton size="sm" variant="text"
                          onClick={() => handleDownload(file)}
                          className="text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </IconButton>
                        <IconButton size="sm" variant="text"
                          onClick={() => dispatch(deleteFile(file.id))}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {files.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📁</div>
                <Typography className="text-gray-400 dark:text-gray-500 mb-2">No files uploaded yet</Typography>
                <Button size="sm" onClick={() => setOpen(true)} className="bg-sky-500 mt-2">Upload your first file</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={open} handler={setOpen} className="dark:bg-gray-800 max-w-md">
        <DialogHeader className="dark:text-white">Upload Files</DialogHeader>
        <DialogBody>
          {/* Storage selector */}
          <div className="mb-4">
            <Select
              label="Storage Provider"
              value={storage}
              onChange={v => setStorage(v as typeof storage)}
              className="dark:text-white"
              labelProps={{ className: 'dark:text-gray-400' }}
            >
              <Option value="google-drive">🔵 Google Drive</Option>
              <Option value="supabase">🟢 Supabase Storage</Option>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
              ${dragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-sky-400'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            <div className="text-4xl mb-2">☁️</div>
            <Typography className="text-gray-600 dark:text-gray-300 font-medium">
              Drop files here or click to browse
            </Typography>
            <Typography className="text-gray-400 text-sm mt-1">
              Any file type · Multiple files supported
            </Typography>
          </div>

          {/* Staged files */}
          {staged.length > 0 && (
            <div className="mt-4 space-y-2">
              <Typography className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {staged.length} file{staged.length !== 1 ? 's' : ''} ready to upload:
              </Typography>
              {staged.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button variant="outlined" onClick={() => { setOpen(false); setStaged([]) }}
            className="dark:border-gray-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!staged.length || uploading}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {uploading ? 'Uploading...' : `Upload ${staged.length ? `(${staged.length})` : ''}`}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
