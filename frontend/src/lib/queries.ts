import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, type CategoryInput, type Kind, type TransactionInput } from '@/lib/api'

/** Everything derived from transactions and categories; refetched after any write. */
export function invalidateData(client: QueryClient) {
  for (const key of ['summary', 'transactions', 'categories']) client.invalidateQueries({ queryKey: [key] })
}

export const useSummary = (month: string) => useQuery({ queryKey: ['summary', month], queryFn: () => api.summary(month) })

export const useCategories = (month: string) =>
  useQuery({ queryKey: ['categories', month], queryFn: () => api.categories(month) })

export const useTransactions = (filters: { month: string; kind?: Kind; category_id?: string }) =>
  useQuery({ queryKey: ['transactions', filters], queryFn: () => api.transactions(filters) })

function useWrite<TInput, TResult>(write: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient()
  return useMutation({ mutationFn: write, onSuccess: () => invalidateData(client) })
}

export const useSaveTransaction = () =>
  useWrite(({ id, body }: { id?: string; body: TransactionInput }) =>
    id ? api.updateTransaction(id, body) : api.createTransaction(body),
  )

export const useDeleteTransaction = () => useWrite((id: string) => api.deleteTransaction(id))

export const useSaveCategory = () =>
  useWrite(({ id, body }: { id?: string; body: CategoryInput }) => {
    if (!id) return api.createCategory(body)
    const { kind: _kind, ...changes } = body
    return api.updateCategory(id, changes)
  })

export const useDeleteCategory = () => useWrite((id: string) => api.deleteCategory(id))
