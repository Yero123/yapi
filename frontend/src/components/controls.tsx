import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useAppState } from '@/lib/app-state'
import { addMonths, currentMonth, monthLong } from '@/lib/format'
import { cn } from '@/lib/utils'

/** A sunk track with the chosen option raised out of it. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('flex gap-0.5 rounded-xl bg-background p-1 shadow-inset', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-9 flex-1 rounded-lg px-3 text-[0.8125rem] font-semibold whitespace-nowrap text-muted-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
            option.value === value && 'bg-card text-foreground shadow-raise-sm',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function MonthPicker() {
  const { month, setMonth } = useAppState()
  return (
    <div className="flex items-center gap-1 rounded-xl border border-edge bg-card p-1 shadow-raise-sm">
      <Button variant="ghost" size="icon-lg" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center font-semibold" aria-live="polite">
        {monthLong(month)}
      </span>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Next month"
        disabled={month >= currentMonth()}
        onClick={() => setMonth(addMonths(month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </header>
  )
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
