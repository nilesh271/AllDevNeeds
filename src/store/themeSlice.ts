import { createSlice } from '@reduxjs/toolkit'

const stored = localStorage.getItem('adn_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = stored ? stored === 'dark' : prefersDark

if (isDark) document.documentElement.classList.add('dark')

const themeSlice = createSlice({
  name: 'theme',
  initialState: { dark: isDark },
  reducers: {
    toggleTheme(state) {
      state.dark = !state.dark
      if (state.dark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('adn_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('adn_theme', 'light')
      }
    },
  },
})

export const { toggleTheme } = themeSlice.actions
export default themeSlice.reducer
