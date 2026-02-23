import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { m } from '#/paraglide/messages'

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

    navigate({ to: '/' })
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[340px]">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl text-foreground tracking-tight">
            {m.auth_sign_in_heading()}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {m.auth_sign_in_subheading()}
          </p>
        </div>

        {/* Form */}
        <form
          className="space-y-5"
          onSubmit={(e) => {
            handleSubmit(e)
          }}
        >
          <div className="space-y-1.5">
            <Label
              className="font-medium text-muted-foreground text-xs"
              htmlFor="email"
            >
              {m.auth_email()}
            </Label>
            <Input
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="email"
              autoFocus
              className="h-9 rounded-sm border-input bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              className="font-medium text-muted-foreground text-xs"
              htmlFor="password"
            >
              {m.auth_password()}
            </Label>
            <Input
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="current-password"
              className="h-9 rounded-sm border-input bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div aria-live="polite">
            {error ? (
              <p
                className="font-medium text-destructive text-xs"
                id="login-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <Button
            className="h-9 w-full rounded-sm font-medium shadow-none"
            disabled={submitting}
            type="submit"
          >
            {submitting ? m.auth_submitting() : m.auth_sign_in()}
          </Button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-muted-foreground text-sm">
          {m.auth_no_account()}{' '}
          <Link
            className="rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
            to="/signup"
          >
            {m.auth_no_account_link()}
          </Link>
        </p>
      </div>
    </div>
  )
}
