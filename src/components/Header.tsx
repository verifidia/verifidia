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
      <div className="px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="text-sm font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Verifidia
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="relative w-full">
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
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ParaglideLocaleSwitcher />
          <BetterAuthHeader />
        </div>
      </div>
    </header>
  )
}
