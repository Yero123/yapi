import { Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'

import { MonthPicker, PageHeader } from '@/components/controls'
import { EmptyState, ErrorState, LoadingBlocks } from '@/components/states'
import { TransactionDialog } from '@/components/transaction-dialog'
import { Button } from '@/components/ui/button'
import type { DashboardSummary } from '@/lib/api'
import { useAppState } from '@/lib/app-state'
import { catColor, CategoryChip, catSoft } from '@/lib/catalog'
import { dayShort, deltaLabel, money, moneyWhole, monthLong, monthName, monthShort, signedMoney } from '@/lib/format'
import { useSummary } from '@/lib/queries'

export function DashboardPage() {
  const { month } = useAppState()
  const summary = useSummary(month)
  const [adding, setAdding] = useState(false)

  return (
    <>
      <PageHeader title="Welcome back" subtitle={`Here is your money for ${monthLong(month)}`}>
        <MonthPicker />
        <Button onClick={() => setAdding(true)}>
          <Plus />
          Add transaction
        </Button>
      </PageHeader>

      {summary.isPending ? (
        <LoadingBlocks />
      ) : summary.isError ? (
        <ErrorState onRetry={() => summary.refetch()} />
      ) : (
        <>
          <Budgets data={summary.data} />
          <MonthlyChart data={summary.data} />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Breakdown data={summary.data} />
            <Recent data={summary.data} onAdd={() => setAdding(true)} />
          </div>
        </>
      )}

      <TransactionDialog open={adding} onClose={() => setAdding(false)} />
    </>
  )
}

function Budgets({ data }: { data: DashboardSummary }) {
  if (data.budgets.length === 0) {
    return (
      <section aria-label="Budgets" className="surface px-5">
        <EmptyState
          title="No budgets yet"
          action={
            <Button variant="outline" render={<Link to="/categories" />} nativeButton={false}>
              Go to categories
            </Button>
          }
        >
          Give a category a monthly limit and it shows up here as a budget, so you can see how much is left.
        </EmptyState>
      </section>
    )
  }
  return (
    <section aria-label="Budgets" className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
      {data.budgets.map(({ category, spent_cents, limit_cents }) => {
        const over = spent_cents > limit_cents
        const used = Math.round((spent_cents / limit_cents) * 100)
        return (
          <article key={category.id} className="flex flex-col gap-3.5 rounded-2xl border border-edge p-4 shadow-raise" style={{ background: catSoft(category.color) }}>
            <div className="flex items-center gap-2.5">
              <CategoryChip icon={category.icon} color={category.color} onTint className="size-8" />
              <h2 className="truncate font-semibold">{category.name}</h2>
            </div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight">{moneyWhole(spent_cents)}</span>
              <span className="text-muted-foreground">of {moneyWhole(limit_cents)}</span>
            </p>
            <div
              role="progressbar"
              aria-label={`${category.name} budget used`}
              aria-valuenow={Math.min(used, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full"
              style={{ background: `color-mix(in srgb, ${over ? 'var(--destructive)' : catColor(category.color)} 28%, transparent)` }}
            >
              <div className="h-full rounded-full" style={{ width: `${Math.min(used, 100)}%`, background: over ? 'var(--destructive)' : catColor(category.color) }} />
            </div>
            <div className="flex items-center justify-between gap-2 text-[0.8125rem]">
              {over ? (
                <span className="flex items-center gap-1.5 font-semibold text-destructive">
                  <TriangleAlert className="size-3.5" aria-hidden />
                  Over by {moneyWhole(spent_cents - limit_cents)}
                </span>
              ) : (
                <span className="text-muted-foreground">{moneyWhole(limit_cents - spent_cents)} left</span>
              )}
              <span className="tabular-nums">{used}%</span>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function Stat({ label, swatch, value, delta }: { label: string; swatch: string; value: string; delta: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
        <span className="size-2.5 rounded-[3px]" style={{ background: swatch }} />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[1.75rem] leading-none font-extrabold tracking-tight">{value}</span>
        {delta && <span className="text-xs text-muted-foreground">{delta}</span>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as DashboardSummary['series'][number] | undefined
  if (!active || !point) return null
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-2.5 py-2 text-xs shadow-[0_6px_18px_rgb(0_0_0/0.14)]">
      <span className="font-bold">{monthLong(point.month)}</span>
      {(
        [
          ['Income', 'var(--income)', point.income_cents],
          ['Expenses', 'var(--expense)', point.expense_cents],
        ] as const
      ).map(([label, color, cents]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px]" style={{ background: color }} />
          <span className="text-muted-foreground">{label}</span>
          <span className="ml-auto pl-3 tabular-nums">{moneyWhole(cents)}</span>
        </span>
      ))}
    </div>
  )
}

/** Round axis steps covering `max` in four intervals. */
function axisTicks(maxCents: number): number[] {
  const rough = Math.max(maxCents, 10000) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!
  return [0, 1, 2, 3, 4].map((i) => i * step)
}

const axisLabel = (cents: number) => (cents >= 100000 ? `$${cents / 100000}K` : `$${cents / 100}`)

function MonthlyChart({ data }: { data: DashboardSummary }) {
  const ticks = axisTicks(Math.max(...data.series.flatMap((p) => [p.income_cents, p.expense_cents])))
  return (
    <section className="surface flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-8">
          <Stat label="Income" swatch="var(--income)" value={moneyWhole(data.income_cents)} delta={deltaLabel(data.income_cents, data.previous_income_cents, data.month)} />
          <Stat label="Expenses" swatch="var(--expense)" value={moneyWhole(data.expense_cents)} delta={deltaLabel(data.expense_cents, data.previous_expense_cents, data.month)} />
        </div>
        <h2 className="text-[0.8125rem] font-semibold text-muted-foreground">Last 12 months</h2>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.series} barGap={2} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickFormatter={monthShort} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              ticks={ticks}
              domain={[0, ticks[4]]}
              tickFormatter={axisLabel}
            />
            <Tooltip cursor={{ fill: 'var(--muted)' }} content={ChartTooltip} />
            <Bar dataKey="income_cents" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            <Bar dataKey="expense_cents" name="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function Breakdown({ data }: { data: DashboardSummary }) {
  const limits = new Map(data.budgets.map((b) => [b.category.id, b.limit_cents]))
  return (
    <section className="surface flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-bold">Spending by category</h2>
        <Button variant="ghost" size="sm" className="text-brand-ink" render={<Link to="/categories" />} nativeButton={false}>
          Manage
        </Button>
      </div>
      {data.breakdown.length === 0 ? (
        <EmptyState title={`Nothing spent in ${monthName(data.month)}`}>Expenses you record for this month are grouped here by category.</EmptyState>
      ) : (
        <>
          <p className="flex items-baseline gap-2">
            <span className="text-[1.75rem] leading-none font-extrabold tracking-tight">{moneyWhole(data.expense_cents)}</span>
            <span className="text-[0.8125rem] text-muted-foreground">spent in {monthName(data.month)}</span>
          </p>
          <div className="flex h-2.5 gap-0.5" aria-hidden>
            {data.breakdown.map(({ category, amount_cents }) => (
              <div key={category.id} className="min-w-1 basis-0 rounded-[3px]" style={{ flexGrow: amount_cents, background: catColor(category.color) }} />
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8125rem]">
              <thead>
                <tr className="text-left text-muted-foreground [&>th]:py-2 [&>th]:font-medium">
                  <th>Category</th>
                  <th className="pl-3 text-right">Amount</th>
                  <th className="pl-3 text-right">Share</th>
                  <th className="pl-3 text-right">Budget</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map(({ category, amount_cents }) => {
                  const limit = limits.get(category.id)
                  const over = limit !== undefined && amount_cents > limit
                  return (
                    <tr key={category.id} className="border-t [&>td]:py-2.5">
                      <td>
                        <span className="flex items-center gap-2.5 font-semibold">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: catColor(category.color) }} />
                          {category.name}
                        </span>
                      </td>
                      <td className="pl-3 text-right tabular-nums">{money(amount_cents)}</td>
                      <td className="pl-3 text-right text-muted-foreground tabular-nums">{((amount_cents / data.expense_cents) * 100).toFixed(1)}%</td>
                      <td className={`pl-3 text-right whitespace-nowrap tabular-nums ${over ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                        {limit === undefined ? 'No limit' : over ? `${moneyWhole(amount_cents - limit)} over` : `${moneyWhole(limit - amount_cents)} left`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Recent({ data, onAdd }: { data: DashboardSummary; onAdd: () => void }) {
  return (
    <section className="surface flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-bold">Recent transactions</h2>
        <Button variant="ghost" size="sm" className="text-brand-ink" render={<Link to="/transactions" />} nativeButton={false}>
          View all
        </Button>
      </div>
      {data.recent.length === 0 ? (
        <EmptyState
          title="No transactions this month"
          action={
            <Button variant="outline" onClick={onAdd}>
              <Plus />
              Add transaction
            </Button>
          }
        >
          Add your first one here, or tell the assistant what you spent.
        </EmptyState>
      ) : (
        <ul>
          {data.recent.map((t) => (
            <li key={t.id} className="flex items-center gap-3 border-t py-2.5">
              <CategoryChip icon={t.category.icon} color={t.category.color} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{t.description || t.category.name}</span>
                <span className="text-xs text-muted-foreground">{t.category.name}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className={`font-bold tabular-nums ${t.kind === 'income' ? 'text-good' : ''}`}>{signedMoney(t.amount_cents, t.kind)}</span>
                <span className="text-xs text-muted-foreground">{dayShort(t.occurred_on)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
