import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FileRecord {
  id: string
  name: string
  size: number
  type: string
  storage: 'google-drive' | 'supabase'
  timestamp: string
}

interface FilesState {
  files: FileRecord[]
}

const storedFiles = localStorage.getItem('adn_files')

const initialState: FilesState = {
  files: storedFiles ? JSON.parse(storedFiles) : [
    {
      id: 'file-default-1',
      name: 'Welcome-Guide.pdf',
      size: 2541000,
      type: 'application/pdf',
      storage: 'supabase',
      timestamp: new Date().toISOString()
    }
  ]
}

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFiles(state, action: PayloadAction<FileRecord[]>) {
      state.files = [...state.files, ...action.payload]
      localStorage.setItem('adn_files', JSON.stringify(state.files))
    },
    deleteFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter(f => f.id !== action.payload)
      localStorage.setItem('adn_files', JSON.stringify(state.files))
    },
    updateFiles(state, action: PayloadAction<FileRecord[]>) {
      state.files = action.payload
      localStorage.setItem('adn_files', JSON.stringify(state.files))
    },
  },
})

export const { addFiles, deleteFile, updateFiles } = filesSlice.actions
export default filesSlice.reducer
