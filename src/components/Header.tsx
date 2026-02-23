import { Link } from '@tanstack/react-router'
import ParaglideLocaleSwitcher from './LocaleSwitcher'
import BetterAuthHeader from '../integrations/better-auth/header-user'
import { IconMagnifierOutline24 } from 'nucleo-core-outline-24'
import { Input } from '#/components/ui/input'
import { m } from '#/paraglide/messages'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Verifidia
          </Link>
        </div>

        {/* Center: Search (hidden on mobile, shown on md+) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="w-4 h-4" />
          </div>
          <Input 
            type="search" 
            placeholder={m.search_placeholder()} 
            className="w-full pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-ring"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ParaglideLocaleSwitcher />
          </div>
          <BetterAuthHeader />
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-border/50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="w-4 h-4" />
          </div>
          <Input 
            type="search" 
            placeholder={m.search_placeholder()} 
            className="w-full pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-ring"
          />
        </div>
        <div className="mt-3 sm:hidden flex justify-end">
          <ParaglideLocaleSwitcher />
        </div>
      </div>
    </header>
  )
}
