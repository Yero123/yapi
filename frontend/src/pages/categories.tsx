import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { CategoryDialog } from '@/components/category-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/controls'
import { EmptyState, ErrorState, LoadingBlocks } from '@/components/states'
import { Button } from '@/components/ui/button'
import type { CategoryWithSpent } from '@/lib/api'
import { CategoryChip } from '@/lib/catalog'
import { currentMonth, money, moneyWhole } from '@/lib/format'
import { useCategories, useDeleteCategory } from '@/lib/queries'

export function CategoriesPage() {
  const categories = useCategories(currentMonth())
  const remove = useDeleteCategory()
  const [editing, setEditing] = useState<CategoryWithSpent | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CategoryWithSpent | null>(null)

  return (
    <>
      <PageHeader title="Categories" subtitle="Give a category a monthly limit and it becomes a budget">
        <Button onClick={() => setEditing('new')}>
          <Plus />
          New category
        </Button>
      </PageHeader>

      {categories.isPending ? (
        <LoadingBlocks count={1} className="h-64" />
      ) : categories.isError ? (
        <ErrorState onRetry={() => categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <section className="surface px-5">
          <EmptyState title="No categories yet">Create one to start recording expenses and incomes.</EmptyState>
        </section>
      ) : (
        <section className="surface overflow-x-auto">
          <table className="w-full min-w-[38rem]">
            <thead>
              <tr className="text-left text-[0.8125rem] text-muted-foreground [&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th>Category</th>
                <th>Type</th>
                <th className="text-right">Monthly limit</th>
                <th className="text-right">This month</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.data.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/60 [&>td]:px-4 [&>td]:py-2">
                  <td>
                    <span className="flex items-center gap-2.5 font-semibold">
                      <CategoryChip icon={c.icon} color={c.color} className="size-8" />
                      {c.name}
                    </span>
                  </td>
                  <td>
                    <span className="rounded-full border px-2 py-0.5 text-xs text-secondary-foreground">{c.kind === 'income' ? 'Income' : 'Expense'}</span>
                  </td>
                  <td className={`text-right whitespace-nowrap tabular-nums ${c.monthly_limit_cents ? '' : 'text-muted-foreground'}`}>
                    {c.monthly_limit_cents ? `${moneyWhole(c.monthly_limit_cents)} / month` : 'No limit'}
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">{money(c.month_total_cents)}</td>
                  <td className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}>
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <CategoryDialog open={editing !== null} category={editing && editing !== 'new' ? editing : undefined} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.name}?` : ''}
        description="A category can only be deleted while it has no transactions. This cannot be undone."
        confirmLabel="Delete category"
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
