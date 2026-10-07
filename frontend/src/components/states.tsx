import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-muted', className)} />
}

export function LoadingBlocks({ count = 3, className = 'h-32' }: { count?: number; className?: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface flex flex-col items-start gap-3 p-6" role="alert">
      <div className="flex items-center gap-2 font-semibold">
        <CircleAlert className="size-4 text-destructive" aria-hidden />
        Your data could not be loaded
      </div>
      <p className="text-muted-foreground">Check your connection and that the server is running, then try again.</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 py-6">
      <div className="font-semibold">{title}</div>
      {children && <p className="max-w-prose text-muted-foreground">{children}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
