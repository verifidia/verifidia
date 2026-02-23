import { useState, useEffect, useCallback } from 'react'
import { IconSunOutline18, IconMoonOutline18 } from 'nucleo-ui-outline-18'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
    >
      {dark ? (
        <IconSunOutline18 className="w-3.5 h-3.5" />
      ) : (
        <IconMoonOutline18 className="w-3.5 h-3.5" />
      )}
    </button>
  )
}
