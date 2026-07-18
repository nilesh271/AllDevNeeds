import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  username: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const storedUser = localStorage.getItem('adn_user')

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('adn_user', JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('adn_user')
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
