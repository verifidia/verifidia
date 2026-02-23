import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import * as m from '#/paraglide/messages'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    })

    if (authError) {
      setError(m.auth_error_invalid())
      setSubmitting(false)
      return
    }

    void navigate({ to: '/' })
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[340px]">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {m.auth_sign_in_heading()}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {m.auth_sign_in_subheading()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{m.auth_email()}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="h-9 bg-transparent border-input rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{m.auth_password()}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-9 bg-transparent border-input rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div aria-live="polite">
            {error ? (
              <p id="login-error" className="text-xs text-destructive font-medium" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full h-9 rounded-sm shadow-none font-medium"
            disabled={submitting}
          >
            {submitting ? m.auth_submitting() : m.auth_sign_in()}
          </Button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {m.auth_no_account()}{' '}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {m.auth_no_account_link()}
          </Link>
        </p>
      </div>
    </div>
  )
}
