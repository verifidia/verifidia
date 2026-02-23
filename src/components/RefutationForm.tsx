import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { m } from '#/paraglide/messages'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '#/components/ui/card'
import { Textarea } from '#/components/ui/textarea'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  IconFlagOutline18,
  IconQuoteOutline18,
  IconXmarkOutline18,
  IconLinkOutline18,
  IconPenOutline18,
  IconAlertWarningOutline18,
  IconCircleCheckOutline18,
} from 'nucleo-ui-outline-18'

interface RefutationFormProps {
  documentId: string
  locale: string
  selectedText: string
  startOffset: number
  endOffset: number
  onClose: () => void
  onSuccess: () => void
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

  if (status === 'success') {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-chart-2">
            <IconCircleCheckOutline18 className="w-5 h-5" />
            <p className="text-sm font-medium">{m.refute_success()}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <IconFlagOutline18 className="w-4 h-4" />
          {m.doc_refute_button()}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <IconXmarkOutline18 className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2 rounded-md bg-muted/50 p-3 border-l-2 border-muted-foreground/30">
          <IconQuoteOutline18 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80 italic line-clamp-4">
            {selectedText}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{m.refute_select_category()}</Label>
            <Select value={category} onValueChange={setCategory}>
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
              <IconPenOutline18 className="w-3.5 h-3.5" />
              {m.refute_note_placeholder()}
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={m.refute_note_placeholder()}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <IconLinkOutline18 className="w-3.5 h-3.5" />
              {m.refute_source_placeholder()}
            </Label>
            <Input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={m.refute_source_placeholder()}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <IconAlertWarningOutline18 className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {session ? (
            <Button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full"
            >
              <IconFlagOutline18 className="w-4 h-4" />
              {status === 'submitting'
                ? m.auth_submitting()
                : m.refute_submit()}
            </Button>
          ) : (
            <div className="text-center py-2">
              <Link
                to="/login"
                className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {m.login_required()}
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
