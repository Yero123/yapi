import { ArrowLeftRight, LayoutDashboard, type LucideIcon, Moon, Sparkles, Tag } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { ChatPanel } from '@/components/chat-panel'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
]

// Below this width the assistant is a full-screen sheet and starts closed.
const WIDE = '(min-width: 1024px)'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
        <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 4l6 8 6-8M12 12v8" />
        </svg>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[0.9375rem] font-bold">Yapi</span>
        <span className="text-xs text-muted-foreground">Personal finance</span>
      </div>
    </div>
  )
}

function ThemeSwitch({ className }: { className?: string }) {
  const { dark, setDark } = useAppState()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={() => setDark(!dark)}
      className={cn('flex h-11 items-center gap-2.5 rounded-lg px-2.5 font-semibold text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
    >
      <Moon className="size-[1.05rem]" aria-hidden />
      <span className="flex-1 text-left">Dark mode</span>
      <span className={cn('flex h-[26px] w-[46px] rounded-full p-[3px] shadow-inset transition-colors', dark ? 'justify-end bg-primary' : 'justify-start bg-background')}>
        <span className="size-5 rounded-full bg-card shadow-[2px_2px_5px_rgb(0_0_0/0.25)]" />
      </span>
    </button>
  )
}

export function AppShell() {
  const [chatOpen, setChatOpen] = useState(() => window.matchMedia(WIDE).matches)

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col gap-6 px-3 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-2.5 rounded-lg px-2.5 font-semibold text-secondary-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'text-brand-ink shadow-inset hover:bg-transparent',
                )
              }
            >
              <Icon className="size-[1.05rem]" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <ThemeSwitch />
          <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-card p-3 shadow-raise-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted font-bold text-secondary-foreground">G</span>
              <div className="flex flex-col leading-tight">
                <span className="font-bold">Guest</span>
                <span className="text-xs text-muted-foreground">No account needed</span>
              </div>
            </div>
            <button type="button" disabled className="flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-lg border text-[0.8125rem] font-medium text-muted-foreground">
              Sign in with Google
              <span className="rounded-full bg-muted px-1.5 py-px text-[0.6875rem] text-secondary-foreground">Soon</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 md:hidden">
          <Logo />
          <ThemeSwitch className="[&>span:nth-child(2)]:sr-only" />
        </div>
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pt-6 pb-28 md:px-8 md:pt-7 md:pb-12">
          {!chatOpen && (
            <Button variant="outline" className="hidden self-end md:inline-flex" onClick={() => setChatOpen(true)}>
              <Sparkles />
              Ask Yapi
            </Button>
          )}
          <Outlet />
        </main>
      </div>

      {chatOpen && (
        <aside aria-label="Assistant" className="max-lg:fixed max-lg:inset-0 max-lg:z-40 lg:sticky lg:top-0 lg:h-dvh lg:w-96 lg:shrink-0 lg:py-4 lg:pr-4">
          <ChatPanel onClose={() => setChatOpen(false)} />
        </aside>
      )}

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-card px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn('flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground', isActive && 'text-brand-ink')
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
        <button type="button" onClick={() => setChatOpen(true)} className="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
          <Sparkles className="size-5" aria-hidden />
          Ask Yapi
        </button>
      </nav>
    </div>
  )
}
