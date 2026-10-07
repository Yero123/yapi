import { type FormEvent, useState } from 'react'

import { Field, Segmented } from '@/components/controls'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Kind, Transaction } from '@/lib/api'
import { amountText, currentMonth, parseAmount, today } from '@/lib/format'
import { useCategories, useSaveTransaction } from '@/lib/queries'

interface Props {
  open: boolean
  onClose: () => void
  /** The transaction being edited; omit to add a new one. */
  transaction?: Transaction
}

export function TransactionDialog({ open, onClose, transaction }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
          <DialogDescription>Record an expense or an income.</DialogDescription>
        </DialogHeader>
        {open && <TransactionForm key={transaction?.id ?? 'new'} transaction={transaction} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function TransactionForm({ transaction, onClose }: { transaction?: Transaction; onClose: () => void }) {
  const categories = useCategories(currentMonth())
  const save = useSaveTransaction()

  const [kind, setKind] = useState<Kind>(transaction?.kind ?? 'expense')
  const [amount, setAmount] = useState(transaction ? amountText(transaction.amount_cents) : '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.category.id ?? '')
  const [date, setDate] = useState(transaction?.occurred_on ?? today())
  const [amountError, setAmountError] = useState<string>()

  const options = (categories.data ?? []).filter((c) => c.kind === kind)
  const chosen = options.find((c) => c.id === categoryId) ?? options[0]

  function submit(event: FormEvent) {
    event.preventDefault()
    const cents = parseAmount(amount)
    if (cents === null) {
      setAmountError('Enter an amount greater than zero, like 12.50.')
      return
    }
    if (!chosen) return
    save.mutate(
      { id: transaction?.id, body: { kind, amount_cents: cents, category_id: chosen.id, occurred_on: date, description } },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Segmented
        label="Type"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
      />
      <Field label="Amount" htmlFor="tx-amount" error={amountError}>
        <Input
          id="tx-amount"
          inputMode="decimal"
          placeholder="0.00"
          autoFocus
          value={amount}
          aria-invalid={!!amountError}
          onChange={(e) => {
            setAmount(e.target.value)
            setAmountError(undefined)
          }}
        />
      </Field>
      <Field label="Description" htmlFor="tx-description">
        <Input id="tx-description" placeholder="e.g. Lunch" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" htmlFor="tx-category">
          <select id="tx-category" className="field" value={chosen?.id ?? ''} onChange={(e) => setCategoryId(e.target.value)}>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" htmlFor="tx-date">
          <Input id="tx-date" type="date" required value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {save.isError && (
        <p className="text-[0.8125rem] font-medium text-destructive" role="alert">
          {save.error.message}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending || !chosen || !date}>
          {save.isPending ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
        </Button>
      </DialogFooter>
    </form>
  )
}
