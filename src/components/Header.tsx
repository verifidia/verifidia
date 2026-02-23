import { Link, useNavigate } from '@tanstack/react-router'
import ParaglideLocaleSwitcher from './LocaleSwitcher'
import BetterAuthHeader from '../integrations/better-auth/header-user'
import { IconMagnifierOutline24 } from 'nucleo-core-outline-24'
import { Input } from '#/components/ui/input'
import { m } from '#/paraglide/messages'

export default function Header() {
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q') as string
    if (query?.trim()) {
      void navigate({
        to: '/search',
        search: { q: query.trim() },
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="grid grid-cols-[1fr_2fr_1fr] h-11 items-center px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-sm font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Verifidia
          </Link>
        </div>

        {/* Center: Search — always centered via equal 1fr side columns */}
        <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="w-3.5 h-3.5" />
          </div>
          <Input
            type="search"
            name="q"
            placeholder={m.search_placeholder()}
            className="w-full h-8 text-sm pl-8 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-ring shadow-none rounded-sm transition-colors"
          />
        </form>
        <div className="flex items-center justify-end gap-2">
          <ParaglideLocaleSwitcher />
          <BetterAuthHeader />
        </div>
      </div>
    </header>
  )
}
