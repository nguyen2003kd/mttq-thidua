import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(from: number | string | Date, to: number | string | Date): number {
  const startOfDay = (v: number | string | Date) => {
    const d = new Date(v)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000)
}
