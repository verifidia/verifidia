import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import { m } from '#/paraglide/messages'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-1">
        <Button
          className="h-7 rounded-sm px-2.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => {
            authClient.signOut()
          }}
          size="sm"
          variant="ghost"
        >
          {m.auth_sign_out()}
        </Button>
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
      </div>
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
