// Clear localStorage and sessionStorage
console.log('Clearing all storage...')

// Clear localStorage
try {
  const localStorageKeys = Object.keys(localStorage)
  console.log('LocalStorage keys to clear:', localStorageKeys)
  localStorage.clear()
  console.log('LocalStorage cleared')
} catch (e) {
  console.error('Error clearing localStorage:', e)
}

// Clear sessionStorage
try {
  const sessionStorageKeys = Object.keys(sessionStorage)
  console.log('SessionStorage keys to clear:', sessionStorageKeys)
  sessionStorage.clear()
  console.log('SessionStorage cleared')
} catch (e) {
  console.error('Error clearing sessionStorage:', e)
}

console.log('All storage cleared! Please refresh the page.')
