import { createSlice, PayloadAction } from '@reduxjs/toolkit'


interface FilesState {

}

const storedUser = localStorage.getItem('adn_user')

const initialState: FilesState = {
  // Define initial state for files
}

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFiles(state, action: PayloadAction<any>) {
      // Implement logic to add files to the state
    },
    deleteFile(state, action: PayloadAction<any>) {
      // Implement logic to delete files from the state
    },
    updateFiles(state, action: PayloadAction<any>) {
      // Implement logic to update files in the state
    },
  },
})

export const { addFiles, deleteFile, updateFiles } = filesSlice.actions
export default filesSlice.reducer
