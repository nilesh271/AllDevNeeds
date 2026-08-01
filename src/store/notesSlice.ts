import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { notesService } from '../services/notesService'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  updatedAt: string
  pinned?: boolean
}

export type SyncStatus = 'synced' | 'saving' | 'error' | 'local'

interface NoteState {
  notes: Note[]
  loading: boolean
  syncStatus: SyncStatus
  error: string | null
}

const storedNotes = localStorage.getItem('adn_notes')

const defaultNotes: Note[] = [
  {
    id: 'note-default-1',
    title: 'Welcome to DevTools!',
    content: '<p>This is a sticky notes board. You can drag and drop notes to reorder them, hover to change color or delete, and double-click any note to edit its title and content.</p>',
    color: '#fef08a',
    updatedAt: new Date().toISOString(),
    pinned: true
  }
]

const initialState: NoteState = {
  notes: storedNotes ? JSON.parse(storedNotes) : defaultNotes,
  loading: false,
  syncStatus: 'local',
  error: null
}

// Async Thunks for Supabase integration
export const fetchNotesAsync = createAsyncThunk(
  'notes/fetchNotesAsync',
  async (_, { rejectWithValue }) => {
    try {
      const data = await notesService.fetchNotes()
      return data
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch notes from Supabase')
    }
  }
)

export const addNoteAsync = createAsyncThunk(
  'notes/addNoteAsync',
  async (note: Partial<Note> | undefined, { rejectWithValue }) => {
    try {
      const newNote = await notesService.createNote(note || {})
      return newNote
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create note in Supabase')
    }
  }
)

export const updateNoteAsync = createAsyncThunk(
  'notes/updateNoteAsync',
  async (payload: Partial<Note> & { id: string }, { rejectWithValue }) => {
    try {
      const updatedNote = await notesService.updateNote(payload.id, payload)
      return updatedNote || payload
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update note in Supabase')
    }
  }
)

export const deleteNoteAsync = createAsyncThunk(
  'notes/deleteNoteAsync',
  async (id: string, { rejectWithValue }) => {
    try {
      await notesService.deleteNote(id)
      return id
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete note from Supabase')
    }
  }
)

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // Synchronous local actions (fallback / offline usage)
    addNote(state) {
      const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc']
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: 'New Note',
        content: '<p>Double click to edit content</p>',
        color: colors[Math.floor(Math.random() * colors.length)],
        updatedAt: new Date().toISOString()
      }
      state.notes.push(newNote)
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    },
    deleteNote(state, action: PayloadAction<string>) {
      state.notes = state.notes.filter(n => n.id !== action.payload)
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    },
    reorderNotes(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    },
    updateNote(state, action: PayloadAction<Partial<Note> & { id: string }>) {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) {
        Object.assign(note, action.payload)
        note.updatedAt = new Date().toISOString()
        localStorage.setItem('adn_notes', JSON.stringify(state.notes))
      }
    },
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.syncStatus = action.payload
    }
  },
  extraReducers: (builder) => {
    // Fetch Notes
    builder.addCase(fetchNotesAsync.pending, (state) => {
      state.loading = true
      state.syncStatus = 'saving'
      state.error = null
    })
    builder.addCase(fetchNotesAsync.fulfilled, (state, action) => {
      state.loading = false
      state.notes = action.payload
      state.syncStatus = 'synced'
      localStorage.setItem('adn_notes', JSON.stringify(action.payload))
    })
    builder.addCase(fetchNotesAsync.rejected, (state, action) => {
      state.loading = false
      state.syncStatus = 'local'
      state.error = action.payload as string
    })

    // Add Note Async
    builder.addCase(addNoteAsync.pending, (state) => {
      state.syncStatus = 'saving'
    })
    builder.addCase(addNoteAsync.fulfilled, (state, action) => {
      state.notes.unshift(action.payload)
      state.syncStatus = 'synced'
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    })
    builder.addCase(addNoteAsync.rejected, (state, action) => {
      state.syncStatus = 'error'
      state.error = action.payload as string
      // Fallback local creation
      const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc']
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: 'New Note',
        content: '<p>Double click to edit content</p>',
        color: colors[Math.floor(Math.random() * colors.length)],
        updatedAt: new Date().toISOString()
      }
      state.notes.unshift(newNote)
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    })

    // Update Note Async
    builder.addCase(updateNoteAsync.pending, (state, action) => {
      state.syncStatus = 'saving'
      const note = state.notes.find(n => n.id === action.meta.arg.id)
      if (note) {
        Object.assign(note, action.meta.arg)
        note.updatedAt = new Date().toISOString()
      }
    })
    builder.addCase(updateNoteAsync.fulfilled, (state, action) => {
      state.syncStatus = 'synced'
      if (action.payload && action.payload.id) {
        const noteIndex = state.notes.findIndex(n => n.id === action.payload.id)
        if (noteIndex !== -1) {
          state.notes[noteIndex] = action.payload as Note
        }
      }
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    })
    builder.addCase(updateNoteAsync.rejected, (state, action) => {
      state.syncStatus = 'error'
      state.error = action.payload as string
    })

    // Delete Note Async
    builder.addCase(deleteNoteAsync.pending, (state, action) => {
      state.syncStatus = 'saving'
      state.notes = state.notes.filter(n => n.id !== action.meta.arg)
    })
    builder.addCase(deleteNoteAsync.fulfilled, (state) => {
      state.syncStatus = 'synced'
      localStorage.setItem('adn_notes', JSON.stringify(state.notes))
    })
    builder.addCase(deleteNoteAsync.rejected, (state, action) => {
      state.syncStatus = 'error'
      state.error = action.payload as string
    })
  }
})

export const { addNote, deleteNote, reorderNotes, updateNote, setSyncStatus } = notesSlice.actions
export default notesSlice.reducer
