import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/signup')({ component: SignupPage })

function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [pendingOtp, setPendingOtp] = useState(false)
  const [otp, setOtp] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(m.auth_error_password_min())
      return
    }

    if (password !== confirmPassword) {
      setError(m.auth_error_password_mismatch())
      return
    }

    setSubmitting(true)

    const { data, error: authError } = await authClient.signUp.email({
      email,
      password,
      name: name || 'Anonymous',
    })

    if (authError) {
      setError(authError.message ?? m.auth_error_generic())
      setSubmitting(false)
      return
    }

    if (data && !data.user.emailVerified) {
      setPendingOtp(true)
      setSubmitting(false)
      return
    }

    navigate({ to: '/' })
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    })

    if (verifyError) {
      setError(verifyError.message ?? m.auth_error_generic())
      setSubmitting(false)
      return
    }

    navigate({ to: '/' })
  }

  if (pendingOtp) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              {m.auth_otp_heading()}
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {m.auth_otp_subheading({ email })}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              handleVerifyOtp(e)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="otp">{m.auth_otp_label()}</Label>
              <Input
                aria-describedby={error ? 'otp-error' : undefined}
                aria-invalid={error ? true : undefined}
                autoComplete="one-time-code"
                autoFocus
                id="otp"
                inputMode="numeric"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
                pattern="[0-9]*"
                placeholder="000000"
                required
                type="text"
                value={otp}
              />
            </div>

            <div aria-live="polite">
              {error ? (
                <p
                  className="text-destructive text-sm"
                  id="otp-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? m.auth_submitting() : m.auth_otp_verify()}
            </Button>
          </form>

          <button
            className="mt-4 w-full text-center text-muted-foreground text-sm hover:text-foreground"
            disabled={submitting}
            onClick={async () => {
              setError(null)
              const { error: resendError } =
                await authClient.emailOtp.sendVerificationOtp({
                  email,
                  type: 'email-verification',
                })
              if (resendError) {
                setError(resendError.message ?? m.auth_error_generic())
              }
            }}
            type="button"
          >
            {m.auth_otp_resend()}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">
            {m.auth_sign_up_heading()}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {m.auth_sign_up_subheading()}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            handleSubmit(e)
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">{m.auth_name()}</Label>
            <Input
              autoComplete="name"
              autoFocus
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder={m.auth_name_placeholder()}
              type="text"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{m.auth_email()}</Label>
            <Input
              aria-describedby={error ? 'signup-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{m.auth_password()}</Label>
            <Input
              aria-describedby={error ? 'signup-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="new-password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {m.auth_confirm_password()}
            </Label>
            <Input
              aria-describedby={error ? 'signup-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="new-password"
              id="confirm-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>

          <div aria-live="polite">
            {error ? (
              <p
                className="text-destructive text-sm"
                id="signup-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? m.auth_submitting() : m.auth_sign_up()}
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          {m.auth_has_account()}{' '}
          <Link
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            to="/login"
          >
            {m.auth_has_account_link()}
          </Link>
        </p>
      </div>
    </div>
  )
}
