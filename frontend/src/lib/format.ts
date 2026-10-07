import type { Kind } from '@/lib/api'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const money = (cents: number) => usd.format(cents / 100)
export const moneyWhole = (cents: number) => usdWhole.format(Math.round(cents / 100))
export const signedMoney = (cents: number, kind: Kind) => `${kind === 'income' ? '+' : '-'}${money(cents)}`

/** "12.50" -> 1250; null when the text is not a positive amount. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const cents = Math.round(Number(cleaned) * 100)
  return cents > 0 ? cents : null
}

export const amountText = (cents: number) => (cents / 100).toFixed(2)

const pad = (n: number) => String(n).padStart(2, '0')

export function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const currentMonth = () => today().slice(0, 7)

export function addMonths(month: string, count: number): string {
  const [year, index] = month.split('-').map(Number)
  const total = year * 12 + (index - 1) + count
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

function monthDate(month: string): Date {
  const [year, index] = month.split('-').map(Number)
  return new Date(year, index - 1, 1)
}

export const monthLong = (month: string) => monthDate(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
export const monthName = (month: string) => monthDate(month).toLocaleDateString('en-US', { month: 'long' })
export const monthShort = (month: string) => monthDate(month).toLocaleDateString('en-US', { month: 'short' })

export function dayShort(isoDate: string, withYear = false): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

/** "+17.1% vs Aug", or null when there is nothing to compare against. */
export function deltaLabel(current: number, previous: number, month: string): string | null {
  if (!previous) return null
  const change = ((current - previous) / previous) * 100
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs ${monthShort(addMonths(month, -1))}`
}
