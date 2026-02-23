import { Link, useNavigate } from '@tanstack/react-router'
import { IconMagnifierOutline18 } from 'nucleo-ui-outline-18'
import { Input } from '#/components/ui/input'
import { m } from '#/paraglide/messages'
import BetterAuthHeader from '../integrations/better-auth/header-user'
import ParaglideLocaleSwitcher from './locale-switcher'
import ThemeToggle from './theme-toggle'

export default function Header() {
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q') as string
    if (query?.trim()) {
      navigate({
        to: '/search',
        search: { q: query.trim() },
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-border border-b bg-background">
      <div className="grid h-11 grid-cols-[1fr_2fr_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            to="/"
          >
            <img
              alt="Verifidia"
              className="h-6 w-6"
              height={24}
              src="/logo.png"
              width={24}
            />
            <span className="font-medium text-foreground text-sm tracking-tight">
              Verifidia
            </span>
          </Link>
        </div>

        {/* Center: Search — always centered via equal 1fr side columns */}
        <form
          className="relative mx-auto w-full max-w-xl"
          onSubmit={handleSearch}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted-foreground">
            <IconMagnifierOutline18 className="h-3.5 w-3.5" />
          </div>
          <Input
            className="h-8 w-full rounded-sm border-transparent bg-muted/40 pl-8 text-sm shadow-none transition-colors focus-visible:border-ring focus-visible:bg-background"
            name="q"
            placeholder={m.search_placeholder()}
            type="search"
          />
        </form>
        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1">
          <ParaglideLocaleSwitcher />
          <ThemeToggle />
          <BetterAuthHeader />
        </div>
      </div>
    </header>
  )
}
