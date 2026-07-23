import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type StorageProvider = 'supabase' | 's3' | 'google-drive'

export interface FileRecord {
  id: string
  name: string
  size: number
  type: string
  storage: StorageProvider
  timestamp: string
  url?: string
  path?: string
  folder?: string
  bucket?: string
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
      path: 'files/Welcome-Guide.pdf',
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
    moveFileRecord(state, action: PayloadAction<{ id: string; targetFolder: string; newPath?: string; newUrl?: string }>) {
      const file = state.files.find(f => f.id === action.payload.id)
      if (file) {
        file.folder = action.payload.targetFolder
        if (action.payload.newPath) file.path = action.payload.newPath
        if (action.payload.newUrl) file.url = action.payload.newUrl
        localStorage.setItem('adn_files', JSON.stringify(state.files))
      }
    },
  },
})

export const { addFiles, deleteFile, updateFiles, moveFileRecord } = filesSlice.actions
export default filesSlice.reducer
