export type Kind = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  kind: Kind
  icon: string
  color: string
  monthly_limit_cents: number | null
}

export interface CategoryWithSpent extends Category {
  month_total_cents: number
}

export interface Transaction {
  id: string
  kind: Kind
  amount_cents: number
  description: string
  occurred_on: string
  category: Category
}

export interface DashboardSummary {
  month: string
  income_cents: number
  expense_cents: number
  previous_income_cents: number
  previous_expense_cents: number
  budgets: { category: Category; spent_cents: number; limit_cents: number }[]
  series: { month: string; income_cents: number; expense_cents: number }[]
  breakdown: { category: Category; amount_cents: number }[]
  recent: Transaction[]
}

export type ToolResult =
  | { type: 'transaction_created'; transaction: Transaction }
  | { type: 'category_created'; category: Category }
  | { type: 'budget_updated'; category: Category }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tool_results: ToolResult[] | null
}

export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'done'; id: string }
  | { type: 'error'; message: string }

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const GUEST_KEY = 'yapi.guest'
let guestPromise: Promise<string> | null = null

function storedGuest(): string | null {
  try {
    return localStorage.getItem(GUEST_KEY)
  } catch {
    return null
  }
}

async function createGuest(): Promise<string> {
  const response = await fetch('/api/guests', { method: 'POST' })
  if (!response.ok) throw new ApiError(response.status, 'Could not start a guest session.')
  const { id } = (await response.json()) as { id: string }
  try {
    localStorage.setItem(GUEST_KEY, id)
  } catch {
    // Storage blocked: the session lasts until the tab closes.
  }
  return id
}

function guestId(renew = false): Promise<string> {
  if (renew || !guestPromise) {
    const existing = renew ? null : storedGuest()
    guestPromise = existing ? Promise.resolve(existing) : createGuest()
    guestPromise.catch(() => {
      guestPromise = null
    })
  }
  return guestPromise
}

/** Fetch as the current guest; a guest the server no longer knows is replaced once. */
async function guestFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = async (id: string) =>
    fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers, 'X-Guest-Id': id },
    })
  let response = await send(await guestId())
  if (response.status === 401) response = await send(await guestId(true))
  return response
}

async function errorFrom(response: Response): Promise<ApiError> {
  let message = 'Something went wrong. Try again.'
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') message = body.detail
  } catch {
    // Not JSON: keep the generic message.
  }
  return new ApiError(response.status, message)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await guestFetch(path, init)
  if (!response.ok) throw await errorFrom(response)
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value)
  const text = search.toString()
  return text ? `?${text}` : ''
}

export interface TransactionInput {
  kind: Kind
  amount_cents: number
  category_id: string
  occurred_on: string
  description: string
}

export interface CategoryInput {
  name: string
  kind: Kind
  icon: string
  color: string
  monthly_limit_cents: number | null
}

export const api = {
  summary: (month: string) => request<DashboardSummary>(`/dashboard/summary${query({ month })}`),
  categories: (month: string) => request<CategoryWithSpent[]>(`/categories${query({ month })}`),
  createCategory: (body: CategoryInput) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Partial<Omit<CategoryInput, 'kind'>>) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  transactions: (filters: { month: string; kind?: Kind; category_id?: string }) =>
    request<Transaction[]>(`/transactions${query(filters)}`),
  createTransaction: (body: TransactionInput) => request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (id: string, body: TransactionInput) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTransaction: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  chatHistory: () => request<ChatMessage[]>('/chat/history'),

  /** Sends a message and calls `onEvent` for each streamed event. */
  async chat(message: string, onEvent: (event: ChatEvent) => void): Promise<void> {
    const response = await guestFetch('/chat', { method: 'POST', body: JSON.stringify({ message }) })
    if (!response.ok || !response.body) throw await errorFrom(response)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        if (frame.startsWith('data: ')) onEvent(JSON.parse(frame.slice(6)) as ChatEvent)
      }
    }
  },
}
