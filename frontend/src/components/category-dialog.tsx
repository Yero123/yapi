import { type FormEvent, useState } from 'react'

import { Field, Segmented } from '@/components/controls'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Category, Kind } from '@/lib/api'
import { catColor, catSoft, COLORS, ICONS } from '@/lib/catalog'
import { amountText, parseAmount } from '@/lib/format'
import { useSaveCategory } from '@/lib/queries'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  /** The category being edited; omit to create one. */
  category?: Category
}

export function CategoryDialog({ open, onClose, category }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>Pick an icon and a color so it is easy to spot.</DialogDescription>
        </DialogHeader>
        {open && <CategoryForm key={category?.id ?? 'new'} category={category} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const save = useSaveCategory()
  const [name, setName] = useState(category?.name ?? '')
  const [kind, setKind] = useState<Kind>(category?.kind ?? 'expense')
  const [icon, setIcon] = useState(category?.icon ?? 'bag')
  const [color, setColor] = useState(category?.color ?? 'mint')
  const [limit, setLimit] = useState(category?.monthly_limit_cents ? amountText(category.monthly_limit_cents) : '')
  const [errors, setErrors] = useState<{ name?: string; limit?: string }>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const limitCents = limit.trim() ? parseAmount(limit) : null
    const found = {
      name: name.trim() ? undefined : 'Give the category a name.',
      limit: limit.trim() && limitCents === null ? 'Enter an amount greater than zero, or leave it empty.' : undefined,
    }
    setErrors(found)
    if (found.name || found.limit) return
    save.mutate(
      { id: category?.id, body: { name: name.trim(), kind, icon, color, monthly_limit_cents: kind === 'expense' ? limitCents : null } },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Name" htmlFor="cat-name" error={errors.name}>
        <Input id="cat-name" placeholder="e.g. Groceries" maxLength={60} autoFocus value={name} aria-invalid={!!errors.name} onChange={(e) => setName(e.target.value)} />
      </Field>

      {!category && (
        <Segmented
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
        />
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[0.8125rem] font-semibold">Icon</legend>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ICONS).map(([key, { label, icon: Icon }]) => {
            const selected = key === icon
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => setIcon(key)}
                className={cn(
                  'flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !selected && 'border border-edge bg-card shadow-raise-sm',
                )}
                style={selected ? { background: catSoft(color), color: catColor(color), boxShadow: 'var(--inset)' } : undefined}
              >
                <Icon className="size-[1.1rem]" aria-hidden />
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-semibold">Color</legend>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(COLORS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={key === color}
              onClick={() => setColor(key)}
              className="size-9 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              style={{
                background: catColor(key),
                boxShadow: key === color ? `0 0 0 3px var(--card), 0 0 0 5px ${catColor(key)}` : undefined,
              }}
            />
          ))}
        </div>
      </fieldset>

      {kind === 'expense' && (
        <Field
          label="Monthly limit"
          htmlFor="cat-limit"
          error={errors.limit}
          hint="Optional. With a limit, this category shows up as a budget on the dashboard."
        >
          <Input id="cat-limit" inputMode="decimal" placeholder="No limit" value={limit} aria-invalid={!!errors.limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
      )}

      {save.isError && (
        <p className="text-[0.8125rem] font-medium text-destructive" role="alert">
          {save.error.message}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </Button>
      </DialogFooter>
    </form>
  )
}
