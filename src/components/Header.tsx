import { Link } from '@tanstack/react-router'
import ParaglideLocaleSwitcher from './LocaleSwitcher.tsx'
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'
import { IconMagnifierOutline24 } from 'nucleo-core-outline-24'
import { Input } from '#/components/ui/input'
import * as m from '#/paraglide/messages'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Verifidia
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center max-w-md mx-auto hidden md:flex">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <IconMagnifierOutline24 className="h-4 w-4 opacity-70" />
            </div>
            <Input
              type="search"
              placeholder={m.search_placeholder()}
              className="w-full pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-ring"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <ParaglideLocaleSwitcher />
          <BetterAuthHeader />
        </div>
      </div>
      
      
      <div className="p-3 border-t border-border md:hidden bg-muted/20">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="h-4 w-4 opacity-70" />
          </div>
          <Input
            type="search"
            placeholder={m.search_placeholder()}
            className="w-full pl-9 bg-background"
          />
        </div>
      </div>
    </header>
  )
}
