import { createSlice, PayloadAction } from '@reduxjs/toolkit'


interface NoteState {

}

const storedUser = localStorage.getItem('adn_user')

const initialState: NoteState = {
  // Define initial state for notes
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote(state, action: PayloadAction<any>) {
      // Implement logic to add notes to the state
    },
    deleteNote(state, action: PayloadAction<any>) {
      // Implement logic to delete notes from the state
    },
    reorderNotes(state, action: PayloadAction<any>) {
      // Implement logic to update notes in the state
    },
    updateNote(state, action: PayloadAction<any>) {
      // Implement logic to update notes in the state
    },
  },
})

export const { addNote, deleteNote, reorderNotes, updateNote } = notesSlice.actions
export default notesSlice.reducer
