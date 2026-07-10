import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('rym-theme') : null
    return saved === 'light' ? 'light' : 'dark' // dark by default
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('rym-theme', theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])

  return { theme, toggle }
}
