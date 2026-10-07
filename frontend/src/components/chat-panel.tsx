import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Check, PanelRightClose, Sparkles } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { api, type ToolResult } from '@/lib/api'
import { CategoryChip } from '@/lib/catalog'
import { dayShort, moneyWhole, signedMoney } from '@/lib/format'
import { invalidateData } from '@/lib/queries'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  results: ToolResult[]
  /** Set when the assistant could not reply; holds the text to resend. */
  failed?: string
}

const SUGGESTIONS = ['Add a $12 lunch expense', 'How much did I spend this month?', 'Which budget am I over?']
const MAX_LENGTH = 1000
let localId = 0

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const client = useQueryClient()
  const history = useQuery({ queryKey: ['chat-history'], queryFn: api.chatHistory, staleTime: Infinity })
  const [sent, setSent] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const messages: Message[] = [
    ...(history.data ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content, results: m.tool_results ?? [] })),
    ...sent,
  ]

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sent])

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    const replyId = `local-${++localId}`
    const patch = (change: (reply: Message) => Message) => setSent((all) => all.map((m) => (m.id === replyId ? change(m) : m)))
    const fail = (why: string) => patch((m) => ({ ...m, content: why, failed: message }))

    setDraft('')
    setBusy(true)
    setSent((all) => [
      ...all.filter((m) => !m.failed),
      { id: `local-${++localId}`, role: 'user', content: message, results: [] },
      { id: replyId, role: 'assistant', content: '', results: [] },
    ])
    try {
      let finished = false
      await api.chat(message, (event) => {
        if (event.type === 'token') patch((m) => ({ ...m, content: m.content + event.text }))
        else if (event.type === 'tool_result') {
          patch((m) => ({ ...m, results: [...m.results, event.result] }))
          invalidateData(client)
        } else if (event.type === 'error') fail(event.message)
        finished = true
      })
      if (!finished) fail('The assistant is unavailable right now. Try again in a moment.')
    } catch (error) {
      fail(error instanceof Error ? error.message : 'The assistant is unavailable right now. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-edge bg-card max-lg:border-0 lg:rounded-2xl lg:border lg:shadow-raise">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2.5 text-[0.9375rem] font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Ask Yapi
        </h2>
        <Button variant="ghost" size="icon" aria-label="Close assistant" onClick={onClose}>
          <PanelRightClose />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && !history.isPending && (
          <p className="text-muted-foreground">
            Tell me what you spent or earned and I will record it. You can also ask about your month, or have me set a budget.
          </p>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-primary px-3 py-2 font-semibold text-primary-foreground shadow-glow">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="flex max-w-[92%] flex-col gap-2 self-start">
              {(m.content || m.results.length === 0) && (
                <div className="rounded-[14px_14px_14px_4px] bg-background px-3 py-2 whitespace-pre-line shadow-inset">
                  {m.content || <span className="text-muted-foreground">Thinking…</span>}
                </div>
              )}
              {m.results.map((result, index) => (
                <ResultCard key={index} result={result} />
              ))}
              {m.failed && (
                <Button variant="outline" size="sm" className="self-start" onClick={() => send(m.failed!)}>
                  Send again
                </Button>
              )}
            </div>
          ),
        )}
        <div ref={end} />
      </div>

      <div className="flex flex-col gap-2.5 border-t p-4 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              type="button"
              disabled={busy}
              onClick={() => send(text)}
              className="h-9 rounded-full border border-edge bg-card px-3 text-xs font-semibold text-secondary-foreground shadow-raise-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-xl bg-background py-1 pr-1 pl-3 shadow-inset focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your money or add an expense"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={busy || !draft.trim()}>
            <ArrowUp />
          </Button>
        </form>
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: ToolResult }) {
  const category = result.type === 'transaction_created' ? result.transaction.category : result.category
  const view =
    result.type === 'transaction_created'
      ? {
          title: result.transaction.kind === 'income' ? 'Income created' : 'Expense created',
          name: result.transaction.description || category.name,
          detail: `${category.name} · ${dayShort(result.transaction.occurred_on)}`,
          value: signedMoney(result.transaction.amount_cents, result.transaction.kind),
        }
      : result.type === 'budget_updated'
        ? {
            title: 'Budget updated',
            name: category.name,
            detail: 'Monthly limit',
            value: category.monthly_limit_cents ? moneyWhole(category.monthly_limit_cents) : 'No limit',
          }
        : {
            title: 'Category created',
            name: category.name,
            detail: category.kind === 'income' ? 'Income' : 'Expense',
            value: category.monthly_limit_cents ? `${moneyWhole(category.monthly_limit_cents)} / month` : '',
          }
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-card p-3 shadow-raise-sm">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-good">
        <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
        {view.title}
      </div>
      <div className="flex items-center gap-2.5">
        <CategoryChip icon={category.icon} color={category.color} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{view.name}</span>
          <span className="text-xs text-muted-foreground">{view.detail}</span>
        </div>
        <span className="font-bold whitespace-nowrap tabular-nums">{view.value}</span>
      </div>
    </div>
  )
}
