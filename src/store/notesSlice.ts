import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  updatedAt: string
}

interface NoteState {
  notes: Note[]
}

const storedNotes = localStorage.getItem('adn_notes')

const defaultNotes: Note[] = [
  {
    id: 'note-default-1',
    title: 'Welcome to DevTools!',
    content: 'This is a sticky notes board. You can drag and drop notes to reorder them, hover to change color or delete, and double-click any note to edit its title and content.',
    color: '#fef08a',
    updatedAt: new Date().toISOString()
  }
]

const initialState: NoteState = {
  notes: storedNotes ? JSON.parse(storedNotes) : defaultNotes
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote(state) {
      const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc']
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: 'New Note',
        content: 'Double click to edit content',
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
  },
})

export const { addNote, deleteNote, reorderNotes, updateNote } = notesSlice.actions
export default notesSlice.reducer
