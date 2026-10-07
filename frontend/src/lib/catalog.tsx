import {
  BriefcaseBusiness,
  Bus,
  Heart,
  House,
  Laptop,
  type LucideIcon,
  Music,
  ShoppingBag,
  Utensils,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'

// Keys match backend/app/catalog.py.
export const ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: 'Home', icon: House },
  food: { label: 'Food', icon: Utensils },
  bus: { label: 'Transport', icon: Bus },
  music: { label: 'Entertainment', icon: Music },
  bag: { label: 'Shopping', icon: ShoppingBag },
  heart: { label: 'Health', icon: Heart },
  briefcase: { label: 'Work', icon: BriefcaseBusiness },
  laptop: { label: 'Laptop', icon: Laptop },
  zap: { label: 'Utilities', icon: Zap },
}

export const COLORS: Record<string, string> = {
  blue: 'Blue',
  peach: 'Peach',
  mint: 'Mint',
  yellow: 'Yellow',
  pink: 'Pink',
  green: 'Green',
  lavender: 'Lavender',
  coral: 'Coral',
}

export const catColor = (color: string) => `var(--cat-${color in COLORS ? color : 'blue'})`
export const catSoft = (color: string) => `var(--cat-${color in COLORS ? color : 'blue'}-soft)`

/** The category's icon on its pastel tint. `onTint` is for chips sitting on a tinted card. */
export function CategoryChip({
  icon,
  color,
  onTint = false,
  className,
}: {
  icon: string
  color: string
  onTint?: boolean
  className?: string
}) {
  const Icon = (ICONS[icon] ?? ICONS.bag).icon
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', className)}
      style={{ background: onTint ? 'var(--card)' : catSoft(color), color: catColor(color) }}
    >
      <Icon className="size-[1.1rem]" strokeWidth={2.2} aria-hidden />
    </span>
  )
}
