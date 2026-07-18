import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import themeReducer from './themeSlice'
import filesReducer from "./filesSlice";
import learningReducer from "./learningSlice";
import notesReducer from "./notesSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    notes: notesReducer,
    learning: learningReducer,
    files: filesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
