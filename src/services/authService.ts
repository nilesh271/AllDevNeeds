import supabase from './supabase'
import type { User } from '../store/authSlice'
import { setValue, removeValue } from "./sessionStorage";

export interface LoginCredentials {
  username: string
  password: string
}

const SESSION_KEY = 'session'
const PROFILE_KEY = 'profile'

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const username = credentials.username.trim()
    const password = credentials.password.trim()

    const {data, error} = await supabase.auth.signInWithPassword({ email: username, password })

    if(error) {
      throw new Error('Invalid username or password')
    }

    setValue(PROFILE_KEY, data.user)
    setValue(SESSION_KEY, data.session)

    return {
      username: data?.user?.email || '' ,
      role: data?.user?.role
    }
  },

  async signup(credentials: LoginCredentials & { email: string }): Promise<User> {
    const username = credentials.username.trim()

    if (username === 'admin') {
      throw new Error('Username already taken')
    }

    return { username, role: 'user' }
  },

  async logout(): Promise<void> {
    removeValue(PROFILE_KEY)
    removeValue(SESSION_KEY)
    await supabase.auth.signOut()
  },
}