import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Typography, Button, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter,
  Chip, IconButton, Alert, Input
} from '@material-tailwind/react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  addFiles,
  deleteFile as deleteFileRedux,
  updateFiles,
  moveFileRecord,
  FileRecord,
  StorageProvider
} from '../store/filesSlice'
import {
  uploadFilesToStorage,
  fetchFilesFromSupabase,
  createFolderInSupabase,
  deleteFileFromStorage,
  downloadFileFromStorage,
  moveFileInStorage
} from '../services/fileManager'
import FilePresignedUrlModal from '../components/FilePresignedUrlModal'
import {
  BsCloudUpload, BsSearch, BsDownload, BsLink45Deg, BsTrash, BsGrid3X3Gap, BsListUl,
  BsFileEarmarkPdf, BsFileEarmarkImage, BsFileEarmarkPlay, BsFileEarmarkCode,
  BsFileEarmarkZip, BsFileEarmarkText, BsChevronLeft, BsChevronRight, BsFolderCheck,
  BsFolderPlus, BsFolderSymlink, BsArrowClockwise, BsFolderFill, BsFolder2Open, BsArrowLeftShort
} from 'react-icons/bs'

const formatSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getFileIcon = (mimeType: string, filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (mimeType.includes('pdf') || ext === 'pdf') {
    return <BsFileEarmarkPdf className="h-6 w-6 text-red-500 shrink-0" />
  }
  if (mimeType.includes('image') || ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) {
    return <BsFileEarmarkImage className="h-6 w-6 text-emerald-500 shrink-0" />
  }
  if (mimeType.includes('video') || ['mp4', 'mov', 'mkv', 'avi'].includes(ext)) {
    return <BsFileEarmarkPlay className="h-6 w-6 text-purple-500 shrink-0" />
  }
  if (mimeType.includes('json') || mimeType.includes('javascript') || ['ts', 'js', 'json', 'html', 'css', 'py'].includes(ext)) {
    return <BsFileEarmarkCode className="h-6 w-6 text-amber-500 shrink-0" />
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <BsFileEarmarkZip className="h-6 w-6 text-sky-500 shrink-0" />
  }
  return <BsFileEarmarkText className="h-6 w-6 text-gray-500 shrink-0" />
}

export default function FileUploadPage() {
  const dispatch = useAppDispatch()
  const { files } = useAppSelector(s => s.files)
  const { isAuthenticated } = useAppSelector(s => s.auth)

  // Ref to track files and prevent infinite useCallback loops
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('error')

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToastMsg(message)
    setToastType(type)
    setTimeout(() => {
      setToastMsg('')
    }, 4500)
  }

  const checkAuth = (): boolean => {
    if (!isAuthenticated) {
      showToast('Authentication required: Please log in to perform this action.', 'error')
      return false
    }
    return true
  }

  // Dynamic Folder & Navigation State
  const [discoveredFolders, setDiscoveredFolders] = useState<string[]>([])
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all')
  const [targetFolder, setTargetFolder] = useState<string>('files')
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderError, setFolderError] = useState('')

  // Move File State
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [fileToMove, setFileToMove] = useState<FileRecord | null>(null)
  const [moveDestinationFolder, setMoveDestinationFolder] = useState<string>('files')
  const [customMoveFolder, setCustomMoveFolder] = useState<string>('')
  const [moving, setMoving] = useState(false)
  const [moveError, setMoveError] = useState('')

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState<StorageProvider>('supabase')
  const [dragging, setDragging] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Refresh & Sync State
  const [refreshing, setRefreshing] = useState(false)

  // Filtering, Searching, Sorting & View state
  const [activeTab, setActiveTab] = useState<'all' | StorageProvider>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('date-desc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [serverTotalCount, setServerTotalCount] = useState<number>(0)

  // Presigned URL Sharing Modal
  const [presignedModalOpen, setPresignedModalOpen] = useState(false)
  const [presignedTargetFile, setPresignedTargetFile] = useState<FileRecord | null>(null)

  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search input for server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Compute folders dynamically for the selected storage tab ONLY
  const availableFolders = useMemo(() => {
    const relevantFiles = activeTab === 'all'
      ? files
      : files.filter(f => f.storage === activeTab)

    const folderSet = new Set<string>()
    relevantFiles.forEach(f => {
      if (f.folder) folderSet.add(f.folder)
    })

    if (activeTab === 'all' || activeTab === 'supabase') {
      discoveredFolders.forEach(f => folderSet.add(f))
    }

    return Array.from(folderSet)
  }, [files, activeTab, discoveredFolders])

  // Count files per folder for current storage view
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const relevantFiles = activeTab === 'all' ? files : files.filter(f => f.storage === activeTab)
    availableFolders.forEach(folder => {
      counts[folder] = relevantFiles.filter(f => (f.folder || 'files') === folder).length
    })
    return counts
  }, [files, activeTab, availableFolders])

  // Server-side fetch from Supabase Storage with search, sort, and pagination
  const syncSupabaseContents = useCallback(async () => {
    if (!isAuthenticated) return

    const res = await fetchFilesFromSupabase({
      folder: selectedFolderFilter,
      search: debouncedSearch,
      sortBy,
      page: currentPage,
      limit: pageSize,
    })

    if (res.folders.length > 0) {
      setDiscoveredFolders(Array.from(new Set(res.folders)))
    }

    setServerTotalCount(res.totalCount)

    // Update Redux store with latest server results for Supabase
    const nonSpFiles = filesRef.current.filter(f => f.storage !== 'supabase')
    dispatch(updateFiles([...res.files, ...nonSpFiles]))
  }, [selectedFolderFilter, debouncedSearch, sortBy, currentPage, pageSize, dispatch, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && (activeTab === 'all' || activeTab === 'supabase')) {
      syncSupabaseContents()
    }
  }, [syncSupabaseContents, activeTab, isAuthenticated])

  // Reset folder filter when switching activeTab if selected folder is no longer valid
  useEffect(() => {
    if (selectedFolderFilter !== 'all' && !availableFolders.includes(selectedFolderFilter)) {
      setSelectedFolderFilter('all')
    }
  }, [activeTab, availableFolders, selectedFolderFilter])

  const handleRefresh = async () => {
    if (!checkAuth()) return
    setRefreshing(true)
    try {
      await syncSupabaseContents()
    } catch (err: any) {
      console.error('Refresh error:', err)
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // Filtered & Sorted File List for rendering
  const processedFiles = useMemo(() => {
    let result = [...files]

    if (activeTab !== 'all') {
      result = result.filter(f => f.storage === activeTab)
    }

    if (selectedFolderFilter !== 'all') {
      result = result.filter(f => (f.folder || 'files') === selectedFolderFilter)
    }

    if (debouncedSearch.trim() && activeTab !== 'supabase') {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || (f.folder && f.folder.toLowerCase().includes(q))
      )
    }

    return result
  }, [files, activeTab, selectedFolderFilter, debouncedSearch])

  // Total count calculation (Server-side for Supabase, local for non-Supabase)
  const totalCount = activeTab === 'supabase' || activeTab === 'all' ? serverTotalCount : processedFiles.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const paginatedFiles = processedFiles

  // Reset page when key filters change
  const handleFolderSelect = (folder: string) => {
    setSelectedFolderFilter(folder)
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as any)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  // Handlers
  const handleOpenUploadModalForFolder = (folderName?: string) => {
    if (!checkAuth()) return
    if (folderName) {
      setTargetFolder(folderName)
    } else if (selectedFolderFilter !== 'all') {
      setTargetFolder(selectedFolderFilter)
    } else if (availableFolders.length > 0) {
      setTargetFolder(availableFolders[0])
    } else {
      setTargetFolder('files')
    }
    setUploadModalOpen(true)
  }

  const handleCreateFolder = async () => {
    if (!checkAuth()) return
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    setFolderError('')
    try {
      const createdFolder = await createFolderInSupabase(newFolderName)
      setDiscoveredFolders(prev => Array.from(new Set([...prev, createdFolder])))
      setSelectedFolderFilter(createdFolder)
      setTargetFolder(createdFolder)
      setNewFolderName('')
      setCreateFolderModalOpen(false)
      showToast(`Folder "${createdFolder}" created in Supabase Storage successfully`, 'success')
    } catch (err: any) {
      setFolderError(err?.message || 'Failed to create folder')
      showToast(err?.message || 'Failed to create folder', 'error')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleOpenMoveModal = (file: FileRecord) => {
    if (!checkAuth()) return
    setFileToMove(file)
    setMoveDestinationFolder(file.folder || 'files')
    setCustomMoveFolder('')
    setMoveError('')
    setMoveModalOpen(true)
  }

  const handleMoveFileSubmit = async () => {
    if (!checkAuth()) return
    if (!fileToMove) return
    const finalTargetFolder = customMoveFolder.trim() || moveDestinationFolder
    if (!finalTargetFolder) return

    setMoving(true)
    setMoveError('')
    try {
      const { newPath, newUrl } = await moveFileInStorage(fileToMove, finalTargetFolder)
      dispatch(moveFileRecord({
        id: fileToMove.id,
        targetFolder: finalTargetFolder,
        newPath,
        newUrl
      }))

      setMoveModalOpen(false)
      setFileToMove(null)
      showToast(`Moved "${fileToMove.name}" to folder "${finalTargetFolder}" successfully`, 'success')
      syncSupabaseContents()
    } catch (err: any) {
      setMoveError(err?.message || 'Failed to move file')
      showToast(err?.message || 'Failed to move file', 'error')
    } finally {
      setMoving(false)
    }
  }

  const handleStageFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setStagedFiles(prev => [...prev, ...Array.from(fileList)])
  }

  const handleUploadSubmit = async () => {
    if (!checkAuth()) return
    if (!stagedFiles.length) return
    setUploading(true)
    setUploadError('')
    try {
      const uploadedRecords = await uploadFilesToStorage(stagedFiles, selectedStorage, targetFolder)
      dispatch(addFiles(uploadedRecords))

      setStagedFiles([])
      setUploadModalOpen(false)
      showToast(`Uploaded ${uploadedRecords.length} file(s) to ${selectedStorage.toUpperCase()} under folder "${targetFolder}" successfully`, 'success')
      syncSupabaseContents()
    } catch (err: any) {
      setUploadError(err?.message || 'File upload failed')
      showToast(err?.message || 'File upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleInstantDownload = async (file: FileRecord) => {
    if (!checkAuth()) return
    try {
      await downloadFileFromStorage(file)
      showToast(`Download for "${file.name}" started`, 'success')
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`, 'error')
    }
  }

  const handleOpenPresignedModal = (file: FileRecord) => {
    if (!checkAuth()) return
    setPresignedTargetFile(file)
    setPresignedModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!checkAuth()) return
    if (!fileToDelete) return
    setDeleting(true)
    try {
      await deleteFileFromStorage(fileToDelete)
      dispatch(deleteFileRedux(fileToDelete.id))
      setDeleteConfirmOpen(false)
      showToast(`Deleted file "${fileToDelete.name}" successfully`, 'success')
      setFileToDelete(null)
      syncSupabaseContents()
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const providerBadge = (storage: StorageProvider) => {
    if (storage === 'supabase') {
      return (
        <Chip
          value="Supabase"
          size="sm"
          className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] sm:text-xs shrink-0"
        />
      )
    }
    if (storage === 's3') {
      return (
        <Chip
          value="Amazon S3"
          size="sm"
          className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px] sm:text-xs shrink-0"
        />
      )
    }
    return (
      <Chip
        value="Google Drive"
        size="sm"
        className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[10px] sm:text-xs shrink-0"
      />
    )
  }

  return (
    <div className="page-container px-3 mt-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4 sm:pb-5">
          <div>
            <Typography variant="h3" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Cloud File Manager
            </Typography>
            <Typography className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium max-w-3xl">
              Manage, search, download, move, and share files across Supabase Storage, Amazon S3, and Google Drive.
            </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end shrink-0">
            <IconButton
              variant="outlined"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
              title="Refresh Files & Folders"
            >
              <BsArrowClockwise className={`h-4 w-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
            </IconButton>
            <Button
              variant="outlined"
              onClick={() => setCreateFolderModalOpen(true)}
              className="border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold flex items-center justify-center gap-2 py-2.5 px-3.5 text-xs shadow-xs shrink-0"
            >
              <BsFolderPlus className="h-4 w-4" /> Create Folder
            </Button>
            <Button
              onClick={() => handleOpenUploadModalForFolder()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center gap-2 py-2.5 px-4 text-xs shadow-sm shrink-0"
            >
              <BsCloudUpload className="h-4 w-4" /> Upload Files
            </Button>
          </div>
        </div>

        {/* Top Storage Statistics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { label: 'Total Storage Used', value: formatSize(files.reduce((acc, f) => acc + f.size, 0)), color: 'text-sky-500' },
            { label: 'Supabase Storage', value: `${files.filter(f => f.storage === 'supabase').length} files`, color: 'text-emerald-500' },
            { label: 'Amazon S3', value: `${files.filter(f => f.storage === 's3').length} files`, color: 'text-amber-500' },
            { label: 'Google Drive', value: `${files.filter(f => f.storage === 'google-drive').length} files`, color: 'text-blue-500' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
              <Typography className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {stat.label}
              </Typography>
              <Typography variant="h4" className={`mt-0.5 sm:mt-1 font-bold text-base sm:text-xl lg:text-2xl ${stat.color} truncate`}>
                {stat.value}
              </Typography>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 sm:p-5 space-y-4 sm:space-y-5 shadow-sm">
          {/* Provider Tabs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 sm:pb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full scrollbar-none">
              {[
                { key: 'all', label: `All Storage (${files.length})` },
                { key: 'supabase', label: `Supabase (${files.filter(f => f.storage === 'supabase').length})` },
                { key: 's3', label: `Amazon S3 (${files.filter(f => f.storage === 's3').length})` },
                { key: 'google-drive', label: `Google Drive (${files.filter(f => f.storage === 'google-drive').length})` },
              ].map(tab => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={activeTab === tab.key ? 'filled' : 'text'}
                  onClick={() => {
                    setActiveTab(tab.key as any)
                    setCurrentPage(1)
                  }}
                  className={`capitalize text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 whitespace-nowrap ${activeTab === tab.key
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* View Mode & Refresh Toggle */}
            <div className="flex items-center justify-end gap-1.5 self-end sm:self-auto shrink-0">
              <IconButton
                size="sm"
                variant="outlined"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Refresh List"
              >
                <BsArrowClockwise className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
              </IconButton>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <IconButton
                  size="sm"
                  variant={viewMode === 'table' ? 'filled' : 'text'}
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-xs' : 'text-gray-500'}
                >
                  <BsListUl className="h-4 w-4" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant={viewMode === 'grid' ? 'filled' : 'text'}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-xs' : 'text-gray-500'}
                >
                  <BsGrid3X3Gap className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </div>

          {/* Folder Navigation Bar (Filter pills derived ONLY for current storage provider) */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/80 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-0.5">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <BsFolderFill className="h-3.5 w-3.5 text-amber-500" /> Folders ({availableFolders.length}):
              </span>
              <Button
                size="sm"
                variant={selectedFolderFilter === 'all' ? 'filled' : 'text'}
                onClick={() => handleFolderSelect('all')}
                className={`capitalize text-xs py-1 px-2.5 rounded-md shrink-0 ${selectedFolderFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                All Folders ({totalCount})
              </Button>
              {availableFolders.map(folder => (
                <Button
                  key={folder}
                  size="sm"
                  variant={selectedFolderFilter === folder ? 'filled' : 'text'}
                  onClick={() => handleFolderSelect(folder)}
                  className={`capitalize text-xs py-1 px-2.5 rounded-md shrink-0 flex items-center gap-1 ${selectedFolderFilter === folder
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  📁 {folder} ({folderCounts[folder] || 0})
                </Button>
              ))}
            </div>

            {selectedFolderFilter !== 'all' && (
              <Button
                size="sm"
                variant="text"
                onClick={() => handleFolderSelect('all')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 py-1 px-2 flex items-center gap-1 shrink-0 ml-auto"
              >
                <BsArrowLeftShort className="h-4 w-4" /> View All
              </Button>
            )}
          </div>

          {/* Search & Sort Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Server-Side Search Input */}
            <div className="sm:col-span-7">
              <Input
                label="Search files by name on server..."
                icon={<BsSearch className="h-4 w-4 text-gray-400" />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="dark:text-white text-xs sm:text-sm"
                labelProps={{ className: 'dark:text-gray-400 text-xs' }}
                crossOrigin=""
              />
            </div>

            {/* Server-Side Sort Dropdown */}
            <div className="sm:col-span-5">
              <Select
                label="Sort Files By"
                value={sortBy}
                onChange={v => v && handleSortChange(v)}
                menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                className="dark:text-white text-xs sm:text-sm"
                labelProps={{ className: 'dark:text-gray-400 text-xs' }}
              >
                <Option value="date-desc">Newest Uploaded First</Option>
                <Option value="date-asc">Oldest Uploaded First</Option>
                <Option value="name-asc">Name (A to Z)</Option>
                <Option value="name-desc">Name (Z to A)</Option>
                <Option value="size-desc">File Size (Largest)</Option>
                <Option value="size-asc">File Size (Smallest)</Option>
              </Select>
            </div>
          </div>

          {/* Folders Overview Grid (Displayed when viewing All Folders for the active storage service) */}
          {selectedFolderFilter === 'all' && searchQuery === '' && availableFolders.length > 0 && (
            <div className="space-y-2">
              <Typography className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <BsFolderFill className="h-4 w-4 text-amber-500" /> Storage Folders ({availableFolders.length})
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableFolders.map(folder => (
                  <div
                    key={folder}
                    onClick={() => handleFolderSelect(folder)}
                    className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BsFolder2Open className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                      <div className="min-w-0 truncate">
                        <Typography className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {folder}
                        </Typography>
                        <Typography className="text-[10px] text-gray-500 font-medium">
                          {folderCounts[folder] || 0} files
                        </Typography>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenUploadModalForFolder(folder)
                      }}
                      className="p-1 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/40 rounded shrink-0 opacity-80 group-hover:opacity-100"
                      title={`Upload to ${folder}`}
                    >
                      <BsCloudUpload className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Content View */}
          {paginatedFiles.length === 0 ? (
            <div className="text-center py-12 sm:py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl px-4">
              <BsFolderCheck className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-700" />
              <Typography className="mt-3 font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-300">
                No files found
              </Typography>
              <Typography className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No matching files found on server' : 'Upload your first file to get started'}
              </Typography>
              {selectedFolderFilter !== 'all' && (
                <Button
                  size="sm"
                  onClick={() => handleOpenUploadModalForFolder(selectedFolderFilter)}
                  className="mt-4 bg-sky-600 text-white text-xs font-semibold"
                >
                  Upload Files to "{selectedFolderFilter}"
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-w-full">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold uppercase border-b border-gray-200 dark:border-gray-800 whitespace-nowrap">
                    <th className="py-2.5 px-3 sm:px-4">Filename</th>
                    <th className="py-2.5 px-3 sm:px-4">Folder</th>
                    <th className="py-2.5 px-3 sm:px-4">Storage Provider</th>
                    <th className="py-2.5 px-3 sm:px-4">Size</th>
                    <th className="py-2.5 px-3 sm:px-4">Uploaded Datetime</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs sm:text-sm">
                  {paginatedFiles.map(file => (
                    <tr key={file.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5 min-w-0 max-w-[200px] sm:max-w-[260px]">
                          {getFileIcon(file.type, file.name)}
                          <div className="min-w-0 flex-1">
                            <Typography className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                              {file.name}
                            </Typography>
                            <Typography className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                              {file.type}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleFolderSelect(file.folder || 'files')}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <BsFolderSymlink className="h-3 w-3 text-amber-500" />
                          {file.folder || 'files'}
                        </button>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {providerBadge(file.storage)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatSize(file.size)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(file.timestamp)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => handleInstantDownload(file)}
                            className="text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                            title="Instant Download"
                          >
                            <BsDownload className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => handleOpenMoveModal(file)}
                            className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Move File to Another Folder"
                          >
                            <BsFolderSymlink className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => handleOpenPresignedModal(file)}
                            className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Share Presigned URL"
                          >
                            <BsLink45Deg className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => {
                              setFileToDelete(file)
                              setDeleteConfirmOpen(true)
                            }}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete File"
                          >
                            <BsTrash className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {paginatedFiles.map(file => (
                <div
                  key={file.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(file.type, file.name)}
                        <div className="min-w-0 flex-1">
                          <Typography className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                            {file.name}
                          </Typography>
                          <Typography className="text-[10px] text-gray-500 font-mono truncate">
                            {formatSize(file.size)}
                          </Typography>
                        </div>
                      </div>
                      {providerBadge(file.storage)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                      <button
                        onClick={() => handleFolderSelect(file.folder || 'files')}
                        className="inline-flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20"
                      >
                        <BsFolderSymlink className="h-3 w-3 text-amber-500" />
                        {file.folder || 'files'}
                      </button>
                      <span>{formatDate(file.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-gray-700/60 pt-2.5">
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleInstantDownload(file)}
                      className="flex items-center gap-1 text-sky-600 dark:text-sky-400 px-2 py-1 text-xs"
                    >
                      <BsDownload className="h-3.5 w-3.5" /> Download
                    </Button>
                    <div className="flex items-center gap-1">
                      <IconButton
                        size="sm"
                        variant="text"
                        onClick={() => handleOpenMoveModal(file)}
                        className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        title="Move File"
                      >
                        <BsFolderSymlink className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="text"
                        onClick={() => handleOpenPresignedModal(file)}
                        className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <BsLink45Deg className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="text"
                        onClick={() => {
                          setFileToDelete(file)
                          setDeleteConfirmOpen(true)
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <BsTrash className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Correct Server-Side Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-center sm:text-left text-[11px] sm:text-xs">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalCount}
                  </span>{' '}
                  files
                </div>

                <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-2.5">
                  <span className="text-[11px] text-gray-500 font-medium">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => handlePageSizeChange(Number(e.target.value))}
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[11px] font-semibold text-gray-800 dark:text-white px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outlined"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <BsChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Typography className="text-xs font-semibold text-gray-900 dark:text-white px-1">
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  size="sm"
                  variant="outlined"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-1 text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Next <BsChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move File Modal */}
      <Dialog
        open={moveModalOpen}
        handler={() => setMoveModalOpen(false)}
        size="xs"
        className="m-3 min-w-[calc(100%-1.5rem)] sm:min-w-[400px] dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <DialogHeader className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 text-base sm:text-lg flex items-center gap-2">
          <BsFolderSymlink className="h-5 w-5 text-amber-500" /> Move File
        </DialogHeader>

        <DialogBody className="space-y-4 pt-4 px-4 sm:px-6">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <Typography className="text-xs text-gray-500 font-medium">Selected File:</Typography>
            <Typography className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {fileToMove?.name}
            </Typography>
            <Typography className="text-[11px] text-gray-500 mt-0.5">
              Current Folder: <span className="font-semibold text-amber-600 dark:text-amber-400">📁 {fileToMove?.folder || 'files'}</span>
            </Typography>
          </div>

          <div className="space-y-2">
            <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Select Destination Folder
            </Typography>
            <Select
              label="Existing Folders"
              value={moveDestinationFolder}
              onChange={v => v && setMoveDestinationFolder(v)}
              menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
              className="dark:text-white text-xs sm:text-sm"
              labelProps={{ className: 'dark:text-gray-400 text-xs' }}
            >
              {availableFolders.map(folder => (
                <Option key={folder} value={folder}>
                  📁 {folder}
                </Option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Typography className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Or type a new folder path:
            </Typography>
            <Input
              label="New folder name"
              value={customMoveFolder}
              onChange={e => setCustomMoveFolder(e.target.value)}
              className="dark:text-white text-xs"
              labelProps={{ className: 'dark:text-gray-400 text-xs' }}
              crossOrigin=""
            />
          </div>

          {moveError && (
            <Typography className="text-xs text-red-500 font-medium">
              {moveError}
            </Typography>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-end gap-2">
          <Button variant="text" onClick={() => setMoveModalOpen(false)} className="dark:text-gray-300 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleMoveFileSubmit}
            disabled={moving}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-4"
          >
            {moving ? 'Moving...' : 'Move File'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create Folder Modal */}
      <Dialog
        open={createFolderModalOpen}
        handler={() => setCreateFolderModalOpen(false)}
        size="xs"
        className="m-3 min-w-[calc(100%-1.5rem)] sm:min-w-[380px] dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <DialogHeader className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 text-base sm:text-lg flex items-center gap-2">
          <BsFolderPlus className="h-5 w-5 text-sky-500" /> Create Supabase Folder
        </DialogHeader>

        <DialogBody className="space-y-4 pt-4 px-4 sm:px-6">
          <div className="space-y-2">
            <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Folder Name
            </Typography>
            <Input
              label="e.g. documents, invoices, test"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="dark:text-white text-xs sm:text-sm"
              labelProps={{ className: 'dark:text-gray-400 text-xs' }}
              crossOrigin=""
            />
          </div>
          {folderError && (
            <Typography className="text-xs text-red-500 font-medium">
              {folderError}
            </Typography>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-end gap-2">
          <Button variant="text" onClick={() => setCreateFolderModalOpen(false)} className="dark:text-gray-300 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            disabled={creatingFolder || !newFolderName.trim()}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-2 px-4"
          >
            {creatingFolder ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Upload Modal */}
      <Dialog
        open={uploadModalOpen}
        handler={() => setUploadModalOpen(false)}
        size="md"
        className="m-3 min-w-[calc(100%-1.5rem)] sm:min-w-[500px] dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <DialogHeader className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 text-base sm:text-lg">
          Upload Files to Cloud Storage
        </DialogHeader>

        <DialogBody className="space-y-4 pt-4 px-4 sm:px-6 max-h-[75vh] overflow-y-auto">
          {/* Target Provider Selector */}
          <div className="space-y-2">
            <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Select Target Storage Provider
            </Typography>
            <Select
              label="Cloud Storage Provider"
              value={selectedStorage}
              onChange={v => v && setSelectedStorage(v as any)}
              menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
              className="dark:text-white text-xs sm:text-sm"
              labelProps={{ className: 'dark:text-gray-400 text-xs' }}
            >
              <Option value="supabase">🟢 Supabase Storage (Live)</Option>
              <Option value="s3">🟧 Amazon S3 (Edge Function API)</Option>
              <Option value="google-drive">🔵 Google Drive (Edge Function API)</Option>
            </Select>
          </div>

          {/* Target Folder Selector */}
          <div className="space-y-2">
            <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Destination Folder Path
            </Typography>
            <Select
              label="Select Target Folder"
              value={targetFolder}
              onChange={v => v && setTargetFolder(v)}
              menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
              className="dark:text-white text-xs sm:text-sm"
              labelProps={{ className: 'dark:text-gray-400 text-xs' }}
            >
              {availableFolders.map(folder => (
                <Option key={folder} value={folder}>
                  📁 {folder}
                </Option>
              ))}
            </Select>
          </div>

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={e => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              handleStageFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${dragging
              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-sky-500'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleStageFiles(e.target.files)}
            />
            <BsCloudUpload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-sky-500 mb-2" />
            <Typography className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
              Drag & drop files into folder "{targetFolder}", or click to browse
            </Typography>
            <Typography className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports documents, images, videos, archives, and code files
            </Typography>
          </div>

          {/* Staged files list */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Staged Files ({stagedFiles.length})
              </Typography>
              {stagedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs gap-2">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-semibold text-gray-900 dark:text-white truncate block">{f.name}</span>
                    <span className="text-gray-500 font-mono text-[10px]">{formatSize(f.size)}</span>
                  </div>
                  <IconButton
                    size="sm"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStagedFiles(prev => prev.filter((_, i) => i !== idx))
                    }}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                  >
                    <BsTrash className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <Typography className="text-xs text-red-500 font-medium">
              {uploadError}
            </Typography>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between gap-2">
          <Button variant="text" onClick={() => setUploadModalOpen(false)} className="dark:text-gray-300 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            disabled={uploading || stagedFiles.length === 0}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-2 text-xs py-2 px-4"
          >
            {uploading ? 'Uploading...' : `Upload to ${selectedStorage.toUpperCase()} (${targetFolder})`}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        handler={() => setDeleteConfirmOpen(false)}
        size="xs"
        className="m-3 min-w-[calc(100%-1.5rem)] sm:min-w-[360px] dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <DialogHeader className="text-gray-900 dark:text-white text-base">
          Confirm File Deletion
        </DialogHeader>
        <DialogBody className="text-xs text-gray-600 dark:text-gray-300 px-4 sm:px-6">
          Are you sure you want to permanently delete{' '}
          <strong className="text-gray-900 dark:text-white truncate inline-block max-w-[200px] align-bottom">
            {fileToDelete?.name}
          </strong>{' '}
          from {fileToDelete?.storage.toUpperCase()} storage?
        </DialogBody>
        <DialogFooter className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <Button variant="text" onClick={() => setDeleteConfirmOpen(false)} className="dark:text-gray-300 text-xs">
            Cancel
          </Button>
          <Button
            color="red"
            disabled={deleting}
            onClick={handleConfirmDelete}
            className="text-xs font-semibold"
          >
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Presigned URL Sharing Modal */}
      <FilePresignedUrlModal
        open={presignedModalOpen}
        file={presignedTargetFile}
        onClose={() => setPresignedModalOpen(false)}
      />

      {/* Toast Notification Container in Bottom Right */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[9999] max-w-sm animate-fade-in-up">
          <Alert
            color={toastType === 'success' ? 'green' : 'red'}
            className="text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg"
            onClose={() => setToastMsg('')}
          >
            {toastMsg}
          </Alert>
        </div>
      )}
    </div>
  )
}
