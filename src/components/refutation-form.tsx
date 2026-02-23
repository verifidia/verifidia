import { Link } from '@tanstack/react-router'
import {
  IconAlertWarningOutline18,
  IconCircleCheckOutline18,
  IconFlagOutline18,
  IconLinkOutline18,
  IconPenOutline18,
  IconQuoteOutline18,
} from 'nucleo-ui-outline-18'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { authClient } from '#/lib/auth-client'
import { m } from '#/paraglide/messages'

interface RefutationFormProps {
  documentId: string
  endOffset: number
  locale: string
  onClose: () => void
  onSuccess: () => void
  open: boolean
  selectedText: string
  startOffset: number
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const CATEGORIES = [
  { value: 'factual_error', label: () => m.doc_refute_category_factual() },
  { value: 'outdated', label: () => m.doc_refute_category_outdated() },
  { value: 'biased', label: () => m.doc_refute_category_biased() },
  { value: 'missing_context', label: () => m.doc_refute_category_missing() },
] as const

export function RefutationForm({
  documentId,
  locale,
  selectedText,
  startOffset,
  endOffset,
  open,
  onClose,
  onSuccess,
}: RefutationFormProps) {
  const { data: session } = authClient.useSession()
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setErrorMessage('')

    if (!category) {
      setValidationError(m.refute_select_category())
      return
    }

    if (note.length > 0 && note.length < 20) {
      setValidationError(m.refute_min_explanation())
      return
    }

    setStatus('submitting')

    try {
      const res = await fetch(`/api/documents/${documentId}/refute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          startOffset,
          endOffset,
          category,
          note: note || undefined,
          sourceUrl: sourceUrl || undefined,
          locale,
        }),
      })

      if (res.status === 201) {
        setStatus('success')
        setTimeout(() => {
          onSuccess()
        }, 1500)
        return
      }

      const data = await res.json().catch(() => null)
      const msg =
        data && typeof data === 'object' && 'error' in data
          ? String(data.error)
          : m.refute_error()
      setErrorMessage(msg)
      setStatus('error')
    } catch {
      setErrorMessage(m.refute_error())
      setStatus('error')
    }
  }

  return (
    <Dialog onOpenChange={(value) => !value && onClose()} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFlagOutline18 className="h-4 w-4" />
            {m.doc_refute_button()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {m.doc_refute_button()}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex items-center gap-2 py-4 text-chart-2">
            <IconCircleCheckOutline18 className="h-5 w-5" />
            <p className="font-medium text-sm">{m.refute_success()}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 rounded-md border-muted-foreground/30 border-l-2 bg-muted/50 p-3">
              <IconQuoteOutline18 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="line-clamp-4 text-foreground/80 text-sm italic">
                {selectedText}
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                handleSubmit(e)
              }}
            >
              <div className="space-y-1.5">
                <Label>{m.refute_select_category()}</Label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={m.refute_select_category()} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <IconPenOutline18 className="h-3.5 w-3.5" />
                  {m.refute_note_placeholder()}
                </Label>
                <Textarea
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={m.refute_note_placeholder()}
                  rows={3}
                  value={note}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <IconLinkOutline18 className="h-3.5 w-3.5" />
                  {m.refute_source_placeholder()}
                </Label>
                <Input
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={m.refute_source_placeholder()}
                  type="url"
                  value={sourceUrl}
                />
              </div>

              {validationError && (
                <p className="text-destructive text-sm">{validationError}</p>
              )}

              {status === 'error' && errorMessage && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <IconAlertWarningOutline18 className="h-4 w-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {session ? (
                <Button
                  className="w-full"
                  disabled={status === 'submitting'}
                  type="submit"
                >
                  <IconFlagOutline18 className="h-4 w-4" />
                  {status === 'submitting'
                    ? m.auth_submitting()
                    : m.refute_submit()}
                </Button>
              ) : (
                <div className="py-2 text-center">
                  <Link
                    className="text-primary text-sm underline underline-offset-2 transition-colors hover:text-primary/80"
                    to="/login"
                  >
                    {m.login_required()}
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
