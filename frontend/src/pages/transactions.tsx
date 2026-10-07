import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { MonthPicker, PageHeader, Segmented } from '@/components/controls'
import { EmptyState, ErrorState, LoadingBlocks } from '@/components/states'
import { TransactionDialog } from '@/components/transaction-dialog'
import { Button } from '@/components/ui/button'
import type { Kind, Transaction } from '@/lib/api'
import { useAppState } from '@/lib/app-state'
import { CategoryChip } from '@/lib/catalog'
import { dayShort, signedMoney } from '@/lib/format'
import { useCategories, useDeleteTransaction, useTransactions } from '@/lib/queries'

type KindFilter = 'all' | Kind

export function TransactionsPage() {
  const { month } = useAppState()
  const [kind, setKind] = useState<KindFilter>('all')
  const [categoryId, setCategoryId] = useState('')
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const categories = useCategories(month)
  const transactions = useTransactions({ month, kind: kind === 'all' ? undefined : kind, category_id: categoryId || undefined })
  const remove = useDeleteTransaction()

  return (
    <>
      <PageHeader title="Transactions" subtitle="Every expense and income you have recorded">
        <Button onClick={() => setEditing('new')}>
          <Plus />
          Add transaction
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: 'All' },
            { value: 'expense', label: 'Expenses' },
            { value: 'income', label: 'Income' },
          ]}
        />
        <select aria-label="Category" className="field w-auto" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <MonthPicker />
      </div>

      {transactions.isPending ? (
        <LoadingBlocks count={1} className="h-64" />
      ) : transactions.isError ? (
        <ErrorState onRetry={() => transactions.refetch()} />
      ) : transactions.data.length === 0 ? (
        <section className="surface px-5">
          <EmptyState
            title="No transactions for these filters"
            action={
              <Button variant="outline" onClick={() => setEditing('new')}>
                <Plus />
                Add transaction
              </Button>
            }
          >
            Try another month or category, or record a new one.
          </EmptyState>
        </section>
      ) : (
        <section className="surface overflow-x-auto">
          <table className="w-full min-w-[38rem]">
            <thead>
              <tr className="text-left text-[0.8125rem] text-muted-foreground [&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.data.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/60 [&>td]:px-4 [&>td]:py-2">
                  <td className="font-semibold">{t.description || t.category.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <CategoryChip icon={t.category.icon} color={t.category.color} className="size-7 rounded-md" />
                      {t.category.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">{dayShort(t.occurred_on, true)}</td>
                  <td className={`text-right font-bold whitespace-nowrap tabular-nums ${t.kind === 'income' ? 'text-good' : ''}`}>{signedMoney(t.amount_cents, t.kind)}</td>
                  <td className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${t.description || t.category.name}`} onClick={() => setEditing(t)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${t.description || t.category.name}`} onClick={() => setDeleting(t)}>
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <TransactionDialog open={editing !== null} transaction={editing && editing !== 'new' ? editing : undefined} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this transaction?"
        description={deleting ? `${deleting.description || deleting.category.name}, ${signedMoney(deleting.amount_cents, deleting.kind)} on ${dayShort(deleting.occurred_on, true)}. This cannot be undone.` : ''}
        confirmLabel="Delete transaction"
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onClose={() => {
          setDeleting(null)
          remove.reset()
        }}
      />
    </>
  )
}
