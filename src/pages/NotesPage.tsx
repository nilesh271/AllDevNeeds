import { useState, useEffect, useMemo, useRef } from 'react'
import { Typography, IconButton, Button } from '@material-tailwind/react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { 
  addNote, updateNote, deleteNote, Note,
  fetchNotesAsync, addNoteAsync, updateNoteAsync, deleteNoteAsync 
} from '../store/notesSlice'
import {
  BsTrash, BsSearch, BsFolder2Open, BsPencilSquare, BsChevronRight, BsChevronLeft,
  BsCloudUpload, BsShare, BsTypeBold, BsTypeItalic, BsListUl, BsListOl, BsCheckSquare,
  BsFolderFill, BsFillPinAngleFill, BsThreeDots, BsGrid3X3GapFill, BsLayoutSplit
} from 'react-icons/bs'
import { FiFolder, FiTrash2, FiFileText } from 'react-icons/fi'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc']

const formatNoteDate = (isoString: string) => {
  try {
    const date = new Date(isoString)
    const now = new Date()
    
    // If today: show time (e.g. 12:35 PM)
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    // If yesterday: show "Yesterday"
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    // Otherwise show date (e.g. 8/1/26)
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })
  } catch {
    return ''
  }
}

const formatEditorDate = (isoString: string) => {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString([], {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return ''
  }
}

const convertLegacyMarkdown = (text: string) => {
  if (text.includes('<') && text.includes('>')) return text; // already HTML
  // Very basic conversion for legacy notes
  return text.split('\n').map(line => {
    if (line.startsWith('- [ ] ')) {
      return `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${line.slice(6)}</p></li></ul>`;
    }
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      return `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>${line.slice(6)}</p></li></ul>`;
    }
    return `<p>${line || '<br>'}</p>`;
  }).join('');
}

const extractTextFromHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function NotesPage() {
  const dispatch = useAppDispatch()
  const { notes, syncStatus, loading } = useAppSelector(s => s.notes)
  const { isAuthenticated } = useAppSelector(s => s.auth)

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<'notes' | 'quick' | 'yellow' | 'green'>('notes')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScreen, setActiveScreen] = useState<'folders' | 'notes' | 'editor'>('notes')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const prevNotesLengthRef = useRef(notes.length)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load notes from Supabase on mount
  useEffect(() => {
    dispatch(fetchNotesAsync())
  }, [dispatch])

  // Filter notes by search query and category/folder
  const filteredNotes = useMemo(() => {
    let result = [...notes]

    // Folder filtration
    if (selectedFolder === 'quick') {
      result = result.filter(n => n.content.length < 150)
    } else if (selectedFolder === 'yellow') {
      result = result.filter(n => n.color === '#fef08a')
    } else if (selectedFolder === 'green') {
      result = result.filter(n => n.color === '#bbf7d0' || n.color === '#bfdbfe' || n.color === '#a5f3fc')
    }

    // Search query filtration
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    }

    // Sort by pinned first, then by updatedAt descending (latest edit first)
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [notes, selectedFolder, searchQuery])

  // Auto-select valid note when filteredNotes or notes length changes
  useEffect(() => {
    if (filteredNotes.length > 0) {
      const exists = filteredNotes.some(n => n.id === activeNoteId)
      if (!activeNoteId || !exists || notes.length > prevNotesLengthRef.current) {
        setActiveNoteId(filteredNotes[0].id)
      }
    } else {
      setActiveNoteId(null)
    }
    prevNotesLengthRef.current = notes.length
  }, [filteredNotes, notes.length])

  // Active note lookup
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null
  }, [notes, activeNoteId])

  const wordCount = useMemo(() => {
    if (!activeNote) return 0
    const text = extractTextFromHtml(activeNote.content)
    return text ? text.split(/\s+/).length : 0
  }, [activeNote])

  const charCount = useMemo(() => {
    return activeNote ? extractTextFromHtml(activeNote.content).length : 0
  }, [activeNote])

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200))
  }, [wordCount])

  // Handlers
  const handleAddNote = async () => {
    const actionResult = await dispatch(addNoteAsync({ title: 'New Note', content: '<p>Double click to edit content</p>' }))
    if (addNoteAsync.fulfilled.match(actionResult) && actionResult.payload) {
      setActiveNoteId(actionResult.payload.id)
    }
    setActiveScreen('editor')
  }

  const handleDeleteNote = (id: string) => {
    dispatch(deleteNoteAsync(id))
    if (activeNoteId === id) {
      const remainingNotes = notes.filter(n => n.id !== id)
      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id)
      } else {
        setActiveNoteId(null)
        setActiveScreen('notes')
      }
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeNoteId) {
      const newTitle = e.target.value
      dispatch(updateNote({ id: activeNoteId, title: newTitle })) // local optimistic
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        dispatch(updateNoteAsync({ id: activeNoteId, title: newTitle }))
      }, 500)
    }
  }

  // Tiptap Editor Initialization
  const activeNoteIdRef = useRef(activeNoteId)
  useEffect(() => {
    activeNoteIdRef.current = activeNoteId
  }, [activeNoteId])

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList.configure({
        HTMLAttributes: { class: 'task-list' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'task-list-item' },
      }),
    ],
    content: activeNote ? convertLegacyMarkdown(activeNote.content) : '',
    onUpdate: ({ editor }) => {
      if (activeNoteIdRef.current) {
        const html = editor.getHTML()
        dispatch(updateNote({ id: activeNoteIdRef.current, content: html })) // local optimistic
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          if (activeNoteIdRef.current) {
            dispatch(updateNoteAsync({ id: activeNoteIdRef.current, content: html }))
          }
        }, 600)
      }
    },
    editorProps: {
      attributes: {
        class: 'w-full max-w-full break-words whitespace-pre-wrap flex-grow text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-250 placeholder-gray-350 dark:placeholder-gray-750 transition-colors resize-none py-1 px-0 min-h-[300px] leading-relaxed',
      },
    },
  });

  // Sync when active note changes
  useEffect(() => {
    if (editor && activeNote) {
      const html = convertLegacyMarkdown(activeNote.content);
      // We only update if the editor's content is completely out of sync (e.g. note changed)
      if (editor.getHTML() !== activeNote.content && editor.getHTML() !== html) {
        editor.commands.setContent(html, { emitUpdate: false })
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent('', { emitUpdate: false })
    }
  }, [activeNoteId, editor])

  const applyFormatting = (action: 'bold' | 'italic' | 'h1' | 'h2' | 'bulletList' | 'taskList') => {
    if (!editor) return
    editor.chain().focus()
    
    if (action === 'bold') editor.chain().focus().toggleBold().run()
    else if (action === 'italic') editor.chain().focus().toggleItalic().run()
    else if (action === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
    else if (action === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
    else if (action === 'bulletList') editor.chain().focus().toggleBulletList().run()
    else if (action === 'taskList') editor.chain().focus().toggleTaskList().run()
  }

  const selectColor = (color: string) => {
    if (activeNoteId) {
      dispatch(updateNoteAsync({ id: activeNoteId, color }))
    }
  }

  // Folder Counts Helper
  const getFolderCount = (type: 'notes' | 'quick' | 'yellow' | 'green') => {
    if (type === 'notes') return notes.length
    if (type === 'quick') return notes.filter(n => n.content.length < 150).length
    if (type === 'yellow') return notes.filter(n => n.color === '#fef08a').length
    if (type === 'green') return notes.filter(n => n.color === '#bbf7d0' || n.color === '#bfdbfe' || n.color === '#a5f3fc').length
    return 0
  }

  return (
    <div className="fixed top-[57px] bottom-0 left-0 right-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 pt-2">
      <div className="w-full h-full min-h-0 flex flex-col">
        
        {/* macOS Container mimicking local Notes application window */}
        <div className="flex flex-col lg:flex-row h-full min-h-0 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#f4f4f6] dark:bg-[#16161a] overflow-hidden shadow-2xl transition-all duration-300">
          
          <div className="hidden lg:flex h-full min-h-0 w-56 bg-[#eaeaec] dark:bg-[#18181c] border-r border-gray-200 dark:border-gray-800 flex-col p-4.5 shrink-0 select-none">

            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 mt-2 px-1 scrollbar-none">
              {[
                { key: 'notes', label: 'All Notes', icon: <BsFolder2Open className="h-4 w-4 shrink-0 text-amber-500" /> },
                { key: 'quick', label: 'Quick Notes', icon: <FiFileText className="h-4 w-4 shrink-0 text-amber-500" /> },
                { key: 'yellow', label: 'Yellow Notes', icon: <BsFillPinAngleFill className="h-4 w-4 shrink-0 text-yellow-600" /> },
                { key: 'green', label: 'Green Notes', icon: <BsFillPinAngleFill className="h-4 w-4 shrink-0 text-teal-500" /> }
              ].map(folder => {
                const isActive = selectedFolder === folder.key
                return (
                  <div
                    key={folder.key}
                    onClick={() => {
                      setSelectedFolder(folder.key as any)
                      setActiveScreen('notes')
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 shrink-0 select-none ${
                      isActive
                        ? 'bg-[#dcdcdf] dark:bg-[#2c2c34] text-gray-900 dark:text-white font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-[#e4e4e7] dark:hover:bg-[#202026]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {folder.icon}
                      <span className="text-xs truncate">{folder.label}</span>
                    </div>
                    <span className="text-[10px] font-semibold opacity-60 ml-2 hidden lg:inline">
                      {getFolderCount(folder.key as any)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pane 2/3 Multi-View: Switchable between List and Grid Board layouts */}
          {viewMode === 'grid' ? (
            <div className="flex-grow flex flex-col h-full min-h-0 bg-[#f4f4f6] dark:bg-[#121216]/50 overflow-hidden">
              {/* Grid Header Toolbar */}
              <div className="px-3 sm:px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 sm:gap-4 bg-white/40 dark:bg-gray-900/30 backdrop-blur-xs select-none">
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <Typography className="text-gray-900 dark:text-white font-black text-xs sm:text-sm tracking-tight flex items-center gap-1 whitespace-nowrap shrink-0">
                    📌 Sticky Board
                  </Typography>
                </div>
                
                <div className="flex items-center gap-2 flex-grow max-w-md min-w-0">
                  <div className="relative flex-grow min-w-0">
                    <BsSearch className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full text-xs py-1.5 pl-8 pr-2 sm:pr-3 rounded-lg bg-gray-200/60 focus:bg-white dark:bg-gray-800/60 dark:focus:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 dark:text-white transition-colors placeholder-gray-400 font-medium truncate"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* View Mode Toggle Controls */}
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-250/60 dark:bg-gray-800/40 p-0.5 rounded-lg border border-gray-300/10 shrink-0">
                    <IconButton
                      size="sm"
                      variant="text"
                      onClick={() => setViewMode('list')}
                      className="h-7 w-7 rounded-md text-gray-500 hover:bg-[#e4e4e7] dark:hover:bg-gray-800 transition-all shrink-0"
                      title="List View"
                    >
                      <BsLayoutSplit className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="text"
                      onClick={() => setViewMode('grid')}
                      className="h-7 w-7 rounded-md bg-white dark:bg-gray-700 shadow-sm text-amber-500 font-bold transition-all shrink-0"
                      title="Grid View"
                    >
                      <BsGrid3X3GapFill className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                  <IconButton
                    size="sm"
                    variant="text"
                    onClick={handleAddNote}
                    className="text-gray-650 dark:text-gray-300 hover:bg-[#e4e4e7] dark:hover:bg-gray-800 shrink-0"
                    title="New Note"
                  >
                    <BsPencilSquare className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              {/* Horizontal Folder Filter Tabs (Mobile only) */}
              <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none border-b border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/20 shrink-0">
                {[
                  { key: 'notes', label: 'All Notes', icon: <BsFolder2Open className="h-3.5 w-3.5 shrink-0 text-amber-500" /> },
                  { key: 'quick', label: 'Quick Notes', icon: <FiFileText className="h-3.5 w-3.5 shrink-0 text-amber-500" /> },
                  { key: 'yellow', label: 'Yellow Notes', icon: <BsFillPinAngleFill className="h-3.5 w-3.5 shrink-0 text-yellow-600" /> },
                  { key: 'green', label: 'Green Notes', icon: <BsFillPinAngleFill className="h-3.5 w-3.5 shrink-0 text-teal-500" /> }
                ].map(folder => {
                  const isActive = selectedFolder === folder.key
                  return (
                    <button
                      key={folder.key}
                      onClick={() => setSelectedFolder(folder.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-xs font-bold'
                          : 'bg-gray-200/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-700'
                      }`}
                    >
                      {folder.icon}
                      <span>{folder.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 opacity-75'}`}>
                        {getFolderCount(folder.key as any)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Grid content space */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 min-h-0">
                {filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <FiTrash2 className="h-8 w-8 text-gray-400 mb-2.5" />
                    <Typography className="text-sm font-semibold text-gray-550">No notes found in this folder.</Typography>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filteredNotes.map(note => {
                      const snippet = note.content
                        ? extractTextFromHtml(note.content).replace(/^\s*#\s+[^\n]*/g, '').trim()
                        : ''
                      
                      return (
                        <div
                          key={note.id}
                          onClick={() => {
                            setActiveNoteId(note.id)
                            setViewMode('list')
                            setActiveScreen('editor')
                          }}
                          className={`group relative flex flex-col justify-between h-48 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-md hover:-translate-y-1 hover:rotate-1 hover:scale-102 hover:shadow-xl transition-all duration-200 select-none border border-black/[0.04] dark:border-white/[0.04] overflow-hidden ${
                            note.pinned ? 'ring-2 ring-yellow-500/20' : ''
                          }`}
                          style={{
                            backgroundColor: note.color,
                            color: '#1e293b' // Keep text dark and readable for sticky note papers!
                          }}
                        >
                          <div className="text-left min-h-0 flex-grow flex flex-col overflow-hidden">
                            <div className="flex justify-between items-start gap-2 mb-1.5 shrink-0">
                              <Typography className="font-extrabold text-sm truncate flex-grow text-left text-gray-900">
                                {note.title || 'Untitled Note'}
                              </Typography>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(updateNoteAsync({ id: note.id, pinned: !note.pinned }))
                                  }}
                                  className={`p-1 rounded transition-all duration-150 ${
                                    note.pinned 
                                      ? 'text-yellow-600 hover:text-yellow-750' 
                                      : 'opacity-0 group-hover:opacity-50 hover:opacity-100 text-gray-700 hover:bg-black/5'
                                  }`}
                                  title={note.pinned ? "Unpin Note" : "Pin Note"}
                                >
                                  <BsFillPinAngleFill className={`h-3.5 w-3.5 ${note.pinned ? 'rotate-45' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNote(note.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-50 hover:opacity-100 p-1 text-gray-750 hover:text-red-750 hover:bg-black/5 rounded transition-all duration-150"
                                  title="Delete Note"
                                >
                                  <BsTrash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <Typography className="text-xs leading-relaxed text-gray-800 text-left line-clamp-3 overflow-hidden font-medium">
                              {snippet || 'No additional text'}
                            </Typography>
                          </div>

                          {/* Interactive Hover Color Picker Toolbar */}
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-full shadow-md border border-black/5 z-10">
                            {COLORS.map(c => (
                              <button
                                key={c}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch(updateNote({ id: note.id, color: c }))
                                }}
                                className={`w-3.5 h-3.5 rounded-full border transition-transform hover:scale-120 ${
                                  note.color === c ? 'scale-110 ring-1 ring-amber-500 border-white' : 'border-black/10'
                                }`}
                                style={{ backgroundColor: c }}
                                title="Change Color"
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/[0.06] text-[10px] font-bold text-left text-gray-650 shrink-0 group-hover:opacity-20 transition-opacity duration-150">
                            <span className="text-left">{formatNoteDate(note.updatedAt)}</span>
                            <span className="bg-black/5 px-2 py-0.5 rounded-full capitalize">
                              {note.content.length < 150 ? 'quick' : 'long'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Grid status bar */}
              <div className="py-2 px-5 border-t border-gray-250 dark:border-gray-800/80 bg-white/20 dark:bg-gray-900/20 text-[10px] text-gray-500 font-bold select-none text-right">
                {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''} in folder
              </div>
            </div>
          ) : (
            <>
              {/* Pane 2: Notes List Sidebar with Search */}
              <div className={`${activeScreen === 'notes' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-250 dark:border-gray-800 bg-[#f5f5f7] dark:bg-[#1c1c22] flex-col shrink-0`}>
                {/* Search and Action Bar */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                  <div className="relative flex-grow">
                    <BsSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full text-xs py-1.5 pl-8 pr-3 rounded-lg bg-gray-200/60 focus:bg-white dark:bg-gray-800/60 dark:focus:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 dark:text-white transition-colors placeholder-gray-400 font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 bg-gray-200/40 dark:bg-gray-800/40 p-0.5 rounded-lg border border-gray-300/10">
                    <IconButton
                      size="sm"
                      variant="text"
                      onClick={() => setViewMode('list')}
                      className="h-6 w-6 rounded-md bg-white dark:bg-gray-700 shadow-xs text-amber-500 font-bold transition-all shrink-0 animate-fade-in"
                      title="List View"
                    >
                      <BsLayoutSplit className="h-3 w-3" />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="text"
                      onClick={() => setViewMode('grid')}
                      className="h-6 w-6 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-850 transition-all shrink-0"
                      title="Grid View"
                    >
                      <BsGrid3X3GapFill className="h-3 w-3" />
                    </IconButton>
                  </div>
                  <IconButton
                    size="sm"
                    variant="text"
                    onClick={handleAddNote}
                    className="text-gray-650 dark:text-gray-300 hover:bg-[#e4e4e7] dark:hover:bg-gray-850 shrink-0"
                    title="New Note"
                  >
                    <BsPencilSquare className="h-4 w-4" />
                  </IconButton>
                </div>

                {/* Horizontal Folder Filter Tabs (Mobile only) */}
                <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none border-b border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/20 shrink-0">
                  {[
                    { key: 'notes', label: 'All Notes', icon: <BsFolder2Open className="h-3.5 w-3.5 shrink-0 text-amber-500" /> },
                    { key: 'quick', label: 'Quick Notes', icon: <FiFileText className="h-3.5 w-3.5 shrink-0 text-amber-500" /> },
                    { key: 'yellow', label: 'Yellow Notes', icon: <BsFillPinAngleFill className="h-3.5 w-3.5 shrink-0 text-yellow-600" /> },
                    { key: 'green', label: 'Green Notes', icon: <BsFillPinAngleFill className="h-3.5 w-3.5 shrink-0 text-teal-500" /> }
                  ].map(folder => {
                    const isActive = selectedFolder === folder.key
                    return (
                      <button
                        key={folder.key}
                        onClick={() => setSelectedFolder(folder.key as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-xs font-bold'
                            : 'bg-gray-200/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-700'
                        }`}
                      >
                        {folder.icon}
                        <span>{folder.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 opacity-75'}`}>
                          {getFolderCount(folder.key as any)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Scrollable list of filtered notes */}
                <div className="flex-grow overflow-y-auto py-2">
                  {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                      <FiTrash2 className="h-6 w-6 text-gray-400 mb-1.5 animate-bounce" />
                      <Typography className="text-xs font-semibold text-gray-505">No Notes Found</Typography>
                    </div>
                  ) : (
                    filteredNotes.map(note => {
                      const isActive = activeNoteId === note.id
                      const snippet = note.content
                        ? extractTextFromHtml(note.content).replace(/^\s*#\s+[^\n]*/g, '').trim()
                        : ''

                      return (
                        <div
                          key={note.id}
                          onClick={() => {
                            setActiveNoteId(note.id)
                            setActiveScreen('editor')
                          }}
                          className={`mx-2 my-1.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-150 flex flex-col gap-1 border-l-[3.5px] ${
                            isActive
                              ? 'bg-amber-100/50 dark:bg-amber-500/10 border-amber-500 text-gray-950 dark:text-white font-bold'
                              : 'border-transparent hover:bg-[#dcdcdf]/40 dark:hover:bg-[#202026]/40 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/10" 
                                style={{ backgroundColor: note.color }}
                              />
                              <Typography className={`text-xs truncate flex-grow ${isActive ? 'font-black' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                                {note.title || 'Untitled Note'}
                              </Typography>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {note.pinned && (
                                <BsFillPinAngleFill className="h-2.5 w-2.5 text-yellow-600 dark:text-yellow-500 rotate-45" title="Pinned Note" />
                              )}
                              <span className="text-[9px] opacity-60 select-none font-bold">
                                {formatNoteDate(note.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <Typography className="text-[11px] opacity-75 line-clamp-2 truncate font-medium pl-4">
                            {snippet || 'No additional text'}
                          </Typography>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Sidebar Status Footer */}
                <div className="py-2.5 px-4 text-center border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 font-bold select-none">
                  {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Pane 3: Main Rich Editor Canvas */}
              <div
                className={`${activeScreen === 'editor' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 flex-grow flex-col relative transition-all duration-300 bg-[#fbfbfe] dark:bg-[#121216]`}
              >
                {activeNote ? (
                  <>
                    {/* Editor Action Toolbar */}
                    <div className="py-2 px-3 sm:px-4 border-b border-gray-200 dark:border-gray-850 bg-white/60 dark:bg-[#18181c]/60 backdrop-blur-md flex items-center gap-1 select-none">
                      {/* Fixed Back Button (Mobile only) */}
                      <div className="lg:hidden flex items-center shrink-0">
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => setActiveScreen('notes')}
                          className="text-amber-500 hover:bg-[#e4e4e7] dark:hover:bg-[#282830] flex items-center gap-1 px-2 py-1 text-xs font-black shrink-0"
                        >
                          <BsChevronLeft className="h-3.5 w-3.5" /> Notes
                        </Button>
                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1 shrink-0" />
                      </div>

                      {/* Horizontal Scrollable Tools Area */}
                      <div className="flex-grow flex items-center justify-between gap-3 overflow-x-auto scrollbar-none min-w-0 py-0.5">
                        {/* Formatter shortcuts */}
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('bold')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-805 ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Bold Text"
                          >
                            <BsTypeBold className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('italic')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-805 ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Italic Text"
                          >
                            <BsTypeItalic className="h-4 w-4" />
                          </IconButton>
                          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1 shrink-0" />
                          
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('h1')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-805 font-bold text-xs ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Insert Title Header"
                          >
                            H1
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('h2')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-850 font-bold text-xs ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Insert Subtitle Header"
                          >
                            H2
                          </IconButton>
                          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1 shrink-0" />
                          
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('bulletList')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-850 ${editor?.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Bullet List"
                          >
                            <BsListUl className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => applyFormatting('taskList')}
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-850 ${editor?.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                            title="Checklist"
                          >
                            <BsCheckSquare className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>

                        {/* Right Controls: Colors, Pin, Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Note Color Tint Selector */}
                          <div className="flex items-center gap-1.5 border border-gray-250 dark:border-gray-800 rounded-xl p-1 bg-white/70 dark:bg-gray-800/40 shrink-0">
                            {COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => selectColor(c)}
                                className={`w-4 h-4 rounded-full border border-white dark:border-gray-900 transition-all duration-150 shrink-0 ${
                                  activeNote.color === c 
                                    ? 'scale-125 ring-2 ring-amber-500/80' 
                                    : 'hover:scale-115'
                                }`}
                                style={{ backgroundColor: c }}
                                title="Change Note Color"
                              />
                            ))}
                          </div>

                          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />

                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => dispatch(updateNoteAsync({ id: activeNote.id, pinned: !activeNote.pinned }))}
                            className={`shrink-0 ${
                              activeNote.pinned 
                                ? 'text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/20' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-805'
                            }`}
                            title={activeNote.pinned ? "Unpin Note" : "Pin Note"}
                          >
                            <BsFillPinAngleFill className={`h-4 w-4 ${activeNote.pinned ? 'rotate-45' : ''}`} />
                          </IconButton>

                          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />

                          <IconButton
                            size="sm"
                            variant="text"
                            onClick={() => handleDeleteNote(activeNote.id)}
                            className="text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                            title="Delete Note"
                          >
                            <BsTrash className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </div>
                    </div>

                    {/* Editor Content Area */}
                    <div 
                      className="flex-grow flex flex-col px-4 py-2 md:px-10 md:py-6 overflow-y-auto overflow-x-hidden space-y-3 transition-colors duration-300 min-h-0"
                      style={{
                        backgroundColor: activeNote.color + '0c', // Subtle transparent paper tint matching note's color!
                      }}
                    >
                      <div className="text-center select-none mb-1">
                        <Typography className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {formatEditorDate(activeNote.updatedAt)}
                        </Typography>
                      </div>

                      {/* Glass canvas block framing the text editor inputs */}
                      <div className="flex-grow flex flex-col p-4 md:px-8 md:pt-6 md:pb-8 rounded-2xl border border-gray-200/50 dark:border-gray-800/40 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-xs space-y-4 overflow-x-hidden min-h-0">
                        {/* Title input */}
                        <input
                          type="text"
                          value={activeNote.title}
                          onChange={handleTitleChange}
                          placeholder="Untitled Note"
                          className="w-full text-2xl font-black bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 transition-colors py-1 px-0"
                        />

                        {/* Divider */}
                        <hr className="border-gray-150 dark:border-gray-800/60" />

                        {/* Body Tiptap Editor */}
                        <EditorContent editor={editor} className="w-full flex-grow flex flex-col tiptap-editor-container min-h-[300px]" />
                      </div>
                    </div>

                    {/* Editor Status Footer Bar */}
                    <div className="py-2.5 px-6 border-t border-gray-200 dark:border-gray-850 bg-white/40 dark:bg-[#16161a]/40 backdrop-blur-md flex items-center justify-between text-[9px] font-bold text-gray-550 select-none">
                      <div className="flex items-center gap-1.5">
                        {syncStatus === 'synced' && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Synced to Supabase DB</span>
                          </>
                        )}
                        {syncStatus === 'saving' && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-amber-600 dark:text-amber-400">Syncing to Supabase...</span>
                          </>
                        )}
                        {syncStatus === 'error' && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-rose-500">Sync Error (Local copy active)</span>
                          </>
                        )}
                        {syncStatus === 'local' && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Saved in Browser (Local Mode)</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{charCount} Characters</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                        <span>{wordCount} Words</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                        <span>{readingTime} min read</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-gray-900/10">
                    <FiFileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3 animate-pulse" />
                    <Typography className="font-semibold text-gray-700 dark:text-gray-400 text-lg mb-1">
                      No Note Selected
                    </Typography>
                    <Typography className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mb-4">
                      Select a sticky note from the sidebar lists or create a new note to start writing.
                    </Typography>
                    <Button
                      onClick={handleAddNote}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <BsPencilSquare className="h-4 w-4" /> Create New Note
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
