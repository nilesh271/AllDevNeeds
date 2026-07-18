import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LearningItem {
  id: string
  title: string
  description: string
  category: string
  url: string
  thumbnail?: string
  createdAt: string
}

interface LearningState {
  items: LearningItem[]
}

const storedLearning = localStorage.getItem('adn_learning')

const defaultLearning: LearningItem[] = [
  {
    id: 'learn-1',
    title: 'React Official Documentation',
    description: 'Learn React from the official documentation, covering basic to advanced topics like hooks, context, and concurrent features.',
    category: 'React',
    url: 'https://react.dev',
    thumbnail: 'https://react.dev/images/og-association.png',
    createdAt: new Date().toISOString()
  },
  {
    id: 'learn-2',
    title: 'TypeScript Deep Dive',
    description: 'A comprehensive guide to TypeScript, explaining type annotations, interfaces, generics, advanced utility types, and compiler configurations.',
    category: 'TypeScript',
    url: 'https://basarat.gitbook.io/typescript',
    createdAt: new Date().toISOString()
  },
  {
    id: 'learn-3',
    title: 'Redux Toolkit Essentials',
    description: 'The official Redux Toolkit tutorial, covering store setup, creating slices, dispatching actions, and utilizing thunks for async logic.',
    category: 'Redux',
    url: 'https://redux-toolkit.js.org',
    createdAt: new Date().toISOString()
  }
]

const initialState: LearningState = {
  items: storedLearning ? JSON.parse(storedLearning) : defaultLearning
}

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Omit<LearningItem, 'id' | 'createdAt'>>) {
      const newItem: LearningItem = {
        ...action.payload,
        id: `learn-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      state.items.push(newItem)
      localStorage.setItem('adn_learning', JSON.stringify(state.items))
    },
    updateItem(state, action: PayloadAction<LearningItem>) {
      const idx = state.items.findIndex(i => i.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = action.payload
        localStorage.setItem('adn_learning', JSON.stringify(state.items))
      }
    },
    deleteItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload)
      localStorage.setItem('adn_learning', JSON.stringify(state.items))
    }
  },
})

export const { addItem, updateItem, deleteItem } = learningSlice.actions
export default learningSlice.reducer
