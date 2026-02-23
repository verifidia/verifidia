import { IconMoonOutline18, IconSunOutline18 } from 'nucleo-ui-outline-18'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'

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
    <Button
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-7 w-7 rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={toggle}
      size="icon"
      variant="ghost"
    >
      {dark ? (
        <IconSunOutline18 className="h-3.5 w-3.5" />
      ) : (
        <IconMoonOutline18 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
