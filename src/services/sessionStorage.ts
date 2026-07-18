export const setValue = (key: string, value: any): void => {
  try {
    const serializedValue = JSON.stringify(value)
    sessionStorage.setItem(key, serializedValue)
  } catch (error) {
    console.error('Error setting session storage item:', error)
  }
}

export const getValue = <T>(key: string): T | null => {
  try {
    const serializedValue = sessionStorage.getItem(key)
    if (serializedValue === null) {
      return null
    }
    return JSON.parse(serializedValue) as T
  } catch (error) {
    console.error('Error getting session storage item:', error)
    return null
  }
}

export const removeValue = (key: string): void => {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing session storage item:', error)
  }
}