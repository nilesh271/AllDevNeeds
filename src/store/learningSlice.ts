import { createSlice, PayloadAction } from '@reduxjs/toolkit'


interface LearningState {

}

const storedUser = localStorage.getItem('adn_user')

const initialState: LearningState = {
  // Define initial state for learning resources
}

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
   
  },
})

export const {  } = learningSlice.actions
export default learningSlice.reducer
