import { Link } from '@tanstack/react-router'
import { IconRectLogoutOutline18 } from 'nucleo-ui-outline-18'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { authClient } from '#/lib/auth-client'
import { m } from '#/paraglide/messages'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            {session.user.image ? (
              <img
                alt=""
                className="h-7 w-7 rounded-full object-cover"
                height={28}
                src={session.user.image}
                width={28}
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                <span className="font-medium text-muted-foreground text-xs">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm leading-none">
                {session.user.name}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                authClient.signOut()
              }}
            >
              <IconRectLogoutOutline18 />
              {m.auth_sign_out()}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      asChild
      className="inline-flex h-7 items-center rounded-sm px-2.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
      size="sm"
      variant="ghost"
    >
      <Link to="/login">{m.auth_sign_in()}</Link>
    </Button>
  )
}
