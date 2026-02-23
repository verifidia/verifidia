import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import * as m from '#/paraglide/messages'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void authClient.signOut()
          }}
          className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
        >
          {m.auth_sign_out()}
        </Button>
        {session.user.image ? (
          <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors inline-flex items-center"
    >
      <Link to="/login">{m.auth_sign_in()}</Link>
    </Button>
  )
}
